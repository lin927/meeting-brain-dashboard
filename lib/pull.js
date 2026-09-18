// 从钉钉 DWS 拉取听记并结构化落库。
// 兼容两个 DWS CLI 版本：
//   - 新版（v1.0.58+）：dws minutes +list-all / +detail --artifacts
//   - 旧版（v1.0.5x，如同事的 1.0.51）：dws minutes list all / get info|summary|todos|transcription
// 按版本探测自动选择语法，统一归一化为 {task_uuid, title, ...}。

import { execDws } from './dws-exec.js';
import { open, upsertMeeting, clearActions, insertAction, clearChunks, insertChunk, getMeeting, listDeletedUuids } from './db.js';
import { classifyNewMeeting } from './classify.js';

function yieldLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

// 探测 DWS CLI 版本风格：返回 'new'（+list-all）或 'legacy'（list all）。
// 通过试跑命令判断，避免解析版本号的脆弱性。
let _cliStyle = null;
async function detectCliStyle() {
  if (_cliStyle) return _cliStyle;
  // 新语法优先：+list-all 存在则用新版命令集
  try {
    const out = await runDwsRaw(['minutes', '+list-all', '--limit', '1', '--format', 'json']);
    if (out && (out.minutes || out.result?.itemList)) {
      _cliStyle = 'new';
      return _cliStyle;
    }
  } catch { /* 新版不支持，落旧版 */ }
  _cliStyle = 'legacy';
  return _cliStyle;
}

/** 原始执行 dws，返回解析后的 JSON 或 null（soft）。 */
async function runDwsRaw(args, opts = {}) {
  try {
    const { stdout } = await execDws(args, { timeout: opts.timeout, maxBuffer: opts.maxBuffer });
    return JSON.parse(stripBom(stdout));
  } catch (e) {
    if (opts.soft) {
      const txt = stripBom(e.stdout || '');
      const jsonMatch = txt.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]); } catch {}
      }
      return null;
    }
    throw e;
  }
}

