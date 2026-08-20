// 驾驶舱数据查询：纯本地 SQLite 查询，不调用嵌入模型或 DeepSeek。
// 供 DSH Client 驾驶舱通过 Host RPC 调用。

import { open, insertChunk } from './db.js';

const WEEK_MS = 7 * 24 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

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
  const ms = db.prepare(`SELECT task_uuid,title,start_time,summary FROM meetings WHERE start_time >= ? AND start_time < ? ORDER BY start_time`).all(start, end);
  const result = { label, start, end, count: 0, meetings: [] };
  for (const m of ms) {
    const acts = db.prepare(`SELECT title,status FROM actions WHERE task_uuid = ?`).all(m.task_uuid);
    result.meetings.push({
      title: m.title.replace(/^会议录制：/, ''),
      time: m.start_time,
      taskUuid: m.task_uuid,
      summary: m.summary,
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
      // 会议距今超过 7 天仍 open 视为疑似逾期（无显式 due_date，用会议时间近似）
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
      id: a.id, title: a.title, status: a.status,
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
  db.close();
  return {
    total: actions.length,
    open: openTodos.length,
    overdue: overdueTodos.length,
    duplicates: dupGroups,
    byMeeting: [...byMeeting.values()],
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
  const actions = db.prepare(`SELECT title,status FROM actions WHERE task_uuid = ?`).all(taskUuid);
  const chunks = db.prepare(`SELECT chunk_text FROM chunks WHERE task_uuid = ? ORDER BY id`).all(taskUuid);
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
    keywords: m.keywords_json ? JSON.parse(m.keywords_json) : null,
    attendees: m.attendees,
    actions,
    transcript: chunks.map((c) => c.chunk_text),
  };
}

// 全部会议清单（扁平列表，含待办数，用于驾驶舱"全部会议"）
export function allMeetings() {
  const db = open();
  const rows = db.prepare(`SELECT task_uuid,title,start_time FROM meetings ORDER BY start_time DESC`).all();
  const out = rows.map((m) => ({
    taskUuid: m.task_uuid,
    title: m.title.replace(/^会议录制：/, ''),
    time: m.start_time,
    actionCount: db.prepare(`SELECT COUNT(*) c FROM actions WHERE task_uuid=?`).get(m.task_uuid).c,
  }));
  db.close();
  return out;
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
      rec = { taskUuid: m.task_uuid, title: m.title, time: m.start_time, summary: m.summary, matchedIn: new Set(), keywords: new Set() };
      seen.set(m.task_uuid, rec);
    }
    rec.matchedIn.add(via);
    rec.keywords.add(kw);
  };
  for (const kw of kws) {
    const like = `%${kw}%`;
    const byText = db.prepare(
      `SELECT task_uuid, title, start_time, summary FROM meetings WHERE title LIKE ? OR summary LIKE ?`
    ).all(like, like);
    for (const m of byText) {
      const via = m.title && String(m.title).includes(kw) ? 'title' : 'summary';
      addMeeting(m, via, kw);
    }
    const byChunk = db.prepare(
      `SELECT DISTINCT c.task_uuid FROM chunks c WHERE c.chunk_text LIKE ?`
    ).all(like);
    for (const r of byChunk) {
      const m = db.prepare(`SELECT task_uuid, title, start_time, summary FROM meetings WHERE task_uuid = ?`).get(r.task_uuid);
      if (m) addMeeting(m, 'transcript', kw);
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
