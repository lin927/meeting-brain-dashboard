import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execLark } from '../lark-exec.js';
import { cliOutputText } from '../cli-bin.js';
import { parseJsonText, unwrapCli, asArray, pick, parseTime, monthWindows, lookbackRange } from '../cli-json.js';
import { open, listDeletedUuids } from '../db.js';
import { ingestNormalized, transcriptFromText, meetingNeedsRefresh } from '../ingest.js';
import { localId, remoteIdOf } from './ids.js';

function yieldLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function runLark(args, extra = {}) {
  try {
    const r = await execLark(args, extra);
    const json = parseJsonText(cliOutputText(r));
    if (!json) {
      if (extra.soft) return null;
      throw new Error(cliOutputText(r).replace(/\s+/g, ' ').slice(0, 160) || 'lark-cli 无 JSON');
    }
    try { return unwrapCli(json); }
    catch (e) {
      if (extra.soft) return null;
      throw e;
    }
  } catch (e) {
    if (extra.soft) return null;
    throw e;
  }
}

function jsonFromExec(r) {
  if (!r) return null;
  return parseJsonText(r.stdout || r.text || '') || parseJsonText(cliOutputText(r));
}

async function larkRaw(args, extra = {}) {
  try {
    return jsonFromExec(await execLark(args, extra));
  } catch (e) {
    const json = jsonFromExec(e);
    if (json) return json;
    if (extra.soft) return null;
    throw e;
  }
}

function userFromStatus(st) {
  const raw = st && typeof st === 'object' ? st : {};
  return raw.identities?.user || raw.user || {};
}

function userLoggedIn(user) {
  if (!user || !user.userName) return false;
  const st = String(user.tokenStatus || user.status || '').toLowerCase();
  if (/needs_login|logged.?out|invalid|revoked|not.?configured/.test(st)) return false;
  if (/valid|ready|ok|needs_refresh/.test(st)) return true;
  return user.available !== false && !st;
}

export async function authStatus() {
  try {
    const st = await larkRaw(['auth', 'status', '--json'], { timeout: 20000, soft: true });
    const subtype = st && st.error && st.error.subtype;
    if (subtype === 'not_configured') {
      return {
        authenticated: false,
        user: null,
        configured: false,
        error: '未绑定飞书应用',
        loginCmd: 'lark-cli config init --new --brand feishu --lang zh',
      };
    }
    const user = userFromStatus(st);
    if (userLoggedIn(user)) {
      return {
        authenticated: true,
        user: String(user.userName),
        configured: true,
        loginCmd: 'lark-cli auth login --domain minutes',
      };
    }
    const cfg = await larkRaw(['config', 'show'], { timeout: 15000, soft: true });
    const configured = !!(cfg && (cfg.appId || cfg.app_id) && !(cfg.error && cfg.error.subtype === 'not_configured'));
    if (!configured) {
      return {
        authenticated: false,
        user: null,
        configured: false,
        error: '未绑定飞书应用',
        loginCmd: 'lark-cli config init --new --brand feishu --lang zh',
      };
    }
    return {
      authenticated: false,
      user: null,
      configured: true,
      loginCmd: 'lark-cli auth login --domain minutes',
    };
  } catch (e) {
    const msg = String((e && e.message) || e);
    const missing = /未找到 lark-cli|ENOENT/.test(msg);
    return {
      authenticated: false,
      user: null,
      configured: false,
      error: missing ? '未安装 lark-cli' : msg.slice(0, 120),
      loginCmd: missing ? 'npm install -g @larksuite/cli' : 'lark-cli config init --new --brand feishu --lang zh',
    };
  }
}

function searchItems(json) {
  const root = json && json.items ? json : (json && json.data) || json || {};
  return asArray(root.items || root.minutes || root.list || root);
}

function minuteToken(item) {
  return String(pick(item, ['minute_token', 'minuteToken', 'token', 'id']) || '').trim();
}

async function searchOnce(args) {
  const json = await runLark(['minutes', '+search', ...args, '--as', 'user', '--format', 'json', '--page-size', '30'], {
    timeout: 60000,
    soft: true,
  });
  return json || { items: [], has_more: false };
}

async function searchPaged(baseArgs, { maxPages = 40 } = {}) {
  const out = [];
  let token = '';
  for (let i = 0; i < maxPages; i++) {
    const args = token ? [...baseArgs, '--page-token', token] : baseArgs;
    const json = await searchOnce(args);
    const items = searchItems(json);
    out.push(...items);
    const more = json.has_more ?? json.hasMore;
    const next = json.page_token ?? json.pageToken ?? json.next_page_token;
    if (!more || !next || next === token) break;
    if (!items.length) break;
    token = String(next);
  }
  return out;
}

