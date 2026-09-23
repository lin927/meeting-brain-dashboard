import { execTmeet } from '../tmeet-exec.js';
import { cliOutputText } from '../cli-bin.js';
import { parseJsonText, unwrapCli, asArray, pick, parseTime, lookbackRange, dayWindows, isoLocal } from '../cli-json.js';
import { open, listDeletedUuids, getMeeting, updateMeetingFields } from '../db.js';
import { ingestNormalized, meetingNeedsRefresh } from '../ingest.js';
import { localId, tencentYuanbaoId, remoteIdOf, parseRemoteJson } from './ids.js';

function yieldLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function runTmeet(args, extra = {}) {
  try {
    const r = await execTmeet(args, extra);
    const json = parseJsonText(r.stdout || r.text || '') || parseJsonText(cliOutputText(r));
    if (!json) {
      if (extra.soft) return null;
      throw new Error(cliOutputText(r).replace(/\s+/g, ' ').slice(0, 160) || 'tmeet 无 JSON');
    }
    try {
      return unwrapCli(json);
    } catch (e) {
      if (extra.soft) return null;
      throw e;
    }
  } catch (e) {
    if (extra.soft) {
      const json = parseJsonText((e && e.stdout) || '') || parseJsonText(cliOutputText(e));
      if (json) {
        try { return unwrapCli(json); } catch { return null; }
      }
      return null;
    }
    throw e;
  }
}

export async function authStatus() {
  try {
    const text = cliOutputText(await execTmeet(['auth', 'status'], { timeout: 20000 }));
    const json = parseJsonText(text);
    const loggedOut = /not logged in|未登录/i.test(text);
    const fromText = (text.match(/UserName:\s*(\S+)/) || text.match(/user_name["\s:]+([^"\s]+)/i) || [])[1];
    const user = (json && (json.user_name || json.userName || json.nick_name || json.openid || json.open_id)) || fromText;
    return {
      authenticated: !loggedOut && !!(user || /valid|ok|logged|已登录|openid/i.test(text)),
      user: user ? String(user) : null,
      loginCmd: 'tmeet auth login',
    };
  } catch (e) {
    const msg = String((e && e.message) || e);
    const missing = /未找到 tmeet|ENOENT/.test(msg);
    return {
      authenticated: false,
      user: null,
      error: missing ? '未安装 tmeet' : msg.slice(0, 120),
      loginCmd: missing ? 'npm install -g @tencentcloud/tmeet' : 'tmeet auth login',
    };
  }
}

async function paged(args, listKeys, { maxPages = 40 } = {}) {
  const out = [];
  let token = '';
  for (let i = 0; i < maxPages; i++) {
    const extra = token ? ['--page-token', token] : [];
    const json = await runTmeet([...args, ...extra, '--page-size', '30'], { timeout: 60000, soft: true });
    if (!json) break;
    let batch = [];
    for (const k of listKeys) {
      const v = json[k];
      if (Array.isArray(v) && v.length) { batch = v; break; }
    }
    if (!batch.length) batch = asArray(json);
    out.push(...batch);
    const next = json.next_page_token || json.nextPageToken || json.page_token;
    if (!next || next === token || !batch.length) break;
    token = String(next);
  }
  return out;
}

function recordFiles(row) {
  const files = row.record_files || row.recordFiles || row.files || row.file_list || [];
  if (Array.isArray(files) && files.length) return files;
  if (row.record_file_id || row.recordFileId) return [row];
  return [];
}

function preferFile(files) {
  const scored = files.map((f) => {
    const type = String(f.file_type || f.fileType || f.media_type || '').toLowerCase();
    let n = 0;
    if (/transcript|trans/.test(type)) n += 3;
    if (/video/.test(type)) n += 2;
    if (/audio/.test(type)) n += 1;
    return { f, n };
  });
  scored.sort((a, b) => b.n - a.n);
  return (scored[0] && scored[0].f) || files[0];
}

function fileId(f) {
  return String(pick(f, ['record_file_id', 'recordFileId', 'file_id', 'fileId', 'id']) || '').trim();
}

async function listByWindows(cmdArgs, listKeys, { full = false } = {}) {
  const { start, end } = lookbackRange({ full });
  const windows = dayWindows(start, end, 30).reverse();
  const out = [];
  for (const w of windows) {
    const batch = await paged([
      ...cmdArgs,
      '--start', w.startIso,
      '--end', w.endIso,
    ], listKeys);
    out.push(...batch);
  }
  return out;
}

