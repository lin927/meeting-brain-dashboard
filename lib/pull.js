// 从钉钉 DWS 拉取听记并结构化落库。
// 兼容两个 DWS CLI 版本：
//   - 新版（v1.0.58+）：dws minutes +list-all / +detail --artifacts
//   - 旧版（v1.0.5x，如同事的 1.0.51）：dws minutes list all / get info|summary|todos|transcription
// 按版本探测自动选择语法，统一归一化为 {task_uuid, title, ...}。

import { execFileSync } from 'node:child_process';
import { open, upsertMeeting, clearActions, insertAction, clearChunks, insertChunk, getMeeting, listDeletedUuids } from './db.js';

// 探测 DWS CLI 版本风格：返回 'new'（+list-all）或 'legacy'（list all）。
// 通过试跑命令判断，避免解析版本号的脆弱性。
let _cliStyle = null;
function detectCliStyle() {
  if (_cliStyle) return _cliStyle;
  // 新语法优先：+list-all 存在则用新版命令集
  try {
    const out = runDwsRaw(['minutes', '+list-all', '--limit', '1', '--format', 'json']);
    if (out && (out.minutes || out.result?.itemList)) {
      _cliStyle = 'new';
      return _cliStyle;
    }
  } catch { /* 新版不支持，落旧版 */ }
  _cliStyle = 'legacy';
  return _cliStyle;
}

