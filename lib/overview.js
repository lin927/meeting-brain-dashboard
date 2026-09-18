// 驾驶舱数据查询：纯本地 SQLite 查询，不调用嵌入模型或 DeepSeek。
// 供 DSH Client 驾驶舱通过 Host RPC 调用。

import { open, insertChunk, parseTags, getTodoCats } from './db.js';
import { loadGlossary } from './glossary.js';
import { normalizeType } from './meeting-type.js';
import { projectChoices, resolveMeetingProject } from './project.js';
import { resolveWriteback } from './runtime-config.js';

const WEEK_MS = 7 * 24 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;
const MEET_PAGE = 60;
const TODO_PAGE = 80;
const PAGE_CAP = 200;

function clampLimit(n, fallback, cap = PAGE_CAP) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) return fallback;
  return Math.min(Math.floor(x), cap);
}

function escapeLike(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function decodeCursor(raw) {
  const s = String(raw || '');
  const i = s.indexOf(':');
  if (i <= 0) return null;
  const left = Number(s.slice(0, i));
  const right = s.slice(i + 1);
  if (!Number.isFinite(left) || !right) return null;
  return { time: left, id: right };
}

function mapMeetingRow(m, actionCount = 0, glossary) {
  const project = resolveMeetingProject(m, glossary);
  return {
    taskUuid: m.task_uuid,
    title: String(m.title || '').replace(/^会议录制：/, ''),
    time: m.start_time,
    visibility: m.visibility || 'private',
    source: m.source || 'mine',
    scope: normalizeType(m.scope),
    type: normalizeType(m.scope),
    tags: parseTags(m.tags_json),
    projectName: project.name,
    projectCode: project.code,
    actionCount: actionCount || 0,
  };
}

function actionCountsFor(db, uuids) {
  const out = new Map();
  if (!uuids.length) return out;
  const ph = uuids.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT task_uuid, COUNT(*) c FROM actions WHERE task_uuid IN (${ph}) GROUP BY task_uuid`
  ).all(...uuids);
  for (const r of rows) out.set(r.task_uuid, r.c);
  return out;
}

export function meetingCount() {
  const db = open();
  const c = db.prepare(`SELECT COUNT(*) c FROM meetings`).get().c;
  db.close();
  return c;
}

/** 会议列表：筛选进 SQL，待办数一次 GROUP BY，keyset 分页。 */
export function queryMeetings(opts = {}) {
  const q = String(opts.q || '').trim().slice(0, 80);
  const tag = String(opts.tag || '').trim().slice(0, 80);
  const type = normalizeType(opts.type || opts.scope);
  const filter = opts.filter === 'company' ? 'company' : 'all';
  const uuid = String(opts.id || opts.uuid || '').trim();
  const cap = opts.unlimited ? 100000 : PAGE_CAP;
  const take = clampLimit(opts.limit, MEET_PAGE, cap);
  const cursor = decodeCursor(opts.cursor);

  const where = [];
  const params = [];
  if (uuid) {
    where.push('task_uuid = ?');
    params.push(uuid);
  }
  if (filter === 'company') where.push(`visibility = 'company'`);
  if (type) {
    where.push('scope = ?');
    params.push(type);
  }
  if (q) {
    const like = '%' + escapeLike(q) + '%';
    where.push(`(title LIKE ? ESCAPE '\\' OR IFNULL(project_name, '') LIKE ? ESCAPE '\\' OR IFNULL(tags_json, '') LIKE ? ESCAPE '\\')`);
    params.push(like, like, like);
  }
  if (tag) {
    where.push(`(tags_json LIKE ? ESCAPE '\\' OR project_name = ?)`);
    params.push('%"' + escapeLike(tag) + '"%', tag);
  }
  const pageWhere = where.slice();
  const pageParams = params.slice();
  if (cursor) {
    pageWhere.push('(start_time < ? OR (start_time = ? AND task_uuid < ?))');
    pageParams.push(cursor.time, cursor.time, cursor.id);
  }
  const sqlWhere = where.length ? ('WHERE ' + where.join(' AND ')) : '';
  const sqlPage = pageWhere.length ? ('WHERE ' + pageWhere.join(' AND ')) : '';
  const db = open();
  const total = db.prepare(`SELECT COUNT(*) c FROM meetings ${sqlWhere}`).get(...params).c;
  const rows = db.prepare(
    `SELECT task_uuid, title, start_time, visibility, source, scope, tags_json, project_name, project_code
     FROM meetings ${sqlPage}
     ORDER BY start_time DESC, task_uuid DESC
     LIMIT ?`
  ).all(...pageParams, take + 1);
  let nextCursor = null;
  if (rows.length > take) {
    rows.pop();
    const last = rows[rows.length - 1];
    nextCursor = `${last.start_time}:${last.task_uuid}`;
  }
  const counts = actionCountsFor(db, rows.map((m) => m.task_uuid));
  const glossary = loadGlossary();
  db.close();
  return {
    items: rows.map((m) => mapMeetingRow(m, counts.get(m.task_uuid) || 0, glossary)),
    total,
    nextCursor,
  };
}

function mapTodoRow(a) {
  const meetingTime = a.meeting_time || 0;
  return {
    id: a.id,
    title: a.title,
    owner: a.owner || '',
    cat: a.cat || '其他',
    status: a.status,
    created: a.created_time || meetingTime || 0,
    origin: a.origin || '听记',
    meeting: a.meeting_title,
    meetingId: a.task_uuid,
    due: a.due || '',
    closed: a.closed_at || null,
  };
}

function todoWhere(opts, { withCursor = true } = {}) {
  const where = [];
  const params = [];
  const status = opts.status;
  if (status && status !== 'all') {
    where.push('a.status = ?');
    params.push(status);
  }
  const cat = String(opts.cat || '').trim();
  if (cat && cat !== 'all') {
    where.push(`IFNULL(a.cat, '其他') = ?`);
    params.push(cat);
  }
  const q = String(opts.q || '').trim().slice(0, 80);
  if (q) {
    const like = '%' + escapeLike(q) + '%';
    where.push(`(a.title LIKE ? ESCAPE '\\' OR IFNULL(a.owner, '') LIKE ? ESCAPE '\\' OR m.title LIKE ? ESCAPE '\\')`);
    params.push(like, like, like);
  }
  if (withCursor) {
    const cursor = decodeCursor(opts.cursor);
    if (cursor) {
      const id = Number(cursor.id);
      where.push('(m.start_time < ? OR (m.start_time = ? AND a.id < ?))');
      params.push(cursor.time, cursor.time, Number.isFinite(id) ? id : 0);
    }
  }
  return { where, params };
}

/** 待办列表：筛选/计数进 SQL，keyset 分页。不含重复识别。 */
export function queryTodos(opts = {}) {
  const cap = opts.unlimited ? 100000 : PAGE_CAP;
  const take = clampLimit(opts.limit, TODO_PAGE, cap);
  const filter = todoWhere(opts, { withCursor: false });
  const page = todoWhere(opts, { withCursor: true });
  const sqlFilter = filter.where.length ? ('WHERE ' + filter.where.join(' AND ')) : '';
  const sqlPage = page.where.length ? ('WHERE ' + page.where.join(' AND ')) : '';
  const join = `FROM actions a JOIN meetings m ON a.task_uuid = m.task_uuid`;
  const db = open();
  const cats = getTodoCats(db);
  const total = db.prepare(`SELECT COUNT(*) c FROM actions`).get().c;
  const openCount = db.prepare(`SELECT COUNT(*) c FROM actions WHERE status = 'open'`).get().c;
  const overdue = db.prepare(
    `SELECT COUNT(*) c ${join} WHERE a.status = 'open' AND m.start_time > 0 AND m.start_time < ?`
  ).get(Date.now() - 7 * DAY_MS).c;
  const catRows = db.prepare(
    `SELECT IFNULL(cat, '其他') cat, COUNT(*) c FROM actions GROUP BY IFNULL(cat, '其他')`
  ).all();
  const catCounts = Object.fromEntries(cats.map((c) => [c, 0]));
  for (const r of catRows) catCounts[r.cat] = r.c;
  const filteredTotal = db.prepare(`SELECT COUNT(*) c ${join} ${sqlFilter}`).get(...filter.params).c;
  const rows = db.prepare(
    `SELECT a.id, a.title, a.owner, a.cat, a.status, a.origin, a.due, a.created_time, a.closed_at,
            a.task_uuid, m.title AS meeting_title, m.start_time AS meeting_time
     ${join} ${sqlPage}
     ORDER BY m.start_time DESC, a.id DESC
     LIMIT ?`
  ).all(...page.params, take + 1);
  let nextCursor = null;
  if (rows.length > take) {
    rows.pop();
    const last = rows[rows.length - 1];
    nextCursor = `${last.meeting_time || 0}:${last.id}`;
  }
  let selected = null;
  const sid = Number(opts.id);
  if (Number.isFinite(sid) && sid > 0) {
    const one = db.prepare(
      `SELECT a.id, a.title, a.owner, a.cat, a.status, a.origin, a.due, a.created_time, a.closed_at,
              a.task_uuid, m.title AS meeting_title, m.start_time AS meeting_time
       ${join} WHERE a.id = ?`
    ).get(sid);
    if (one) selected = mapTodoRow(one);
  }
  db.close();
  return {
    items: rows.map(mapTodoRow),
    selected,
    total,
    open: openCount,
    overdue,
    filteredTotal,
    nextCursor,
    cats,
    catCounts,
  };
}

// 本周一 00:00（本地时区）
function mondayMs(now = new Date()) {
  const d = new Date(now);
  const dow = (d.getDay() + 6) % 7; // 周一=0
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function stats(db) {
  const meetings = db.prepare(`SELECT COUNT(*) c FROM meetings`).get().c;
  const actions = db.prepare(`SELECT COUNT(*) c FROM actions`).get().c;
  const openActions = db.prepare(`SELECT COUNT(*) c FROM actions WHERE status='open'`).get().c;
  return { meetings, actions, openActions };
}

// 按 start_time 聚合去重（同一分钟视为同一场会议），并挂上待办
export function meetingsGrouped(db, { since = 0, until = Infinity } = {}) {
  const rows = db.prepare(`SELECT * FROM meetings ORDER BY start_time DESC`).all();
  const groups = new Map();
  for (const m of rows) {
    const t = m.start_time || 0;
    if (t < since || t > until) continue;
    const key = Math.round(t / 60000);
    if (!groups.has(key)) {
      groups.set(key, {
        time: t,
        title: m.title.replace(/^会议录制：/, ''),
        urls: [],
        taskUuids: [],
      });
    }
    const g = groups.get(key);
    if (m.url) g.urls.push(m.url);
    if (m.task_uuid) g.taskUuids.push(m.task_uuid);
  }
  const list = [...groups.values()].sort((a, b) => b.time - a.time);
  for (const g of list) {
    const seen = new Set();
    g.actions = [];
    for (const uuid of g.taskUuids) {
      const acts = db.prepare(`SELECT title, status FROM actions WHERE task_uuid = ?`).all(uuid);
      for (const a of acts) {
        if (seen.has(a.title)) continue;
        seen.add(a.title);
        g.actions.push(a);
      }
    }
  }
  return list;
}

// 按时间范围查待办：返回该时间段内会议及其待办（结构化，非语义）。
// range: 'today' | 'yesterday' | 'thisWeek' | {start, end} | 'lastNdays:N'
export function todosByRange(range) {
  const db = open();
  const now = new Date();
  let start = 0, end = Infinity, label = '';
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  if (range === 'today') { start = todayStart.getTime(); end = start + DAY_MS; label = '今天'; }
  else if (range === 'yesterday') { end = todayStart.getTime(); start = end - DAY_MS; label = '昨天'; }
  else if (range === 'thisWeek') { start = mondayMs(now); end = start + WEEK_MS; label = '本周'; }
  else if (typeof range === 'object' && range.start !== undefined) { start = range.start; end = range.end ?? Infinity; label = range.label ?? '指定时间段'; }
  else if (typeof range === 'string' && range.startsWith('lastNdays:')) {
    const n = parseInt(range.split(':')[1], 10) || 7;
    start = todayStart.getTime() - (n - 1) * DAY_MS; end = todayStart.getTime() + DAY_MS;
    label = `近${n}天`;
  }
  const ms = db.prepare(`SELECT task_uuid,title,start_time,summary,deep_summary FROM meetings WHERE start_time >= ? AND start_time < ? ORDER BY start_time`).all(start, end);
  const result = { label, start, end, count: 0, meetings: [] };
  for (const m of ms) {
    const acts = db.prepare(`SELECT title,status FROM actions WHERE task_uuid = ?`).all(m.task_uuid);
    result.meetings.push({
      title: m.title.replace(/^会议录制：/, ''),
      time: m.start_time,
      taskUuid: m.task_uuid,
      summary: m.deep_summary || m.summary,
      actions: acts,
    });
    result.count += acts.length;
  }
  db.close();
  return result;
}

// 为所有带 summary 但尚无 summary 块的会议补插 summary chunk（供向量化检索）
export function backfillSummaries() {
  const db = open();
  const meetings = db.prepare(`SELECT task_uuid, summary FROM meetings WHERE summary IS NOT NULL`).all();
  let added = 0;
  for (const m of meetings) {
    const existing = db.prepare(`SELECT COUNT(*) c FROM chunks WHERE task_uuid=? AND kind='summary'`).get(m.task_uuid).c;
    if (existing > 0) continue;
    insertChunk(db, { task_uuid: m.task_uuid, kind: 'summary', chunk_text: m.summary });
    added++;
  }
  db.close();
  return added;
}

// 待办闭环：汇总所有待办，按状态/会议分组，识别可能重复和疑似逾期项
export function todoTracking() {  const db = open();
  const meetings = db.prepare(`SELECT task_uuid, title, start_time FROM meetings`).all();
  const mIndex = new Map(meetings.map((m) => [m.task_uuid, m]));
  const actions = db.prepare(`SELECT a.*, m.title AS meeting_title, m.start_time AS meeting_time
    FROM actions a JOIN meetings m ON a.task_uuid = m.task_uuid ORDER BY m.start_time DESC`).all();
  const now = Date.now();
  const openTodos = [];
  const overdueTodos = [];
  for (const a of actions) {
    const meetingTime = a.meeting_time || 0;
    const item = {
      id: a.id,
      title: a.title,
      status: a.status,
      meetingUuid: a.task_uuid,
      meetingTitle: a.meeting_title,
      meetingTime,
      owner: a.owner,
      cat: a.cat || '其他',
      origin: a.origin || '听记',
      due: a.due || '',
      created: a.created_time || meetingTime || 0,
      closed: a.closed_at || null,
      stale: a.status === 'open' && meetingTime > 0 && (now - meetingTime) > 7 * DAY_MS,
    };
    if (a.status === 'open') openTodos.push(item);
    if (item.stale) overdueTodos.push(item);
  }
  // 按会议分组
  const byMeeting = new Map();
  for (const a of actions) {
    if (!byMeeting.has(a.task_uuid)) {
      byMeeting.set(a.task_uuid, { meetingUuid: a.task_uuid, meetingTitle: a.meeting_title, meetingTime: a.meeting_time, todos: [] });
    }
    byMeeting.get(a.task_uuid).todos.push({
      id: a.id, title: a.title, status: a.status, owner: a.owner,
      cat: a.cat || '其他', origin: a.origin || '听记', due: a.due || '',
      stale: a.status === 'open' && a.meeting_time > 0 && (now - a.meeting_time) > 7 * DAY_MS,
    });
  }
  // 重复项识别：标题相似度过高的待办（跨会议）
  const dupGroups = [];
  const seen = new Set();
  for (let i = 0; i < openTodos.length; i++) {
    if (seen.has(i)) continue;
    const group = [openTodos[i]];
    for (let j = i + 1; j < openTodos.length; j++) {
      if (seen.has(j)) continue;
      if (similar(openTodos[i].title, openTodos[j].title)) { group.push(openTodos[j]); seen.add(j); }
    }
    if (group.length > 1) { dupGroups.push(group); seen.add(i); }
  }
  const cats = getTodoCats(db);
  db.close();
  return {
    total: actions.length,
    open: openTodos.length,
    overdue: overdueTodos.length,
    duplicates: dupGroups,
    byMeeting: [...byMeeting.values()],
    items: actions.map((a) => ({
      id: a.id,
      title: a.title,
      owner: a.owner || '',
      cat: a.cat || '其他',
      status: a.status,
      created: a.created_time || a.meeting_time || 0,
      origin: a.origin || '听记',
      meeting: a.meeting_title,
      meetingId: a.task_uuid,
      due: a.due || '',
      closed: a.closed_at || null,
    })),
    cats,
  };
}

// 简易标题相似度（字符重叠比例）
function similar(a, b) {
  if (!a || !b) return false;
  const A = a.replace(/\s+/g, '');
  const B = b.replace(/\s+/g, '');
  if (A.length < 4 || B.length < 4) return false;
  let hits = 0;
  for (let i = 0; i < A.length; i++) {
    if (B.includes(A[i])) hits++;
  }
  return hits / Math.max(A.length, B.length) > 0.7;
}

// 单场会议详情：基本信息 + 摘要 + 待办 + 关键词
export function meetingDetail(taskUuid) {
  if (!taskUuid) return null;
  const db = open();
  const m = db.prepare(`SELECT * FROM meetings WHERE task_uuid = ?`).get(taskUuid);
  if (!m) { db.close(); return null; }
  const actions = db.prepare(`SELECT id,title,status,owner,cat,origin,due,created_time,closed_at FROM actions WHERE task_uuid = ?`).all(taskUuid);
  const chunks = db.prepare(`SELECT chunk_text FROM chunks WHERE task_uuid = ? AND kind = 'transcript' ORDER BY id`).all(taskUuid);
  const writebackEnabled = resolveWriteback(db).enabled;
  const g = loadGlossary();
  const project = resolveMeetingProject(m, g);
  db.close();
  return {
    taskUuid: m.task_uuid,
    title: m.title,
    startTime: m.start_time,
    endTime: m.end_time,
    durationMs: m.duration_ms,
    url: m.url,
    source: m.source,
    summary: m.summary,
    deepSummary: m.deep_summary || '',
    keywords: m.keywords_json ? JSON.parse(m.keywords_json) : null,
    attendees: m.attendees,
    visibility: m.visibility || 'private',
    publishedAt: m.published_at || null,
    editedAt: m.edited_at || null,
    summaryEdited: !!m.summary_edited_at,
    transcriptEdited: !!m.transcript_edited_at,
    writebackEnabled,
    scopeSource: m.scope_source || '',
    scope: normalizeType(m.scope),
    type: normalizeType(m.scope),
    tags: parseTags(m.tags_json),
    projectName: project.name,
    projectCode: project.code,
    projects: projectChoices(g),
    actions,
    transcript: chunks.map((c) => c.chunk_text),
  };
}

// 全部会议清单（CLI / 同步计数以外的全量导出；HTTP 列表走 queryMeetings）
export function allMeetings() {
  return queryMeetings({ limit: 100000, unlimited: true }).items;
}

// 按项目/关键词匹配会议标题，聚合该项目全部会议及待办（结构化，非语义）
export function projectTodos(keyword) {
  if (!keyword || !keyword.trim()) return { meetings: [] };
  const db = open();
  const kw = keyword.trim();
  const meetings = db.prepare(`SELECT task_uuid,title,start_time FROM meetings WHERE title LIKE ? ORDER BY start_time`)
    .all(`%${kw}%`);
  const result = [];
  for (const m of meetings) {
    const acts = db.prepare(`SELECT title,status,owner FROM actions WHERE task_uuid = ?`).all(m.task_uuid);
    result.push({
      title: m.title.replace(/^会议录制：/, ''),
      time: m.start_time,
      taskUuid: m.task_uuid,
      actions: acts,
    });
  }
  db.close();
  return { keyword: kw, meetings: result };
}

export function overview() {
  const db = open();
  const monday = mondayMs();
  const nextMonday = monday + WEEK_MS;
  const result = {
    generatedAt: Date.now(),
    stats: stats(db),
    week: {
      start: monday,
      end: nextMonday,
      label: `${new Date(monday).toLocaleDateString('zh-CN')} ~ ${new Date(nextMonday - DAY_MS).toLocaleDateString('zh-CN')}`,
    },
    thisWeek: meetingsGrouped(db, { since: monday, until: nextMonday }),
    recent: meetingsGrouped(db, { since: Date.now() - 30 * DAY_MS }),
  };
  db.close();
  return result;
}

// 关键词全文检索：找出「明确包含指定词」的会议（标题/摘要/逐字稿段落）。
// 支持单个或多个关键词（逗号/顿号分隔）；多词时任一命中即计入，matchedIn 标注命中来源。
export function keywordSearch(keyword) {
  const db = open();
  const raw = String(keyword || '').trim();
  if (!raw) { db.close(); return { keyword: '', count: 0, meetings: [] }; }
  // 拆分成多个词（逗号/顿号/空格分隔，去重、去空）
  const kws = [...new Set(raw.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean))];
  const seen = new Map(); // taskUuid -> {meta, matchedIn:Set}
  const addMeeting = (m, via, kw) => {
    let rec = seen.get(m.task_uuid);
    if (!rec) {
      rec = { taskUuid: m.task_uuid, title: m.title, time: m.start_time, summary: m.deep_summary || m.summary, matchedIn: new Set(), keywords: new Set() };
      seen.set(m.task_uuid, rec);
    }
    rec.matchedIn.add(via);
    rec.keywords.add(kw);
  };
  for (const kw of kws) {
    const like = `%${kw}%`;
    const byText = db.prepare(
      `SELECT task_uuid, title, start_time, summary, deep_summary FROM meetings WHERE title LIKE ? OR summary LIKE ? OR IFNULL(deep_summary,'') LIKE ?`
    ).all(like, like, like);
    for (const m of byText) {
      const via = m.title && String(m.title).includes(kw)
        ? 'title'
        : (m.deep_summary && String(m.deep_summary).includes(kw) ? 'summary' : 'summary');
      addMeeting(m, via, kw);
    }
    const byChunk = db.prepare(
      `SELECT DISTINCT c.task_uuid, c.kind FROM chunks c WHERE c.chunk_text LIKE ?`
    ).all(like);
    for (const r of byChunk) {
      const m = db.prepare(`SELECT task_uuid, title, start_time, summary, deep_summary FROM meetings WHERE task_uuid = ?`).get(r.task_uuid);
      if (m) addMeeting(m, r.kind === 'transcript' ? 'transcript' : 'summary', kw);
    }
  }
  db.close();
  const meetings = [...seen.values()].map((r) => ({
    taskUuid: r.taskUuid,
    title: r.title,
    time: r.time,
    summary: r.summary,
    matchedIn: [...r.matchedIn][0],
    keywords: [...r.keywords],
  }));
  return { keyword: raw, keywords: kws, count: meetings.length, meetings };
}