async function listRecords({ full = false } = {}) {
  return listByWindows(['record', 'list'], ['record_meetings', 'record_list', 'meeting_record_list', 'records', 'list'], { full });
}

function flattenRecords(rows, { allFiles = false } = {}) {
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    const files = recordFiles(row);
    const chosen = files.length ? (allFiles ? files : [preferFile(files)]) : [];
    for (const f of chosen) {
      const id = fileId(f);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const start = parseTime(
        pick(f, ['record_start_time', 'media_start_time', 'start_time', 'startTime'])
        || pick(row, ['media_start_time', 'record_start_time', 'start_time', 'startTime', 'begin_time']),
      );
      const end = parseTime(
        pick(f, ['record_end_time', 'media_end_time', 'end_time', 'endTime'])
        || pick(row, ['media_end_time', 'record_end_time', 'end_time', 'endTime']),
      );
      out.push({
        remote_id: id,
        task_uuid: localId('tencent', id),
        title: pick(row, ['subject', 'title', 'meeting_subject']) || pick(f, ['file_name', 'fileName', 'title']) || '未命名会议',
        start_time: start,
        end_time: end,
        duration_ms: (start && end && end > start) ? (end - start) : null,
        record_size: Number(pick(f, ['record_size', 'recordSize', 'file_size']) || pick(row, ['record_size']) || 0) || 0,
        record_type: String(pick(row, ['record_type', 'recordType']) || ''),
        url: pick(f, ['sharing_url', 'share_url', 'shareUrl', 'url']) || pick(row, ['sharing_url', 'share_url', 'url']) || '',
        meeting_id: String(pick(row, ['meeting_id', 'meetingId']) || ''),
        meeting_record_id: String(pick(row, ['meeting_record_id', 'meetingRecordId', 'record_id']) || ''),
        source: 'mine',
      });
    }
  }
  return out;
}

function textJoin(parts) {
  return parts.filter(Boolean).join('\n\n').trim();
}