/** 原始执行 dws，返回解析后的 JSON 或 null（soft）。 */
function runDwsRaw(args, opts = {}) {
  try {
    const out = execFileSync('dws', args, {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(stripBom(out));
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

function runDws(args, opts = {}) {
  return runDwsRaw(args, opts);
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

function fetchTranscriptParagraphs(style, taskUuid) {
  try {
    if (style === 'new') {
      // +transcript 默认追完 nextToken；禁止 --single-page（一页最多 50 段）
      const txRes = runDws(['minutes', '+transcript', '--id', taskUuid, '--format', 'json']) ?? {};
      return transcriptParagraphs(txRes);
    }
    const all = [];
    const seen = new Set();
    let token = '';
    for (let i = 0; i < 100; i++) {
      const args = ['minutes', 'get', 'transcription', '--id', taskUuid, '--format', 'json'];
      if (token) args.push('--next-token', token);
      const txRes = runDws(args) ?? {};
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
    console.error(`  (transcript跳过) ${e.message.slice(0, 70)}`);
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
export function listScopeMinutes(scope, { pageSize = 100, maxPages = 80 } = {}) {
  const out = [];
  let token = '';
  for (let page = 0; page < maxPages; page++) {
    const args = ['minutes', 'list', scope, '--max', String(pageSize), '--format', 'json'];
    if (token) args.push('--next-token', token);
    const json = runDws(args, { soft: true });
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

function fallbackListAll(style, log) {
  let listJson;
  if (style === 'new') {
    listJson = runDws(['minutes', '+list-all', '--limit', '100', '--format', 'json'], { soft: true });
  } else {
    listJson = runDws(['minutes', 'list', 'all', '--start', '2025-01-01T00:00:00+08:00',
      '--limit', '100', '--format', 'json'], { soft: true });
  }
  const all = normalizeMinutes(listJson ?? {});
  log(`[pull] mine/shared 为空，回退 ${style === 'new' ? '+list-all' : 'list all'}，发现 ${all.length} 条（不改已有来源标记）`);
  return { all: all.map((m) => ({ ...m, source: 'mine' })), origin: new Map() };
}

function collectPullList(style, log) {
  let mine = [];
  let shared = [];
  let mineErr = null;
  let sharedErr = null;
  try { mine = listScopeMinutes('mine'); }
  catch (e) {
    mineErr = e;
    log(`[pull] list mine 失败: ${String(e.message || e).slice(0, 80)}`);
  }
  try { shared = listScopeMinutes('shared'); }
  catch (e) {
    sharedErr = e;
    log(`[pull] list shared 失败: ${String(e.message || e).slice(0, 80)}`);
  }

  const origin = new Map();
  for (const m of shared) origin.set(m.task_uuid, 'shared');
  for (const m of mine) origin.set(m.task_uuid, 'mine');

  let extra = [];
  if (origin.size === 0 || mineErr || sharedErr) {
    extra = fallbackListAll(style, log).all;
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

export function pull({ dbPath, maxUuid = 300, skipTranscript = false, only = null, skipExisting = true, quiet = false } = {}) {
  const db = open(dbPath);
  const log = quiet ? () => {} : (msg) => console.log(msg);
  const style = detectCliStyle();
  const { all, origin } = collectPullList(style, log);
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

  for (const meta of targets) {
    const style = detectCliStyle();
    // 每个产物单独调用，失败互不影响
    const fetchOne = (artifact, extra = []) => {
      try {
        if (style === 'new') {
          // v1.0.58+：+detail --artifacts
          return runDws(['minutes', '+detail', '--id', meta.task_uuid,
            '--format', 'json', '--artifacts', artifact, ...extra]) ?? {};
        }
        // v1.0.5x 旧版：get <artifact> --id
        const legacyCmd = { basic: 'info', summary: 'summary', keywords: 'keywords', todos: 'todos', transcript: 'transcription' }[artifact];
        return runDws(['minutes', 'get', legacyCmd, '--id', meta.task_uuid, '--format', 'json', ...extra]) ?? {};
      } catch (e) {
        console.error(`  (${artifact}跳过) ${e.message.slice(0, 70)}`);
        return {};
      }
    };

    // 基础产物：新版 detail.basic/summary/keywords；旧版分别 get info/summary/keywords
    let detail, basic, summary, keywords;
    if (style === 'new') {
      detail = fetchOne('basic,summary,keywords');
      basic = detail.basic?.result ?? {};
      const summaryObj = detail.summary?.result ?? {};
      summary = typeof summaryObj.fullSummary === 'string' ? summaryObj.fullSummary
        : (summaryObj.summary ?? null);
      keywords = detail.keywords?.result?.keywords ?? null;
    } else {
      // 旧版：get info / get summary / get keywords 各自返回
      const info = fetchOne('basic');
      const sumRes = fetchOne('summary');
      const kwRes = fetchOne('keywords');
      basic = info.result ?? info ?? {};
      const sumObj = sumRes.result ?? sumRes ?? {};
      summary = typeof sumObj.fullSummary === 'string' ? sumObj.fullSummary
        : (sumObj.summary ?? sumObj.content ?? null);
      keywords = (kwRes.result?.keywords ?? kwRes.keywords ?? null);
      if (!basic.title) basic = basic.info ?? {};
    }

    const prev = getMeeting(db, meta.task_uuid);
    try {
      upsertMeeting(db, {
        task_uuid: meta.task_uuid,
        title: basic.title ?? meta.title ?? '未命名会议',
        start_time: basic.startTime ?? meta.start_time,
        end_time: basic.endTime ?? meta.end_time,
        duration_ms: basic.duration,
        url: basic.url ?? meta.url,
        source: origin.get(meta.task_uuid) || meta.source || 'mine',
        summary: (prev && prev.summary_edited_at) ? prev.summary : summary,
        keywords_json: keywords ? JSON.stringify(keywords) : null,
        attendees: (prev && prev.summary_edited_at) ? prev.attendees : parseAttendees(summary),
      });
    } catch (e) {
      console.error(`  ✗ 会议信息落库失败 ${meta.task_uuid}: ${e.message}`);
      continue;
    }

    // 待办
    let actionTitles = new Set();
    const todosRes = fetchOne('todos');
    const todos = todosRes.todos?.result?.actions ?? todosRes.todos?.result?.dingtalkTodoList
      ?? todosRes.result?.actions ?? todosRes.result?.dingtalkTodoList
      ?? todosRes.actions ?? todosRes.dingtalkTodoList ?? [];
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

    // 逐字稿：必须翻完全部页。本机改过的记录/逐字稿不覆盖。
    let nChunks = 0;
    if (!skipTranscript) {
      if (prev && prev.transcript_edited_at) {
        nChunks = db.prepare(`SELECT COUNT(*) c FROM chunks WHERE task_uuid = ? AND kind = 'transcript'`).get(meta.task_uuid).c;
      } else {
        const plist = fetchTranscriptParagraphs(style, meta.task_uuid);
        nChunks = writeTranscriptChunks(db, meta.task_uuid, plist);
      }
      if (!(prev && prev.summary_edited_at)) {
        clearChunks(db, meta.task_uuid, 'summary');
        if (summary) {
          insertChunk(db, { task_uuid: meta.task_uuid, kind: 'summary', chunk_text: summary });
        }
      }
    }

    log(`  ✓ ${meta.title} (${meta.task_uuid.slice(0, 8)}…) 待办${actionTitles.size} 段落${nChunks}`);
  }
  db.close();
  return targets.length;
}

/** 补拉已在库、当时只取了逐字稿第一页（50 段）的会议。不改标题、记录、待办、本机总结。 */
export function refreshTruncatedTranscripts({ dbPath, only = null, quiet = false } = {}) {
  const db = open(dbPath);
  const log = quiet ? () => {} : (msg) => console.log(msg);
  const style = detectCliStyle();
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
    const plist = fetchTranscriptParagraphs(style, m.task_uuid);
    const n = writeTranscriptChunks(db, m.task_uuid, plist);
    log(`  ✓ ${m.title} 段落${n}`);
  }
  db.close();
  return targets.length;
}
