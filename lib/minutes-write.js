// 把本机改过的听记标题、纪要（「记录」）写回钉钉。
// 导入场次没有对应听记，不调用 DWS。
// 标题用 `update title`；纪要用 `+summary --content @file --yes`，避免 Windows 命令行过长。

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execDws, dwsOutputText } from './dws-exec.js';

function stripBom(s) {
  if (typeof s !== 'string') return s;
  return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

function blobOf(err, json) {
  const parts = [
    err && err.message,
    err && err.stdout,
    err && err.stderr,
    json && JSON.stringify(json),
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function deniedResult(kind) {
  return {
    ok: false,
    status: 'denied',
    message: '本机已保存，钉钉侧无编辑权，' + kind + '只改了本系统',
  };
}

function errorResult(kind, raw) {
  const short = String(raw || '未知错误').replace(/\s+/g, ' ').slice(0, 80);
  return {
    ok: false,
    status: 'error',
    message: '本机已保存，钉钉听记' + kind + '未改：' + short,
  };
}

function skippedImport(kind) {
  return {
    ok: true,
    status: 'skipped_import',
    message: '本机已保存，导入场次没有对应的钉钉听记',
  };
}

function isDenied(text) {
  return /permission|denied|forbidden|无权限|没有权限|not minutes creator|not.*creator|auth_permission|access denied/.test(text);
}

function parseJson(text) {
  const s = stripBom(String(text || '')).trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch { /* ignore */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function looksFailed(json) {
  if (!json || typeof json !== 'object') return false;
  if (json.success === false) return true;
  if (json.errorCode && json.errorCode !== '0' && json.errorCode !== 0) return true;
  const msg = String(json.errorMsg || json.error || json.message || '');
  return /fail|error|denied|权限/i.test(msg) && json.success !== true;
}

function finishWrite(kind, out, err) {
  const json = parseJson(out || (err && (err.stdout || err.stderr)) || '');
  const text = blobOf(err || null, json);
  if (isDenied(text)) return deniedResult(kind);
  if (looksFailed(json)) {
    return errorResult(kind, json.errorMsg || json.error || json.message || out || (err && err.message));
  }
  if (err && !json) return errorResult(kind, err.stderr || err.stdout || err.message);
  return {
    ok: true,
    status: 'updated',
    message: kind === '标题' ? '本机已保存，钉钉听记标题已改' : '本机已保存，钉钉纪要已改',
  };
}

function isImport(source, id) {
  return source === 'import' || String(id || '').startsWith('import-');
}

/**
 * 同步改钉钉听记标题。调用方应已先写入本机；失败不抛、不回滚。
 */
export async function updateDingTalkTitle({ taskUuid, title, source } = {}) {
  const id = String(taskUuid || '');
  const next = String(title || '').trim();
  if (!id) return errorResult('标题', '缺少听记 id');
  if (!next) return errorResult('标题', '标题为空');
  if (isImport(source, id)) return skippedImport('标题');

  try {
    const r = await execDws([
      'minutes', 'update', 'title',
      '--id', id,
      '--title', next,
      '--format', 'json',
    ], { maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
    return finishWrite('标题', dwsOutputText(r));
  } catch (e) {
    return finishWrite('标题', dwsOutputText(e), e);
  }
}

function preserveImages(original, next) {
  const src = String(original || '');
  const dst = String(next || '');
  const imgs = src.match(/!\[[^\]]*\]\([^)]+\)/g) || [];
  let out = dst;
  for (const img of imgs) {
    if (!out.includes(img)) out = out.replace(/\s*$/, '') + '\n\n' + img;
  }
  return out;
}

function summaryFromJson(json) {
  if (!json || typeof json !== 'object') return '';
  const obj = json.summary?.result ?? json.result ?? json.summary ?? json;
  if (typeof obj === 'string') return obj;
  if (obj && typeof obj.fullSummary === 'string') return obj.fullSummary;
  if (obj && typeof obj.summary === 'string') return obj.summary;
  if (obj && typeof obj.content === 'string') return obj.content;
  return '';
}

async function remoteSummaryText(id) {
  try {
    const r = await execDws(['minutes', 'get', 'summary', '--id', id, '--format', 'json'], { timeout: 20000 });
    return summaryFromJson(parseJson(dwsOutputText(r))) || '';
  } catch {
    return '';
  }
}

function unknownPlusSummary(err) {
  const t = dwsOutputText(err).toLowerCase();
  return /unknown command|not found|\+summary/.test(t) || err.code === 'ENOENT';
}

/**
 * 全量覆盖钉钉听记纪要。调用方应已先写入本机；失败不抛、不回滚。
 */
export async function updateDingTalkSummary({ taskUuid, content, source } = {}) {
  const id = String(taskUuid || '');
  if (!id) return errorResult('纪要', '缺少听记 id');
  if (isImport(source, id)) return skippedImport('纪要');

  const remote = await remoteSummaryText(id);
  const next = preserveImages(remote, content == null ? '' : String(content));
  const dir = mkdtempSync(join(tmpdir(), 'mb-sum-'));
  const file = join(dir, 'summary.md');
  writeFileSync(file, next, 'utf8');
  try {
    try {
      const r = await execDws([
        'minutes', '+summary',
        '--id', id,
        '--content', '@summary.md',
        '--yes',
        '--format', 'json',
      ], { cwd: dir, timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
      return finishWrite('纪要', dwsOutputText(r));
    } catch (e) {
      if (!unknownPlusSummary(e)) return finishWrite('纪要', dwsOutputText(e), e);
      try {
        const r = await execDws([
          'minutes', 'update', 'summary',
          '--id', id,
          '--content', '@summary.md',
          '--format', 'json',
        ], { cwd: dir, timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
        return finishWrite('纪要', dwsOutputText(r));
      } catch (e2) {
        return finishWrite('纪要', dwsOutputText(e2), e2);
      }
    }
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
