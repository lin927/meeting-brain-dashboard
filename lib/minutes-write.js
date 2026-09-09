// 把本机改过的听记标题写回钉钉。导入场次没有对应听记，不调用 DWS。
// 用 `update title`（无需 --yes）；不要用 `+update`（会要确认）。

import { execFileSync } from 'node:child_process';

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

function deniedResult() {
  return {
    ok: false,
    status: 'denied',
    message: '本机已保存，钉钉侧无编辑权，标题只改了本系统',
  };
}

function errorResult(raw) {
  const short = String(raw || '未知错误').replace(/\s+/g, ' ').slice(0, 80);
  return {
    ok: false,
    status: 'error',
    message: '本机已保存，钉钉听记标题未改：' + short,
  };
}

function isDenied(text) {
  return /permission|denied|forbidden|无权限|没有权限|not minutes creator|not.*creator|auth_permission|access denied/.test(text);
}

function parseJson(text) {
  const s = stripBom(String(text || '')).trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch {}
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

/**
 * 同步改钉钉听记标题。调用方应已先写入本机；失败不抛、不回滚。
 */
export function updateDingTalkTitle({ taskUuid, title, source } = {}) {
  const id = String(taskUuid || '');
  const next = String(title || '').trim();
  if (!id) return errorResult('缺少听记 id');
  if (!next) return errorResult('标题为空');
  if (source === 'import' || id.startsWith('import-')) {
    return {
      ok: true,
      status: 'skipped_import',
      message: '本机已保存，导入场次没有对应的钉钉听记',
    };
  }

  try {
    const out = execFileSync('dws', [
      'minutes', 'update', 'title',
      '--id', id,
      '--title', next,
      '--format', 'json',
    ], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      maxBuffer: 4 * 1024 * 1024,
      timeout: 30000,
    });
    const json = parseJson(out);
    if (looksFailed(json)) {
      const text = blobOf(null, json);
      if (isDenied(text)) return deniedResult();
      return errorResult(json.errorMsg || json.error || json.message || out);
    }
    return {
      ok: true,
      status: 'updated',
      message: '本机已保存，钉钉听记标题已改',
    };
  } catch (e) {
    const json = parseJson(e.stdout || '');
    const text = blobOf(e, json);
    if (isDenied(text)) return deniedResult();
    if (looksFailed(json)) return errorResult(json.errorMsg || json.error || json.message || e.message);
    return errorResult(e.stderr || e.stdout || e.message);
  }
}