// 剥离 UTF-8 BOM（Windows 管道/控制台常带 \uFEFF，会让 JSON.parse 失败）
function stripBom(s) {
  if (typeof s !== 'string') return s;
  return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

function runDws(args, extra = {}) {
  return runDwsRaw(args, extra);
}

function transcriptParagraphs(txRes) {
  if (!txRes || typeof txRes !== 'object') return [];
  const list = txRes.paragraphList
    ?? txRes.transcript?.paragraphList
    ?? txRes.result?.paragraphList
    ?? txRes.result?.paragraphs
    ?? (Array.isArray(txRes.result) ? txRes.result : []);
  return Array.isArray(list) ? list : [];
}

async function fetchTranscriptParagraphs(style, taskUuid, { strict = false } = {}) {
  try {
    if (style === 'new') {
      // +transcript 默认追完 nextToken；禁止 --single-page（一页最多 50 段）
      const txRes = await runDws(['minutes', '+transcript', '--id', taskUuid, '--format', 'json'], { timeout: 4 * 60 * 1000 }) ?? {};
      return transcriptParagraphs(txRes);
    }
    const all = [];
    const seen = new Set();
    let token = '';
    for (let i = 0; i < 100; i++) {
      const args = ['minutes', 'get', 'transcription', '--id', taskUuid, '--format', 'json'];
      if (token) args.push('--next-token', token);
      const txRes = await runDws(args) ?? {};
      for (const p of transcriptParagraphs(txRes)) {
        const key = String(p.paragraphId || '') + '\0' + String(p.startTime || '') + '\0' + String(p.paragraph || p.text || '');
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(p);
      }
      const next = String(txRes.nextToken ?? txRes.result?.nextToken ?? '').trim();
      if (!next || next === token) break;
      token = next;
    }
    return all;
  } catch (e) {
    const raw = String((e && (e.message || e.code)) || e);
    const timedOut = e && (e.killed || e.code === 'ETIMEDOUT' || /ETIMEDOUT|timed out/i.test(raw));
    if (strict && timedOut) throw new Error('钉钉逐字稿拉了太久（超过 4 分钟），本机未改完。可稍后再重拉。');
    if (strict) throw e;
    const short = (timedOut ? '钉钉逐字稿超时' : raw).replace(/\s+/g, ' ').slice(0, 80);
    console.error(`  (transcript跳过) ${short}`);
    return [];
  }
}

function writeTranscriptChunks(db, taskUuid, plist) {
  clearChunks(db, taskUuid, 'transcript');
  let n = 0;
  for (const p of plist) {
    const speaker = p.nickName ?? p.speakerDisplay?.nickName ?? p.speaker ?? '未知发言人';
    const text = p.paragraph ?? p.text ?? p.content;
    if (!text) continue;
    insertChunk(db, {
      task_uuid: taskUuid,
      kind: 'transcript',
      chunk_text: `【${speaker}】${text}`,
    });
    n += 1;
  }
  return n;
}

// 解析 summary markdown 中的参与人
export function parseAttendees(summary) {
  if (!summary) return null;
  const m = summary.match(/参与人\*\*:\s*([^\n]+)/);
  if (!m) return null;
  return m[1].trim();
}

export function normalizeMinutes(listJson) {
  // 新版：{minutes:[{taskUuid,...}]} 或 {result:{itemList:[{uuid,...}]}}
  // 旧版：{result:{itemList:[{uuid,...}]}} 或 {minutes:[...]}
  const minutes = listJson.minutes ?? listJson.result?.itemList ?? listJson.items ?? listJson.list ?? [];
  return minutes.map((m) => ({
    task_uuid: m.taskUuid ?? m.task_uuid ?? m.uuid ?? m.id,
    title: m.title,
    start_time: m.startTime ?? m.start_time,
    end_time: m.endTime ?? m.end_time,
    url: m.url ?? m.shareUrl,
  })).filter((m) => m.task_uuid);
}

function nextListToken(json) {
  if (!json || typeof json !== 'object') return '';
  const r = json.result && typeof json.result === 'object' ? json.result : json;
  const token = r.nextToken ?? r.nextCursor ?? json.nextToken ?? json.nextCursor ?? '';
  return token ? String(token) : '';
}

/** 分页拉 mine / shared。limit 必须提到 100，默认 10 会把 200+ 条标错。 */
export async function listScopeMinutes(scope, { pageSize = 100, maxPages = 80 } = {}) {
  const out = [];
  let token = '';
  for (let page = 0; page < maxPages; page++) {
    const args = ['minutes', 'list', scope, '--max', String(pageSize), '--format', 'json'];
    if (token) args.push('--next-token', token);
    const json = await runDws(args, { soft: true });
    if (!json) {
      if (page === 0) throw new Error('dws minutes list ' + scope + ' 无返回');
      break;
    }
    if (json.success === false && page === 0) {
      throw new Error(json.errorMsg || json.error || ('list ' + scope + ' 失败'));
    }
    const batch = normalizeMinutes(json);
    out.push(...batch);
    const next = nextListToken(json);
    const hasMore = json.result?.hasMore ?? json.hasMore;
    if (!next || hasMore === false || next === token) break;
    if (batch.length === 0) break;
    token = next;
  }
  return out;
}

async function fallbackListAll(style, log) {
  let listJson;
  if (style === 'new') {
    listJson = await runDws(['minutes', '+list-all', '--limit', '100', '--format', 'json'], { soft: true });
  } else {
    listJson = await runDws(['minutes', 'list', 'all', '--start', '2025-01-01T00:00:00+08:00',
      '--limit', '100', '--format', 'json'], { soft: true });
  }
  const all = normalizeMinutes(listJson ?? {});
  log(`[pull] mine/shared 为空，回退 ${style === 'new' ? '+list-all' : 'list all'}，发现 ${all.length} 条（不改已有来源标记）`);
  return { all: all.map((m) => ({ ...m, source: 'mine' })), origin: new Map() };
}

async function collectPullList(style, log) {
  let mine = [];
  let shared = [];
  let mineErr = null;
  let sharedErr = null;
  try { mine = await listScopeMinutes('mine'); }
  catch (e) {
    mineErr = e;
    log(`[pull] list mine 失败: ${String(e.message || e).slice(0, 80)}`);
  }
  try { shared = await listScopeMinutes('shared'); }
  catch (e) {
    sharedErr = e;
    log(`[pull] list shared 失败: ${String(e.message || e).slice(0, 80)}`);
  }

  const origin = new Map();
  for (const m of shared) origin.set(m.task_uuid, 'shared');
  for (const m of mine) origin.set(m.task_uuid, 'mine');

  let extra = [];
  if (origin.size === 0 || mineErr || sharedErr) {
    extra = (await fallbackListAll(style, log)).all;
  } else {
    log(`[pull] 发现 ${mine.length + shared.length} 条听记（自己 ${mine.length} · 分享 ${shared.length}）`);
  }

  const seen = new Set();
  const all = [];
  for (const m of [...mine, ...shared, ...extra]) {
    if (seen.has(m.task_uuid)) continue;
    seen.add(m.task_uuid);
    all.push({ ...m, source: origin.get(m.task_uuid) || m.source || 'mine' });
  }
  all.sort((a, b) => Number(b.start_time || 0) - Number(a.start_time || 0));
  return { all, origin };
}

function applyOrigins(db, origin, log) {
  if (!origin.size) {
    log('[pull] 来源列表为空，跳过已有会议的听记/分享标记');
    return;
  }
  const rows = db.prepare(`SELECT task_uuid, source FROM meetings`).all();
  const upd = db.prepare(`UPDATE meetings SET source = ? WHERE task_uuid = ?`);
  let nMine = 0;
  let nShared = 0;
  let nChanged = 0;
  for (const row of rows) {
    if (row.source === 'import') continue;
    const next = origin.get(row.task_uuid);
    if (!next) continue;
    if (next === 'mine') nMine += 1;
    else nShared += 1;
    if (row.source !== next) {
      upd.run(next, row.task_uuid);
      nChanged += 1;
    }
  }
  log(`[pull] 来源已对齐：听记 ${nMine} · 分享 ${nShared}` + (nChanged ? `（更新 ${nChanged}）` : ''));
}

function makeFetchOne(style, taskUuid, { strict = false } = {}) {
  return async function fetchOne(artifact, extra = []) {
    try {
      let json;
      if (style === 'new') {
        json = await runDws(['minutes', '+detail', '--id', taskUuid,
          '--format', 'json', '--artifacts', artifact, ...extra]) ?? {};
      } else {
        const legacyCmd = { basic: 'info', summary: 'summary', keywords: 'keywords', todos: 'todos', transcript: 'transcription' }[artifact];
        json = await runDws(['minutes', 'get', legacyCmd, '--id', taskUuid, '--format', 'json', ...extra]) ?? {};
      }
      if (json && json.success === false) {
        const msg = json.errorMsg || json.error || (artifact + ' 失败');
        if (strict) throw new Error(msg);
        return {};
      }
      return json;
    } catch (e) {
      if (strict) throw e;
      console.error(`  (${artifact}跳过) ${String(e.message || e).replace(/\s+/g, ' ').slice(0, 80)}`);
      return {};
    }
  };
}

function parseTodos(todosRes) {
  return todosRes.todos?.result?.actions ?? todosRes.todos?.result?.dingtalkTodoList
    ?? todosRes.result?.actions ?? todosRes.result?.dingtalkTodoList
    ?? todosRes.actions ?? todosRes.dingtalkTodoList ?? [];
}

function hasBasic(basic) {
  return !!(basic && (basic.title || basic.startTime || basic.taskUuid || basic.url));
}

async function ingestMeeting(db, meta, { style, origin, skipTranscript = false, strict = false, log = () => {} } = {}) {
  const fetchOne = makeFetchOne(style, meta.task_uuid, { strict });
  let detail, basic, summary, keywords;
  if (style === 'new') {
    detail = await fetchOne('basic,summary,keywords');
    basic = detail.basic?.result ?? {};
    const summaryObj = detail.summary?.result ?? {};
    summary = typeof summaryObj.fullSummary === 'string' ? summaryObj.fullSummary
      : (summaryObj.summary ?? null);
    keywords = detail.keywords?.result?.keywords ?? null;
  } else {
    const info = await fetchOne('basic');
    const sumRes = await fetchOne('summary');
    const kwRes = await fetchOne('keywords');
    basic = info.result ?? info ?? {};
    const sumObj = sumRes.result ?? sumRes ?? {};
    summary = typeof sumObj.fullSummary === 'string' ? sumObj.fullSummary
      : (sumObj.summary ?? sumObj.content ?? null);
    keywords = (kwRes.result?.keywords ?? kwRes.keywords ?? null);
    if (!basic.title) basic = basic.info ?? {};
  }
  if (strict && !hasBasic(basic)) {
    throw new Error('钉钉听记读不到，本机未改');
  }

  const prev = getMeeting(db, meta.task_uuid);
  const isNew = !prev;
  const keptRecord = !!(prev && prev.summary_edited_at);
  const keptTranscript = !!(prev && prev.transcript_edited_at);
  upsertMeeting(db, {
    task_uuid: meta.task_uuid,
    title: basic.title ?? meta.title ?? '未命名会议',
    start_time: basic.startTime ?? meta.start_time,
    end_time: basic.endTime ?? meta.end_time,
    duration_ms: basic.duration,
    url: basic.url ?? meta.url,
    source: (origin && origin.get(meta.task_uuid)) || meta.source || 'mine',
    summary: keptRecord ? prev.summary : summary,
    keywords_json: keywords ? JSON.stringify(keywords) : null,
    attendees: keptRecord ? prev.attendees : parseAttendees(summary),
  });

  let actionTitles = new Set();
  let todosOk = !strict;
  try {
    const todosRes = await fetchOne('todos');
    const todos = parseTodos(todosRes);
    todosOk = true;
    clearActions(db, meta.task_uuid);
    for (const t of todos) {
      let title = null, minutesTodoId = null;
      if (typeof t === 'string') {
        try { const parsed = JSON.parse(t); title = parsed.value ?? parsed.title; }
        catch { title = t; }
      } else {
        title = t.title ?? t.value ?? t.text;
        minutesTodoId = t.minutesTodoId ?? t.id ?? null;
      }
      if (!title || actionTitles.has(title)) continue;
      actionTitles.add(title);
      insertAction(db, {
        task_uuid: meta.task_uuid,
        title,
        minutes_todo_id: minutesTodoId,
        status: 'open',
      });
    }
  } catch (e) {
    if (!strict) throw e;
    log(`  (todos跳过) ${String(e.message || e).replace(/\s+/g, ' ').slice(0, 80)}`);
  }

  let nChunks = 0;
  if (!skipTranscript) {
    if (keptTranscript) {
      nChunks = db.prepare(`SELECT COUNT(*) c FROM chunks WHERE task_uuid = ? AND kind = 'transcript'`).get(meta.task_uuid).c;
    } else {
      try {
        const plist = await fetchTranscriptParagraphs(style, meta.task_uuid, { strict });
        nChunks = writeTranscriptChunks(db, meta.task_uuid, plist);
      } catch (e) {
        if (!strict) throw e;
        nChunks = db.prepare(`SELECT COUNT(*) c FROM chunks WHERE task_uuid = ? AND kind = 'transcript'`).get(meta.task_uuid).c;
        log(`  (transcript跳过) ${String(e.message || e).replace(/\s+/g, ' ').slice(0, 80)}`);
      }
    }
    if (!keptRecord) {
      clearChunks(db, meta.task_uuid, 'summary');
      if (summary) {
        insertChunk(db, { task_uuid: meta.task_uuid, kind: 'summary', chunk_text: summary });
      }
    }
  }

  log(`  ✓ ${meta.title} (${String(meta.task_uuid).slice(0, 8)}…) 待办${actionTitles.size} 段落${nChunks}`);
  if (isNew) {
    try { classifyNewMeeting(db, meta.task_uuid); } catch { /* ignore */ }
  }
  const chunkIds = db.prepare(`SELECT id FROM chunks WHERE task_uuid = ? AND kind IN ('summary','transcript')`).all(meta.task_uuid).map((r) => r.id);
  return {
    ok: true,
    title: (basic.title ?? meta.title) || '',
    keptRecord,
    keptTranscript,
    todosUpdated: todosOk,
    actionCount: actionTitles.size,
    transcriptCount: nChunks,
    chunkIds,
  };
}

export async function pull({ dbPath, maxUuid = 300, skipTranscript = false, only = null, skipExisting = true, quiet = false, onProgress = null } = {}) {
  const db = open(dbPath);
  const log = quiet ? () => {} : (msg) => console.log(msg);
  const report = (p) => { try { onProgress && onProgress(p); } catch { /* ignore */ } };
  report({ phase: 'list', current: 0, total: 0 });
  const style = await detectCliStyle();
  const { all, origin } = await collectPullList(style, log);
  const deleted = new Set(listDeletedUuids(db));
  applyOrigins(db, origin, log);

  // 跳过已在库中的（增量同步），以及本机已删除的（避免又从钉钉拉回来）
  const visible = all.filter((m) => !deleted.has(m.task_uuid));
  const targets0 = only
    ? visible.filter((m) => only.includes(m.task_uuid))
    : visible.slice(0, maxUuid);
  const targets = skipExisting
    ? targets0.filter((m) => getMeeting(db, m.task_uuid) === undefined)
    : targets0;
  if (deleted.size && all.length !== visible.length) {
    log(`[pull] 跳过 ${all.length - visible.length} 条本机已删除的听记`);
  }
  if (skipExisting && targets.length < targets0.length) {
    log(`[pull] 跳过 ${targets0.length - targets.length} 条已在库中的，待同步 ${targets.length} 条`);
  }
  report({ phase: 'pull', current: 0, total: targets.length });

  let done = 0;
  for (const meta of targets) {
    const style = await detectCliStyle();
    try {
      await ingestMeeting(db, meta, { style, origin, skipTranscript, log });
    } catch (e) {
      console.error(`  ✗ 会议信息落库失败 ${meta.task_uuid}: ${e.message}`);
      continue;
    }
    done += 1;
    report({ phase: 'pull', current: done, total: targets.length, title: meta.title || '' });
    await yieldLoop();
  }
  db.close();
  return targets.length;
}

/** 已入库场次按 id 再拉钉钉。本机手改过的记录/逐字稿不覆盖；总结、类型、标签、上传状态不动。 */
export async function refreshMeeting({ taskUuid } = {}) {
  const id = String(taskUuid || '');
  if (!id) throw new Error('缺少 id');
  const db = open();
  try {
    const m = getMeeting(db, id);
    if (!m) throw new Error('未找到会议');
    if (m.source === 'import' || id.startsWith('import-')) {
      throw new Error('导入场次没有对应的钉钉听记');
    }
    const style = await detectCliStyle();
    console.log(`[refresh] 开始重拉 ${m.title || id}`);
    const r = await ingestMeeting(db, {
      task_uuid: id,
      title: m.title,
      start_time: m.start_time,
      end_time: m.end_time,
      url: m.url,
      source: m.source || 'mine',
    }, { style, origin: new Map([[id, m.source || 'mine']]), skipTranscript: false, strict: true, log: (msg) => console.log(msg) });
    console.log(`[refresh] 完成「${r.title || m.title}」逐字稿 ${r.transcriptCount || 0} 段`);
    return r;
  } finally {
    db.close();
  }
}

/** 补拉已在库、当时只取了逐字稿第一页（50 段）的会议。不改标题、记录、待办、本机总结。 */
export async function refreshTruncatedTranscripts({ dbPath, only = null, quiet = false } = {}) {
  const db = open(dbPath);
  const log = quiet ? () => {} : (msg) => console.log(msg);
  const style = await detectCliStyle();
  const targets = (only && only.length)
    ? only.map((id) => {
      const m = getMeeting(db, id);
      return m ? { task_uuid: m.task_uuid, title: m.title } : null;
    }).filter(Boolean)
    : db.prepare(`
        SELECT m.task_uuid, m.title
        FROM meetings m
        LEFT JOIN chunks c ON c.task_uuid = m.task_uuid AND c.kind = 'transcript'
        WHERE IFNULL(m.source, '') != 'import'
          AND IFNULL(m.transcript_edited_at, 0) = 0
        GROUP BY m.task_uuid
        HAVING COUNT(c.id) = 50
      `).all();
  log(`[pull] 补拉逐字稿 ${targets.length} 场`);
  for (const m of targets) {
    const row = getMeeting(db, m.task_uuid);
    if (row && row.transcript_edited_at) {
      log(`  · ${m.title} 本机改过，跳过`);
      continue;
    }
    const plist = await fetchTranscriptParagraphs(style, m.task_uuid);
    const n = writeTranscriptChunks(db, m.task_uuid, plist);
    log(`  ✓ ${m.title} 段落${n}`);
    await yieldLoop();
  }
  db.close();
  return targets.length;
}
