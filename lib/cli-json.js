export function stripBom(s) {
  if (typeof s !== 'string') return s;
  return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

function firstJsonValue(s) {
  const start = s.search(/[\{\[]/);
  if (start < 0) return null;
  const open = s[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) {
        try { return JSON.parse(s.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

export function parseJsonText(text) {
  const s = stripBom(String(text || '')).trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch { /* ignore */ }
  return firstJsonValue(s);
}

/** 剥飞书 CLI `{ok,data}` 或腾讯 `{code,data}` 外壳。 */
export function unwrapCli(json) {
  if (!json || typeof json !== 'object') return json;
  if (json.ok === false) {
    const err = json.error || {};
    const msg = err.message || json.message || json.msg || '命令失败';
    const e = new Error(String(msg));
    e.cli = json;
    throw e;
  }
  if (json.code != null && json.code !== 0 && json.code !== '0' && json.ok !== true) {
    if (!/ok|success/i.test(String(json.code))) {
      const e = new Error(String(json.msg || json.message || ('错误码 ' + json.code)));
      e.cli = json;
      throw e;
    }
  }
  if (json.data && typeof json.data === 'object') return json.data;
  return json;
}

export function asArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (Array.isArray(v.items)) return v.items;
  if (Array.isArray(v.list)) return v.list;
  if (Array.isArray(v.minutes)) return v.minutes;
  if (Array.isArray(v.record_meetings)) return v.record_meetings;
  if (Array.isArray(v.record_list)) return v.record_list;
  return [];
}

export function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

export function parseTime(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v > 1e12) return Math.floor(v);
    if (v > 1e9) return Math.floor(v * 1000);
    return Math.floor(v);
  }
  const s = String(v).trim();
  if (/^\d{10,13}$/.test(s)) {
    const n = Number(s);
    return s.length <= 10 ? n * 1000 : n;
  }
  const dotted = s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dotted) {
    const d = new Date(
      Number(dotted[1]),
      Number(dotted[2]) - 1,
      Number(dotted[3]),
      Number(dotted[4] || 0),
      Number(dotted[5] || 0),
      Number(dotted[6] || 0),
    );
    const t = d.getTime();
    return Number.isFinite(t) ? t : null;
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export function isoLocal(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+08:00`;
}

export function ymdLocal(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 按自然月切开，飞书妙记搜索最长一个月。 */
export function monthWindows(startMs, endMs) {
  const out = [];
  const start = new Date(startMs);
  const end = new Date(endMs);
  let y = start.getFullYear();
  let m = start.getMonth();
  const endY = end.getFullYear();
  const endM = end.getMonth();
  while (y < endY || (y === endY && m <= endM)) {
    const fromMs = (y === start.getFullYear() && m === start.getMonth())
      ? startMs
      : new Date(y, m, 1, 0, 0, 0, 0).getTime();
    const toMs = (y === endY && m === endM)
      ? endMs
      : new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();
    out.push({ start: ymdLocal(fromMs), end: ymdLocal(toMs), startIso: isoLocal(fromMs), endIso: isoLocal(toMs) });
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return out;
}

/** 按最多 N 天切开。腾讯录制/纪要列表最长 31 天。 */
export function dayWindows(startMs, endMs, maxDays = 30) {
  const out = [];
  const step = Math.max(1, Number(maxDays) || 30) * 24 * 3600 * 1000;
  let from = Number(startMs);
  const end = Number(endMs);
  if (!Number.isFinite(from) || !Number.isFinite(end) || from >= end) return out;
  while (from < end) {
    const to = Math.min(from + step, end);
    if (to <= from) break;
    out.push({
      startMs: from,
      endMs: to,
      startIso: isoLocal(from),
      endIso: isoLocal(to),
    });
    from = to;
  }
  return out;
}

export function lookbackRange({ full = false } = {}) {
  const end = Date.now();
  const start = full
    ? new Date(end - 24 * 30 * 24 * 3600 * 1000).getTime()
    : new Date(end - 90 * 24 * 3600 * 1000).getTime();
  return { start, end };
}