async function listMinutes({ full = false } = {}) {
  const { start, end } = lookbackRange({ full });
  const windows = monthWindows(start, end);
  const seen = new Set();
  const all = [];
  for (const w of windows) {
    const batches = [
      ['--owner-ids', 'me', '--start', w.start, '--end', w.end],
      ['--participant-ids', 'me', '--start', w.start, '--end', w.end],
    ];
    for (const args of batches) {
      const items = await searchPaged(args);
      for (const it of items) {
        const token = minuteToken(it);
        if (!token || seen.has(token)) continue;
        seen.add(token);
        all.push(it);
      }
    }
  }
  return all;
}

function parseDurationMs(text) {
  const s = String(text || '');
  const m = s.match(/时长[:：]\s*(?:(\d+)\s*小时)?\s*(?:(\d+)\s*分)?\s*(?:(\d+)\s*秒)?/);
  if (!m) return null;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const sec = Number(m[3] || 0);
  const ms = ((h * 3600) + (min * 60) + sec) * 1000;
  return ms > 0 ? ms : null;
}

function parseFeishuSearchText(item) {
  const meta = item && item.meta_data && typeof item.meta_data === 'object' ? item.meta_data : {};
  const display = String(item && item.display_info || '');
  const desc = String(meta.description || meta.desc || '');
  const blob = [display, desc].filter(Boolean).join('\n');
  const titleLine = display.split('\n').map((x) => x.trim()).find(Boolean) || '';
  const timeM = blob.match(/开始时间[:：]\s*(\d{4}[./-]\d{1,2}[./-]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/);
  const start = parseTime(timeM ? timeM[1] : '') || parseTime(pick(item, ['create_time', 'createTime', 'start_time', 'startTime', 'begin_time']));
  const durationMs = parseDurationMs(blob);
  return {
    title: pick(item, ['title', 'topic', 'name']) || titleLine || '未命名会议',
    start_time: start,
    duration_ms: durationMs,
    end_time: (start && durationMs) ? start + durationMs : null,
    url: pick(meta, ['app_link', 'url', 'share_url']) || pick(item, ['url', 'share_url', 'shareUrl']) || '',
  };
}

function listMeta(item) {
  const token = minuteToken(item);
  const parsed = parseFeishuSearchText(item);
  return {
    remote_id: token,
    task_uuid: localId('feishu', token),
    title: parsed.title,
    start_time: parsed.start_time,
    end_time: parsed.end_time,
    duration_ms: parsed.duration_ms,
    url: parsed.url || (token ? `https://www.feishu.cn/minutes/${token}` : ''),
    source: 'mine',
    owner: pick(item, ['owner_id', 'ownerId', 'owner']),
  };
}

function parseTodos(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((t) => {
    if (typeof t === 'string') return { title: t };
    return {
      title: t.content ?? t.title ?? t.text ?? t.todo,
      minutes_todo_id: t.id ?? t.todo_id,
    };
  }).filter((t) => t.title);
}

function parseKeywords(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw.map((k) => (typeof k === 'string' ? k : (k.keyword || k.name || k.text))).filter(Boolean);
  }
  return null;
}

function attendeesFrom(detail, summary) {
  const names = [];
  const people = detail.participants || detail.attendees || [];
  if (Array.isArray(people)) {
    for (const p of people) {
      const n = typeof p === 'string' ? p : (p.name || p.user_name || p.nickname);
      if (n) names.push(n);
    }
  }
  if (names.length) return names.join('、');
  const m = String(summary || '').match(/参与人[：:*\s]*([^\n]+)/);
  return m ? m[1].trim() : null;
}

