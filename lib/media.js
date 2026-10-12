// 按需把听记录音拉到本机。定时同步不走这里。
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { execDws, dwsOutputText } from './dws-exec.js';
import { parseJsonText, pick } from './cli-json.js';
import { open, getMeeting, updateMeetingFields } from './db.js';
import { inferProvider, canDownloadMedia, remoteIdOf } from './providers/ids.js';
import * as feishu from './providers/feishu.js';
import * as tencent from './providers/tencent.js';

const MEDIA_DIR = join(homedir(), '.dsh', 'meetings', 'media');
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

function getProxyUrl() {
  const keys = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy'];
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

export function mediaDir() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  return MEDIA_DIR;
}

export function mediaSafeId(taskUuid) {
  return String(taskUuid || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'media';
}

export function mediaAbsPath(rel) {
  if (!rel) return '';
  if (rel.startsWith('/') || /^[A-Za-z]:[\\/]/.test(rel)) return rel;
  return join(mediaDir(), rel);
}

function extFromMime(mime) {
  const s = String(mime || '').split(';')[0].trim().toLowerCase();
  if (s === 'audio/mpeg' || s === 'audio/mp3') return '.mp3';
  if (s === 'audio/mp4' || s === 'audio/aac' || s === 'audio/x-m4a') return '.m4a';
  if (s === 'audio/wav' || s === 'audio/x-wav') return '.wav';
  if (s === 'audio/ogg') return '.ogg';
  if (s === 'video/mp4') return '.mp4';
  if (s === 'video/quicktime') return '.mov';
  if (s === 'video/webm') return '.webm';
  return '';
}

function extFromUrl(url) {
  try {
    const path = new URL(url).pathname;
    const ext = extname(path).toLowerCase();
    if (['.mp3', '.mp4', '.m4a', '.wav', '.aac', '.mov', '.webm', '.ogg'].includes(ext)) return ext;
  } catch { /* ignore */ }
  return '';
}

function kindFromExt(ext) {
  if (['.mp4', '.mov', '.webm'].includes(ext)) return 'video';
  return 'audio';
}

function mimeFromExt(ext) {
  return {
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
  }[ext] || 'application/octet-stream';
}

function unlinkIfExists(p) {
  if (p && existsSync(p)) {
    try { unlinkSync(p); } catch { /* ignore */ }
  }
}

function isTencentPlayerUrl(url) {
  try {
    const u = new URL(String(url || ''));
    return /(^|\.)meeting\.tencent\.com$/i.test(u.hostname) && /\/(ctw|cw|crw|crm)\//i.test(u.pathname);
  } catch {
    return false;
  }
}

export function removeMeetingMedia(taskUuid) {
  const db = open();
  const row = getMeeting(db, taskUuid);
  if (row && row.media_path) unlinkIfExists(mediaAbsPath(row.media_path));
  db.close();
  const stem = mediaSafeId(taskUuid);
  try {
    for (const name of readdirSync(mediaDir())) {
      if (name === stem || name.startsWith(stem + '.') || name.startsWith(stem + '-dl')) unlinkIfExists(join(mediaDir(), name));
    }
  } catch { /* ignore */ }
}

export function mediaStatus(meeting) {
  const canDownload = canDownloadMedia(meeting);
  const rel = meeting && meeting.media_path ? String(meeting.media_path) : '';
  const abs = rel ? mediaAbsPath(rel) : '';
  const exists = !!(abs && existsSync(abs));
  const bytes = exists ? (Number(meeting.media_bytes) || statSync(abs).size) : 0;
  return {
    canDownload,
    exists,
    bytes: exists ? bytes : 0,
    kind: exists ? (meeting.media_kind || kindFromExt(extname(abs))) : '',
    mime: exists ? (meeting.media_mime || mimeFromExt(extname(abs))) : '',
    downloadedAt: exists ? (Number(meeting.media_downloaded_at) || 0) : 0,
    fileUrl: exists ? ('/api/meeting/media-file?id=' + encodeURIComponent(meeting.task_uuid || meeting.taskUuid || '')) : '',
    playbackUrl: isTencentPlayerUrl(meeting && meeting.url) ? String(meeting.url) : '',
  };
}

async function resolveDingTalk(meeting) {
  const id = String(meeting.task_uuid || '');
  let json = null;
  try {
    const r = await execDws(['minutes', '+download', '--id', id, '--url-only', '--format', 'json'], { timeout: 60000 });
    json = parseJsonText(dwsOutputText(r));
  } catch (e) {
    json = parseJsonText(dwsOutputText(e));
  }
  const row = json && Array.isArray(json.results) ? json.results[0] : null;
  if (row && row.url) return { url: String(row.url) };
  let audio = null;
  try {
    const r = await execDws(['minutes', 'get', 'audio', '--id', id, '--format', 'json'], { timeout: 60000 });
    audio = parseJsonText(dwsOutputText(r));
  } catch (e) {
    audio = parseJsonText(dwsOutputText(e));
  }
  const result = (audio && audio.result) || audio || {};
  const reason = String(result.filterReason || result.filter_reason || '');
  if (reason === 'VOIP_NOT_SUPPORTED') throw new Error('钉钉语音通话不提供录音文件');
  const url = pick(result, ['videoUrl', 'audioUrl', 'url', 'video_url', 'audio_url']);
  if (url) return { url: String(url) };
  const fail = (json && json.failures && json.failures[0] && json.failures[0].error)
    || (json && json.error && json.error.message);
  throw new Error(String(fail || '这场听记没有可下载的录音（可能已过期、无痕或未生成）').slice(0, 160));
}

async function resolveSource(meeting) {
  const p = inferProvider(meeting);
  if (p === 'feishu') return feishu.resolveMedia(meeting);
  if (p === 'tencent') return tencent.resolveMedia(meeting);
  if (p === 'dingtalk') return resolveDingTalk(meeting);
  throw new Error('导入场次没有录音文件');
}

function looksHtml(contentType, url) {
  const t = String(contentType || '').toLowerCase();
  if (t.includes('text/html')) return true;
  return isTencentPlayerUrl(url);
}

async function streamToFile(url, dest, { timeoutMs = DOWNLOAD_TIMEOUT_MS } = {}) {
  const proxy = getProxyUrl();
  const httpMod = await import('node:http');
  const httpsMod = await import('node:https');
  const tlsMod = await import('node:tls');

  function requestOnce(target, redirects) {
    return new Promise((resolve, reject) => {
      if (redirects > 8) {
        reject(new Error('下载跳转过多'));
        return;
      }
      let parsed;
      try { parsed = new URL(target); }
      catch {
        reject(new Error('录音地址无效'));
        return;
      }
      const isHttps = parsed.protocol === 'https:';
      const headers = {
        'User-Agent': 'Mozilla/5.0 meeting-brain',
        Accept: '*/*',
      };
      const timer = setTimeout(() => {
        try { req.destroy(new Error('下载超时')); } catch { /* ignore */ }
      }, timeoutMs);
      const onRes = (res) => {
        const loc = res.headers.location;
        if (res.statusCode >= 300 && res.statusCode < 400 && loc) {
          clearTimeout(timer);
          const next = new URL(loc, parsed).href;
          requestOnce(next, redirects + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode >= 400) {
          clearTimeout(timer);
          reject(new Error('下载失败 HTTP ' + res.statusCode));
          return;
        }
        const mime = String(res.headers['content-type'] || '');
        if (looksHtml(mime, target)) {
          clearTimeout(timer);
          res.resume();
          const err = new Error('PLAYBACK_PAGE');
          err.playbackUrl = target;
          reject(err);
          return;
        }
        mkdirSync(dirname(dest), { recursive: true });
        const tmp = dest;
        unlinkIfExists(tmp);
        const out = createWriteStream(tmp);
        let bytes = 0;
        res.on('data', (chunk) => {
          bytes += chunk.length;
          if (bytes > MAX_BYTES) {
            res.destroy();
            out.destroy();
            unlinkIfExists(tmp);
            reject(new Error('录音文件超过 2 GB，未保存'));
          }
        });
        pipeline(res, out).then(() => {
          clearTimeout(timer);
          resolve({ tmp, bytes, mime, url: target });
        }).catch((e) => {
          clearTimeout(timer);
          unlinkIfExists(tmp);
          reject(e);
        });
      };
      let req;
      const fail = (e) => {
        clearTimeout(timer);
        reject(new Error('下载失败：' + String((e && e.message) || e).slice(0, 120)));
      };
      if (proxy && proxy.startsWith('http://') && isHttps) {
        const p = new URL(proxy);
        const connectReq = httpMod.request({
          hostname: p.hostname,
          port: p.port || 80,
          method: 'CONNECT',
          path: `${parsed.hostname}:${parsed.port || 443}`,
          headers: { Host: `${parsed.hostname}:${parsed.port || 443}` },
        });
        connectReq.on('connect', (cres, socket) => {
          if (cres.statusCode !== 200) {
            fail(new Error('代理 CONNECT 失败: ' + cres.statusCode));
            return;
          }
          req = httpsMod.request({
            hostname: parsed.hostname,
            port: parsed.port || 443,
            method: 'GET',
            path: parsed.pathname + parsed.search,
            headers,
            createConnection: () => tlsMod.connect({ socket, servername: parsed.hostname, rejectUnauthorized: false }),
          }, onRes);
          req.on('error', fail);
          req.end();
        });
        connectReq.on('error', fail);
        connectReq.end();
        return;
      }
      const lib = isHttps ? httpsMod : httpMod;
      req = lib.request({
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        method: 'GET',
        path: parsed.pathname + parsed.search,
        headers,
      }, onRes);
      req.on('error', fail);
      req.end();
    });
  }

  return requestOnce(url, 0);
}

function extFromMagic(file) {
  try {
    const buf = Buffer.alloc(16);
    const fd = openSync(file, 'r');
    try { readSync(fd, buf, 0, 16, 0); }
    finally { closeSync(fd); }
    const s = buf.toString('latin1');
    if (s.includes('ftyp')) return '.mp4';
    if (s.startsWith('ID3') || buf[0] === 0xff) return '.mp3';
    if (s.startsWith('RIFF')) return '.wav';
    if (s.startsWith('OggS')) return '.ogg';
  } catch { /* ignore */ }
  return '';
}

function finishFile(taskUuid, tmp, mime, sourceUrl) {
  const ext = extFromMime(mime) || extFromUrl(sourceUrl) || extFromMagic(tmp) || '.bin';
  const rel = mediaSafeId(taskUuid) + ext;
  const abs = join(mediaDir(), rel);
  unlinkIfExists(abs);
  renameSync(tmp, abs);
  const st = statSync(abs);
  const kind = kindFromExt(ext);
  const db = open();
  const prev = getMeeting(db, taskUuid);
  if (prev && prev.media_path && prev.media_path !== rel) unlinkIfExists(mediaAbsPath(prev.media_path));
  updateMeetingFields(db, taskUuid, {
    media_path: rel,
    media_bytes: st.size,
    media_kind: kind,
    media_mime: mimeFromExt(ext),
    media_downloaded_at: Date.now(),
  });
  db.close();
  return { rel, abs, bytes: st.size, kind, mime: mimeFromExt(ext), ext };
}

async function downloadViaCli(meeting, destStem) {
  const p = inferProvider(meeting);
  const dir = mediaDir();
  if (p === 'feishu') {
    const token = remoteIdOf(meeting);
    const out = join(dir, destStem + '.bin');
    unlinkIfExists(out);
    await feishuCliDownload(token, out);
    if (!existsSync(out) || statSync(out).size < 32) throw new Error('飞书下载未写出文件');
    return { tmp: out, mime: '', url: '' };
  }
  if (p === 'dingtalk') {
    const rel = destStem + '.bin';
    const out = join(dir, rel);
    unlinkIfExists(out);
    const r = await execDws(
      ['minutes', '+download', '--id', meeting.task_uuid, '--output', rel, '--format', 'json'],
      { cwd: dir, timeout: DOWNLOAD_TIMEOUT_MS },
    );
    const json = parseJsonText(dwsOutputText(r));
    const saved = json && json.results && json.results[0] && (json.results[0].path || json.results[0].output);
    const file = saved ? (saved.startsWith('/') ? saved : join(dir, saved)) : out;
    if (!existsSync(file) || statSync(file).size < 32) throw new Error('钉钉下载未写出文件');
    return { tmp: file, mime: '', url: saved || '' };
  }
  throw new Error('这个来源不能用命令行落文件');
}

async function feishuCliDownload(token, out) {
  const { execLark } = await import('./lark-exec.js');
  await execLark([
    'minutes', '+download',
    '--minute-tokens', token,
    '--output', out,
    '--overwrite',
    '--format', 'json',
  ], { timeout: DOWNLOAD_TIMEOUT_MS });
}

export async function downloadMeetingMedia(taskUuid) {
  const db = open();
  const meeting = getMeeting(db, taskUuid);
  db.close();
  if (!meeting) throw new Error('未找到会议');
  if (!canDownloadMedia(meeting)) throw new Error('这场会没有可下载的录音');
  const resolved = await resolveSource(meeting);
  if (resolved && resolved.url) {
    const tmp = join(mediaDir(), mediaSafeId(taskUuid) + '.part');
    try {
      const got = await streamToFile(resolved.url, tmp);
      const saved = finishFile(taskUuid, got.tmp, got.mime, got.url || resolved.url);
      return { downloaded: true, playbackUrl: resolved.playbackUrl || '', ...saved };
    } catch (e) {
      unlinkIfExists(tmp);
      if (e && e.message === 'PLAYBACK_PAGE' && (e.playbackUrl || resolved.playbackUrl)) {
        return { downloaded: false, playbackUrl: e.playbackUrl || resolved.playbackUrl };
      }
      if (inferProvider(meeting) === 'tencent' && resolved.playbackUrl) {
        return { downloaded: false, playbackUrl: resolved.playbackUrl };
      }
      try {
        const via = await downloadViaCli(meeting, mediaSafeId(taskUuid) + '-dl');
        const saved = finishFile(taskUuid, via.tmp, via.mime, via.url || resolved.url);
        return { downloaded: true, playbackUrl: resolved.playbackUrl || '', ...saved };
      } catch {
        throw e;
      }
    }
  }
  if (resolved && resolved.playbackUrl) {
    return { downloaded: false, playbackUrl: resolved.playbackUrl };
  }
  throw new Error('没有可下载的录音地址');
}

export function mediaFileFor(taskUuid) {
  const db = open();
  const meeting = getMeeting(db, taskUuid);
  db.close();
  if (!meeting || !meeting.media_path) return null;
  const abs = mediaAbsPath(meeting.media_path);
  if (!existsSync(abs)) return null;
  const ext = extname(abs);
  return {
    abs,
    mime: meeting.media_mime || mimeFromExt(ext),
    name: (meeting.title || '录音') + ext,
    bytes: Number(meeting.media_bytes) || statSync(abs).size,
  };
}