function parseSmartMinutes(json) {
  const root = json && typeof json === 'object' ? json : {};
  const mm = root.meeting_minute || root.meetingMinute || {};
  const summary = textJoin([
    mm.minute,
    mm.summary,
    typeof root.minute === 'string' ? root.minute : '',
    root.summary,
    root.smart_minutes,
    typeof root.minutes === 'string' ? root.minutes : '',
    Array.isArray(root.minutes) ? root.minutes.map((x) => x.content || x.summary || x.minute).join('\n') : '',
  ]);
  let todosRaw = root.todos || root.todo_list || root.action_items || mm.todos || [];
  if ((!Array.isArray(todosRaw) || !todosRaw.length) && (mm.todo || root.todo)) {
    todosRaw = String(mm.todo || root.todo).split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  const todos = (Array.isArray(todosRaw) ? todosRaw : []).map((t) => ({
    title: typeof t === 'string' ? t : (t.content || t.title || t.text),
  })).filter((t) => t.title);
  const attendees = Array.isArray(root.attendees)
    ? root.attendees.map((p) => (typeof p === 'string' ? p : p.user_name || p.nick_name || p.name)).filter(Boolean).join('、')
    : '';
  return { summary, todos, attendees };
}

function speakerName(p) {
  const s = p && p.speaker;
  if (typeof s === 'string') return s;
  if (s && typeof s === 'object') return s.user_name || s.nick_name || s.name || '';
  return (p && (p.user_name || p.nick_name || p.name)) || '';
}

function paragraphText(p) {
  if (typeof p === 'string') return p;
  if (!p || typeof p !== 'object') return '';
  if (p.text || p.content || p.sentence || p.paragraph) {
    return p.text || p.content || p.sentence || p.paragraph;
  }
  const sentences = Array.isArray(p.sentences) ? p.sentences : [];
  const bits = [];
  for (const s of sentences) {
    if (typeof s === 'string') { bits.push(s); continue; }
    if (s && (s.text || s.content)) { bits.push(s.text || s.content); continue; }
    const words = (s && s.words) || [];
    bits.push(words.map((w) => (typeof w === 'string' ? w : (w && w.text) || '')).join(''));
  }
  return bits.join('');
}

function parseParagraphs(json) {
  const root = json && typeof json === 'object' ? json : {};
  const minutes = root.minutes && typeof root.minutes === 'object' && !Array.isArray(root.minutes)
    ? root.minutes
    : null;
  const list = (minutes && minutes.paragraphs)
    || root.paragraphs
    || root.paragraph_list
    || root.list
    || root.sentences
    || asArray(root);
  return list.map((p) => {
    if (typeof p === 'string') return { text: p };
    return { speaker: speakerName(p), text: paragraphText(p), end_time: p.end_time || p.endTime };
  }).filter((p) => p.text);
}

async function fetchRecord(meta, { strict = false } = {}) {
  let smart = {};
  let paras = [];
  try {
    const sm = await runTmeet(['record', 'smart-minutes', '--record-file-id', meta.remote_id, '--lang', 'zh'], { timeout: 60000, soft: true });
    smart = parseSmartMinutes(sm || {});
  } catch (e) {
    if (strict) throw e;
  }
  try {
    let pid = '';
    const seen = new Set();
    for (let i = 0; i < 40; i++) {
      const args = ['record', 'transcript-get', '--record-file-id', meta.remote_id, '--limit', '50'];
      if (pid) args.push('--pid', pid);
      const tx = await runTmeet(args, { timeout: 4 * 60 * 1000, soft: true });
      if (!tx) break;
      const batch = parseParagraphs(tx);
      let added = 0;
      for (const p of batch) {
        const key = `${p.speaker || ''}\t${p.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        paras.push(p);
        added += 1;
      }
      const minutes = tx.minutes && typeof tx.minutes === 'object' ? tx.minutes : tx;
      const plist = minutes.paragraphs || [];
      const last = plist[plist.length - 1];
      const nextPid = last && last.pid != null ? String(last.pid) : '';
      if (!tx.more || !nextPid || nextPid === pid || !added) break;
      pid = nextPid;
    }
  } catch (e) {
    if (strict) throw e;
  }
  if (!smart.attendees && paras.length) {
    const names = [...new Set(paras.map((p) => p.speaker).filter(Boolean))];
    smart.attendees = names.join('、');
  }
  if (strict && !smart.summary && !paras.length) throw new Error('腾讯录制读不到纪要或转写');
  return { ...smart, transcript: paras };
}

function parseClockToMs(v) {
  const s = String(v || '').trim();
  if (!s) return 0;
  const parts = s.split(':').map((x) => Number(x));
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return 0;
  if (parts.length === 3) return Math.round(((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000);
  if (parts.length === 2) return Math.round(((parts[0] * 60) + parts[1]) * 1000);
  return 0;
}

function durationFromClocks(list) {
  let max = 0;
  for (const p of list || []) {
    if (!p || typeof p !== 'object') continue;
    const t = parseClockToMs(p.end_time || p.endTime);
    if (t > max) max = t;
  }
  return max || 0;
}

function durationFromPayload(json) {
  const root = json && typeof json === 'object' ? json : {};
  return durationFromClocks(root.pids || root.paragraphs || [])
    || durationFromClocks((root.minutes && root.minutes.paragraphs) || []);
}

function durationFromSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 40000) return 0;
  return Math.round(n * 1000 / 16384);
}

function resolveDurationMs(listSpan, transcriptMs, recordSize) {
  const span = Number(listSpan) || 0;
  const tx = Number(transcriptMs) || 0;
  const fromSize = durationFromSize(recordSize);
  if (span >= 30000) return span;
  if (tx >= 1000) return tx;
  if (fromSize >= 1000) return fromSize;
  return span || tx || fromSize || 0;
}

async function fetchParagraphDuration(fileId) {
  const tx = await runTmeet(['record', 'transcript-paragraphs', '--record-file-id', fileId], { timeout: 60000, soft: true });
  return durationFromPayload(tx || {});
}

function applyDuration(meta, transcriptMs) {
  const listSpan = (meta.start_time && meta.end_time && meta.end_time > meta.start_time)
    ? (meta.end_time - meta.start_time)
    : (Number(meta.duration_ms) || 0);
  const durationMs = resolveDurationMs(listSpan, transcriptMs, meta.record_size);
  if (!durationMs) return meta;
  return {
    ...meta,
    duration_ms: durationMs,
    end_time: meta.start_time ? (meta.start_time + durationMs) : meta.end_time,
  };
}

async function patchStoredDuration(db, meta) {
  const row = getMeeting(db, meta.task_uuid);
  if (!row) return;
  const cur = Number(row.duration_ms) || 0;
  if (cur >= 30000) return;
  const listSpan = Number(meta.duration_ms) || 0;
  let transcriptMs = 0;
  if (listSpan < 30000) {
    const size = Number(meta.record_size) || 0;
    if (size >= 40000 || size === 0) {
      try { transcriptMs = await fetchParagraphDuration(meta.remote_id); }
      catch { transcriptMs = 0; }
    }
  }
  const next = applyDuration(meta, transcriptMs);
  const dur = Number(next.duration_ms) || 0;
  if (!dur || dur === cur) return;
  updateMeetingFields(db, meta.task_uuid, { duration_ms: dur, end_time: next.end_time || row.end_time });
}

async function lookupRecordMeta(meta) {
  const fileIdWanted = String(meta.remote_id || '').trim();
  const meetingId = String(meta.meeting_id || '').trim();
  let rows = [];
  if (meetingId) {
    rows = await paged(['record', 'list', '--meeting-id', meetingId], ['record_meetings', 'record_list', 'meeting_record_list', 'records', 'list'], { maxPages: 8 });
  } else if (meta.start_time) {
    const t = Number(meta.start_time);
    if (Number.isFinite(t) && t > 0) {
      rows = await paged([
        'record', 'list',
        '--start', isoLocal(t - 2 * 3600 * 1000),
        '--end', isoLocal(t + 2 * 3600 * 1000),
      ], ['record_meetings', 'record_list', 'meeting_record_list', 'records', 'list'], { maxPages: 8 });
    }
  }
  if (!rows.length) return null;
  const flat = flattenRecords(rows, { allFiles: true });
  return flat.find((x) => x.remote_id === fileIdWanted) || (flat.length === 1 ? flat[0] : null);
}

async function ingestRecord(db, meta, { strict = false, log = () => {}, refreshMeta = false } = {}) {
  let m = { ...meta };
  if (refreshMeta) {
    try {
      const fresh = await lookupRecordMeta(meta);
      if (fresh) {
        if (fresh.title) m.title = fresh.title;
        if (fresh.start_time) m.start_time = fresh.start_time;
        if (fresh.end_time) m.end_time = fresh.end_time;
        if (fresh.duration_ms) m.duration_ms = fresh.duration_ms;
        if (fresh.record_size) m.record_size = fresh.record_size;
        if (fresh.url) m.url = fresh.url;
        if (fresh.meeting_id) m.meeting_id = fresh.meeting_id;
        if (fresh.meeting_record_id) m.meeting_record_id = fresh.meeting_record_id;
      }
    } catch (e) {
      if (strict) console.error(`  (腾讯标题刷新跳过) ${String(e.message || e).replace(/\s+/g, ' ').slice(0, 80)}`);
    }
  }
  const d = await fetchRecord(m, { strict });
  m = applyDuration(m, durationFromClocks(d.transcript));
  return ingestNormalized(db, {
    task_uuid: m.task_uuid,
    provider: 'tencent',
    remote_id: m.remote_id,
    remote_json: {
      kind: 'record',
      record_file_id: m.remote_id,
      meeting_id: m.meeting_id || '',
      meeting_record_id: m.meeting_record_id || '',
    },
    title: m.title,
    start_time: m.start_time,
    end_time: m.end_time,
    duration_ms: m.duration_ms,
    url: m.url,
    source: 'mine',
    summary: d.summary || '',
    attendees: d.attendees || '',
    todos: d.todos || [],
    transcript: d.transcript || [],
  }, { log });
}

function firstMinute(root) {
  const list = root && root.minutes;
  if (Array.isArray(list) && list[0] && typeof list[0] === 'object') return list[0];
  return root || {};
}

function parseYuanbao(json) {
  const root = json && typeof json === 'object' ? json : {};
  const mm = firstMinute(root);
  const overview = mm.overview || root.overview || root.summary || '';
  const pointsRaw = mm.summary_points ?? root.summary_points;
  const points = Array.isArray(pointsRaw)
    ? pointsRaw.map((p) => (typeof p === 'string' ? p : p.content || p.text)).filter(Boolean)
    : [];
  const pointsText = Array.isArray(pointsRaw)
    ? (points.length ? ('要点\n' + points.map((p) => '- ' + p).join('\n')) : '')
    : (typeof pointsRaw === 'string' ? pointsRaw.trim() : '');
  const summary = textJoin([overview, pointsText]);
  const todosRaw = mm.todos || root.todos || root.todo_list || [];
  const todos = (Array.isArray(todosRaw) ? todosRaw : []).map((t) => ({
    title: typeof t === 'string' ? t : (t.content || t.title),
  })).filter((t) => t.title);
  return {
    summary,
    todos,
    title: root.subject || mm.subject || root.title || mm.title,
    start_time: parseTime(
      pick(mm, ['created_at', 'start_time', 'minute_start_time'])
      || pick(root, ['minute_start_time', 'start_time', 'media_start_time', 'record_start_time', 'begin_time', 'created_at']),
    ),
    meeting_id: String(root.meeting_id || mm.meeting_id || ''),
  };
}

function mergeDetail(item, json) {
  const out = { ...(item || {}) };
  if (!json || typeof json !== 'object') return out;
  for (const [k, v] of Object.entries(json)) {
    if (v == null || v === '') continue;
    out[k] = v;
  }
  return out;
}

function findYuanbaoTarget(db, meetingId, minuteId) {
  const byMeet = findByMeetingId(db, meetingId);
  if (byMeet) return byMeet;
  if (!minuteId) return null;
  const uuid = tencentYuanbaoId(minuteId);
  return db.prepare(`SELECT * FROM meetings WHERE task_uuid = ?`).get(uuid)
    || db.prepare(`SELECT * FROM meetings WHERE provider = 'tencent' AND remote_id = ?`).get(minuteId)
    || null;
}

async function listYuanbao({ full = false } = {}) {
  return listByWindows(['minutes', 'search'], ['minutes', 'minute_list', 'list', 'items'], { full });
}

function findByMeetingId(db, meetingId) {
  if (!meetingId) return null;
  const rows = db.prepare(`SELECT * FROM meetings WHERE provider = 'tencent'`).all();
  for (const row of rows) {
    const extra = parseRemoteJson(row);
    if (String(extra.meeting_id || '') === String(meetingId)) return row;
  }
  return null;
}

async function ingestYuanbao(db, item, { log = () => {}, force = false } = {}) {
  const minuteId = String(pick(item, ['minute_id', 'minuteId', 'id']) || '').trim();
  const meetingId = String(pick(item, ['meeting_id', 'meetingId']) || '');
  if (!minuteId && !meetingId) return;
  const existing0 = findYuanbaoTarget(db, meetingId, minuteId);
  if (!force && existing0 && existing0.start_time && String(existing0.summary || '').trim()) return;
  let detail = item;
  try {
    const args = minuteId
      ? ['minutes', 'get', '--minute-id', minuteId]
      : ['minutes', 'get', '--meeting-id', meetingId];
    const json = await runTmeet(args, { timeout: 60000, soft: true });
    if (json) detail = mergeDetail(item, json);
  } catch { /* use list item */ }
  const parsed = parseYuanbao(detail);
  const existing = findYuanbaoTarget(db, meetingId || parsed.meeting_id, minuteId);
  if (existing) {
    const extra = { ...parseRemoteJson(existing), minute_id: minuteId, kind: extraKind(existing) };
    if (meetingId && !extra.meeting_id) extra.meeting_id = meetingId;
    const start = parsed.start_time || existing.start_time;
    const summary = (force ? (parsed.summary || existing.summary) : (existing.summary || parsed.summary)) || '';
    const title = parsed.title || existing.title;
    if (force || start !== existing.start_time || title !== existing.title || (parsed.summary && !existing.summary)) {
      ingestNormalized(db, {
        task_uuid: existing.task_uuid,
        provider: 'tencent',
        remote_id: existing.remote_id,
        remote_json: extra,
        title,
        start_time: start,
        url: existing.url,
        source: existing.source || 'mine',
        summary,
        todos: (parsed.todos && parsed.todos.length) ? parsed.todos : undefined,
        attendees: existing.attendees,
        transcript: undefined,
      }, { skipTranscript: true, log });
    }
    return;
  }
  if (!minuteId) return;
  ingestNormalized(db, {
    task_uuid: tencentYuanbaoId(minuteId),
    provider: 'tencent',
    remote_id: minuteId,
    remote_json: { kind: 'yuanbao', minute_id: minuteId, meeting_id: meetingId || parsed.meeting_id || '' },
    title: parsed.title || pick(item, ['subject', 'title']) || '未命名会议',
    start_time: parsed.start_time || parseTime(pick(item, ['minute_start_time', 'start_time', 'create_time', 'created_at'])),
    url: pick(item, ['url', 'share_url']) || '',
    source: 'mine',
    summary: parsed.summary,
    todos: parsed.todos,
    transcript: [],
  }, { log });
}

function extraKind(row) {
  const extra = parseRemoteJson(row);
  return extra.kind || 'record';
}

export async function pull({ maxUuid = 300, skipExisting = true, quiet = false, onProgress = null, full = false } = {}) {
  const db = open();
  const log = quiet ? () => {} : (msg) => console.log(msg);
  const report = (p) => { try { onProgress && onProgress({ ...p, provider: 'tencent' }); } catch { /* ignore */ } };
  report({ phase: 'list', current: 0, total: 0 });
  const raw = await listRecords({ full });
  const metas = flattenRecords(raw);
  log(`[tencent] 发现 ${metas.length} 条录制`);
  const deleted = new Set(listDeletedUuids(db));
  const visible = metas.filter((m) => !deleted.has(m.task_uuid));
  const targets0 = visible.slice(0, maxUuid);
  const targets = skipExisting
    ? targets0.filter((m) => meetingNeedsRefresh(db, m.task_uuid))
    : targets0;
  report({ phase: 'pull', current: 0, total: targets.length });
  let done = 0;
  for (const meta of targets) {
    try {
      await ingestRecord(db, meta, { log });
    } catch (e) {
      console.error(`  ✗ 腾讯录制落库失败 ${meta.remote_id}: ${e.message}`);
    }
    done += 1;
    report({ phase: 'pull', current: done, total: targets.length, title: meta.title || '' });
    await yieldLoop();
  }
  for (const meta of visible) {
    try { await patchStoredDuration(db, meta); }
    catch { /* 已入库场次时长回填失败不阻断同步 */ }
    await yieldLoop();
  }
  try {
    const yb = await listYuanbao({ full });
    log(`[tencent] 发现 ${yb.length} 条元宝纪要`);
    for (const item of yb.slice(0, maxUuid)) {
      try { await ingestYuanbao(db, item, { log }); }
      catch (e) { console.error(`  ✗ 元宝纪要跳过: ${e.message}`); }
      await yieldLoop();
    }
  } catch (e) {
    log(`[tencent] 元宝纪要未拉：${String(e.message || e).slice(0, 80)}`);
  }
  db.close();
  return targets.length;
}

export async function repairShortDurations({ log = () => {} } = {}) {
  const db = open();
  try {
    const rows = db.prepare(`
      SELECT task_uuid, title, remote_id, start_time, end_time, duration_ms, remote_json
      FROM meetings WHERE provider = 'tencent'
    `).all();
    let n = 0;
    for (const row of rows) {
      const extra = parseRemoteJson(row);
      if (extra.kind === 'yuanbao') continue;
      const cur = Number(row.duration_ms) || 0;
      if (cur >= 30000) continue;
      const remoteId = String(row.remote_id || extra.record_file_id || '').trim();
      if (!/^\d+$/.test(remoteId)) continue;
      let transcriptMs = 0;
      try { transcriptMs = await fetchParagraphDuration(remoteId); }
      catch { transcriptMs = 0; }
      const dur = resolveDurationMs(cur, transcriptMs, 0);
      if (!dur || dur === cur) continue;
      updateMeetingFields(db, row.task_uuid, {
        duration_ms: dur,
        end_time: row.start_time ? (row.start_time + dur) : row.end_time,
      });
      n += 1;
      log(`  时长 ${row.title || remoteId}: ${Math.round(dur / 60000)}分钟`);
      await yieldLoop();
    }
    return n;
  } finally {
    db.close();
  }
}

export async function refresh(meeting) {
  const extra = parseRemoteJson(meeting);
  const db = open();
  try {
    if (extra.kind === 'yuanbao') {
      await ingestYuanbao(db, {
        minute_id: remoteIdOf(meeting),
        meeting_id: extra.meeting_id,
        title: meeting.title,
        start_time: meeting.start_time,
      }, { log: (msg) => console.log(msg), force: true });
      const row = db.prepare(`SELECT title FROM meetings WHERE task_uuid = ?`).get(meeting.task_uuid);
      return { ok: true, title: (row && row.title) || meeting.title, keptRecord: false, keptTranscript: false, transcriptCount: 0 };
    }
    return await ingestRecord(db, {
      task_uuid: meeting.task_uuid,
      remote_id: remoteIdOf(meeting),
      title: meeting.title,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      duration_ms: meeting.duration_ms,
      url: meeting.url,
      meeting_id: extra.meeting_id,
      meeting_record_id: extra.meeting_record_id,
    }, { strict: true, refreshMeta: true, log: (msg) => console.log(msg) });
  } finally {
    db.close();
  }
}