async function fetchDetail(token, { strict = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'mb-fs-'));
  try {
    const json = await runLark([
      'minutes', '+detail',
      '--minute-tokens', token,
      '--summary', '--todo', '--keyword', '--transcript',
      '--overwrite',
      '--output-dir', dir,
      '--as', 'user',
      '--format', 'json',
    ], { timeout: 4 * 60 * 1000, cwd: dir });
    const minutes = asArray(json.minutes || json);
    const row = minutes.find((x) => minuteToken(x) === token) || minutes[0] || json;
    const artifacts = row.artifacts || {};
    let transcript = [];
    const file = artifacts.transcript_file || artifacts.transcriptFile;
    if (file) {
      try { transcript = transcriptFromText(readFileSync(file, 'utf8')); }
      catch { /* empty */ }
    }
    if (!transcript.length && artifacts.transcript) {
      transcript = Array.isArray(artifacts.transcript)
        ? artifacts.transcript
        : transcriptFromText(artifacts.transcript);
    }
    const summary = artifacts.summary || row.summary || '';
    return {
      title: row.title || row.topic,
      url: row.url,
      start_time: parseTime(row.create_time || row.start_time),
      summary,
      keywords: parseKeywords(artifacts.keywords || row.keywords),
      todos: parseTodos(artifacts.todos || row.todos),
      transcript,
      attendees: attendeesFrom(row, summary),
      note_id: row.note_id || row.noteId,
    };
  } catch (e) {
    if (strict) throw e;
    console.error(`  (飞书详情跳过) ${String(e.message || e).replace(/\s+/g, ' ').slice(0, 80)}`);
    return null;
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

async function ingestOne(db, meta, { strict = false, log = () => {} } = {}) {
  const detail = await fetchDetail(meta.remote_id, { strict });
  if (strict && !detail) throw new Error('飞书妙记读不到，本机未改');
  const d = detail || {};
  return ingestNormalized(db, {
    task_uuid: meta.task_uuid,
    provider: 'feishu',
    remote_id: meta.remote_id,
    remote_json: { minute_token: meta.remote_id, note_id: d.note_id || '', owner: meta.owner || '' },
    title: d.title || meta.title,
    start_time: d.start_time || meta.start_time,
    end_time: d.end_time || meta.end_time,
    duration_ms: d.duration_ms || meta.duration_ms,
    url: d.url || meta.url,
    source: meta.source || 'mine',
    summary: d.summary || '',
    keywords: d.keywords,
    attendees: d.attendees,
    todos: d.todos || [],
    transcript: d.transcript || [],
  }, { log });
}

export async function pull({ maxUuid = 300, skipExisting = true, quiet = false, onProgress = null, full = false } = {}) {
  const db = open();
  const log = quiet ? () => {} : (msg) => console.log(msg);
  const report = (p) => { try { onProgress && onProgress({ ...p, provider: 'feishu' }); } catch { /* ignore */ } };
  report({ phase: 'list', current: 0, total: 0 });
  const listed = await listMinutes({ full });
  log(`[feishu] 发现 ${listed.length} 条妙记`);
  const deleted = new Set(listDeletedUuids(db));
  const metas = listed.map(listMeta).filter((m) => m.remote_id && !deleted.has(m.task_uuid));
  const targets0 = metas.slice(0, maxUuid);
  const targets = skipExisting
    ? targets0.filter((m) => meetingNeedsRefresh(db, m.task_uuid))
    : targets0;
  report({ phase: 'pull', current: 0, total: targets.length });
  let done = 0;
  for (const meta of targets) {
    try {
      await ingestOne(db, meta, { log });
    } catch (e) {
      console.error(`  ✗ 飞书落库失败 ${meta.remote_id}: ${e.message}`);
    }
    done += 1;
    report({ phase: 'pull', current: done, total: targets.length, title: meta.title || '' });
    await yieldLoop();
  }
  db.close();
  return targets.length;
}

export async function refresh(meeting) {
  const token = remoteIdOf(meeting);
  if (!token) throw new Error('缺少妙记 token');
  const db = open();
  try {
    return await ingestOne(db, {
      task_uuid: meeting.task_uuid,
      remote_id: token,
      title: meeting.title,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      duration_ms: meeting.duration_ms,
      url: meeting.url,
      source: meeting.source || 'mine',
    }, { strict: true, log: (msg) => console.log(msg) });
  } finally {
    db.close();
  }
}

export async function writeTitle(meeting, title) {
  const token = remoteIdOf(meeting);
  await runLark(['minutes', '+update', '--minute-token', token, '--topic', title, '--as', 'user', '--format', 'json'], { timeout: 30000 });
}

export async function writeSummary(meeting, content) {
  const token = remoteIdOf(meeting);
  const dir = mkdtempSync(join(tmpdir(), 'mb-fs-sum-'));
  const file = join(dir, 'summary.md');
  try {
    writeFileSync(file, String(content || ''), 'utf8');
    await runLark([
      'minutes', '+summary',
      '--minute-token', token,
      '--summary', '@summary.md',
      '--as', 'user',
      '--format', 'json',
    ], { cwd: dir, timeout: 60000 });
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
