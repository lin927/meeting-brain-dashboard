// 本地结构化存储层：会议档案、待办、向量块。
// 全部落在本地 SQLite 文件，数据不出本机。向量以 JSON blob 存储，检索时内存余弦相似度。

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_DB = join(homedir(), '.dsh', 'meetings', 'meeting-brain.sqlite');

let _db = null;
let _refs = 0;
const _wrapped = new WeakSet();

export function dbPath(override) {
  return override || process.env.MEETING_BRAIN_DB || DEFAULT_DB;
}

function attachClose(db) {
  if (_wrapped.has(db)) return;
  _wrapped.add(db);
  const rawClose = db.close.bind(db);
  db.close = () => {
    _refs = Math.max(0, _refs - 1);
    if (_refs > 0) return;
    try { rawClose(); } catch { /* ignore */ }
    if (_db === db) _db = null;
  };
}

export function open(override) {
  if (_db) {
    // 单例若已被 close，重建
    try {
      _db.prepare('SELECT 1').get();
      _refs += 1;
      return _db;
    } catch {
      _db = null;
      _refs = 0;
    }
  }
  const path = dbPath(override);
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      task_uuid      TEXT PRIMARY KEY,
      title          TEXT,
      start_time     INTEGER,
      end_time       INTEGER,
      duration_ms    INTEGER,
      url            TEXT,
      source         TEXT DEFAULT 'mine',      -- mine | shared | import
      summary        TEXT,
      keywords_json  TEXT,
      meeting_time   INTEGER,
      attendees      TEXT,                      -- 由 summary 解析的参与人
      ingested_at    INTEGER
    );

    CREATE TABLE IF NOT EXISTS actions (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      task_uuid      TEXT NOT NULL REFERENCES meetings(task_uuid),
      title          TEXT NOT NULL,
      minutes_todo_id TEXT,
      owner          TEXT,                      -- AI 推断的负责人
      status         TEXT DEFAULT 'open',       -- open | done | overdue
      created_time   INTEGER
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      task_uuid      TEXT NOT NULL REFERENCES meetings(task_uuid),
      kind           TEXT NOT NULL,             -- summary | transcript | action | deep
      chunk_text     TEXT NOT NULL,
      vector_json    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_chunks_task ON chunks(task_uuid);
    CREATE INDEX IF NOT EXISTS idx_actions_task ON actions(task_uuid);

    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS deleted_meetings (
      task_uuid  TEXT PRIMARY KEY,
      deleted_at INTEGER
    );
  `);
  ensureColumn(db, 'meetings', 'visibility', "visibility TEXT DEFAULT 'private'");
  ensureColumn(db, 'meetings', 'published_at', 'published_at INTEGER');
  ensureColumn(db, 'meetings', 'company_doc_id', 'company_doc_id TEXT');
  ensureColumn(db, 'meetings', 'company_dataset_id', 'company_dataset_id TEXT');
  ensureColumn(db, 'meetings', 'card_json', 'card_json TEXT');
  ensureColumn(db, 'meetings', 'edited_at', 'edited_at INTEGER');
  ensureColumn(db, 'meetings', 'scope', "scope TEXT DEFAULT ''");
  ensureColumn(db, 'meetings', 'tags_json', "tags_json TEXT DEFAULT '[]'");
  ensureColumn(db, 'meetings', 'deep_summary', 'deep_summary TEXT');
  ensureColumn(db, 'meetings', 'summary_edited_at', 'summary_edited_at INTEGER');
  ensureColumn(db, 'meetings', 'transcript_edited_at', 'transcript_edited_at INTEGER');
  ensureColumn(db, 'actions', 'cat', "cat TEXT DEFAULT '其他'");
  ensureColumn(db, 'actions', 'origin', "origin TEXT DEFAULT '听记'");
  ensureColumn(db, 'actions', 'due', 'due TEXT');
  ensureColumn(db, 'actions', 'closed_at', 'closed_at INTEGER');
  attachClose(db);
  _db = db;
  _refs = 1;
  return db;
}

function ensureColumn(db, table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (cols.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

export function close() {
  if (!_db) return;
  _refs = 1;
  try { _db.close(); } catch { _db = null; _refs = 0; }
}

// ---------- meetings ----------
export function upsertMeeting(db, m) {
  db.prepare(`
    INSERT INTO meetings (task_uuid, title, start_time, end_time, duration_ms, url, source,
                          summary, keywords_json, meeting_time, attendees, ingested_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(task_uuid) DO UPDATE SET
      title=excluded.title, end_time=excluded.end_time, duration_ms=excluded.duration_ms,
      url=excluded.url, summary=excluded.summary, keywords_json=excluded.keywords_json,
      attendees=excluded.attendees, ingested_at=excluded.ingested_at
  `).run(
    m.task_uuid, m.title, m.start_time ?? null, m.end_time ?? null, m.duration_ms ?? null,
    m.url ?? null, m.source ?? 'mine', m.summary ?? null, m.keywords_json ?? null,
    m.meeting_time ?? null, m.attendees ?? null, Date.now()
  );
}

export function listMeetings(db) {
  return db.prepare(`SELECT * FROM meetings ORDER BY start_time DESC`).all();
}

export function getMeeting(db, taskUuid) {
  return db.prepare(`SELECT * FROM meetings WHERE task_uuid = ?`).get(taskUuid);
}

export function listDeletedUuids(db) {
  return db.prepare(`SELECT task_uuid FROM deleted_meetings`).all().map((r) => r.task_uuid);
}

/** 只删本机副本。钉钉听记不动；uuid 记入 deleted_meetings，避免下次同步再入库。 */
export function deleteMeetingLocal(db, taskUuid) {
  const m = getMeeting(db, taskUuid);
  if (!m) return false;
  db.prepare(`
    INSERT INTO deleted_meetings (task_uuid, deleted_at) VALUES (?, ?)
    ON CONFLICT(task_uuid) DO UPDATE SET deleted_at=excluded.deleted_at
  `).run(taskUuid, Date.now());
  db.prepare(`DELETE FROM chunks WHERE task_uuid = ?`).run(taskUuid);
  db.prepare(`DELETE FROM actions WHERE task_uuid = ?`).run(taskUuid);
  db.prepare(`DELETE FROM meetings WHERE task_uuid = ?`).run(taskUuid);
  return true;
}

// ---------- actions ----------
export function clearActions(db, taskUuid) {
  db.prepare(`DELETE FROM actions WHERE task_uuid = ?`).run(taskUuid);
}

export function insertAction(db, a) {
  const r = db.prepare(`
    INSERT INTO actions (task_uuid, title, minutes_todo_id, owner, status, created_time, cat, origin, due, closed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(a.task_uuid, a.title, a.minutes_todo_id ?? null, a.owner ?? null,
         a.status ?? 'open', a.created_time ?? Date.now(),
         a.cat ?? '其他', a.origin ?? '听记', a.due ?? null, a.closed_at ?? null);
  return Number(r.lastInsertRowid);
}

export function getAction(db, id) {
  return db.prepare(`SELECT * FROM actions WHERE id = ?`).get(id);
}

export function deleteAction(db, id) {
  db.prepare(`DELETE FROM actions WHERE id = ?`).run(id);
}

export function updateActionFields(db, id, fields) {
  const allowed = ['title', 'owner', 'status', 'cat', 'origin', 'due', 'closed_at'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (fields[k] === undefined) continue;
    sets.push(`${k} = ?`);
    vals.push(fields[k]);
  }
  if (sets.length === 0) return;
  vals.push(id);
  db.prepare(`UPDATE actions SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

export const DEFAULT_TODO_CATS = ['项目', '部门', '公司', '其他'];

export function getTodoCats(db) {
  const raw = getMeta(db, 'todo_cats');
  if (!raw) return [...DEFAULT_TODO_CATS];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) && a.length ? a.map(String) : [...DEFAULT_TODO_CATS];
  } catch {
    return [...DEFAULT_TODO_CATS];
  }
}

export function setTodoCats(db, cats) {
  setMeta(db, 'todo_cats', JSON.stringify(cats));
}

export function parseTags(raw) {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (!raw) return [];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.map((s) => String(s).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function listActions(db, taskUuid) {
  if (taskUuid) return db.prepare(`SELECT * FROM actions WHERE task_uuid = ?`).all(taskUuid);
  return db.prepare(`SELECT * FROM actions`).all();
}

// ---------- chunks ----------
export function clearChunks(db, taskUuid, kind) {
  if (kind) db.prepare(`DELETE FROM chunks WHERE task_uuid = ? AND kind = ?`).run(taskUuid, kind);
  else db.prepare(`DELETE FROM chunks WHERE task_uuid = ?`).run(taskUuid);
}

export function insertChunk(db, c) {
  const r = db.prepare(`INSERT INTO chunks (task_uuid, kind, chunk_text, vector_json) VALUES (?, ?, ?, ?)`)
    .run(c.task_uuid, c.kind, c.chunk_text, c.vector_json ?? null);
  return Number(r.lastInsertRowid);
}

/** 本机「总结」工作副本。不覆盖钉钉纪要 summary；pull 也不会改这一列。 */
export function saveDeepSummary(db, taskUuid, text) {
  const t = text == null ? '' : String(text);
  updateMeetingFields(db, taskUuid, { deep_summary: t, edited_at: Date.now() });
  db.prepare(`DELETE FROM chunks WHERE task_uuid = ? AND kind = 'deep'`).run(taskUuid);
  if (!t.trim()) return null;
  return insertChunk(db, { task_uuid: taskUuid, kind: 'deep', chunk_text: t });
}

/** 本机改过的记录。补拉听记时跳过覆盖。 */
export function saveRecord(db, taskUuid, text) {
  const t = text == null ? '' : String(text);
  const now = Date.now();
  updateMeetingFields(db, taskUuid, { summary: t, summary_edited_at: now, edited_at: now });
  clearChunks(db, taskUuid, 'summary');
  if (!t.trim()) return [];
  return [insertChunk(db, { task_uuid: taskUuid, kind: 'summary', chunk_text: t })];
}

/** 本机改过的逐字稿。按行落段，补拉时跳过覆盖。 */
export function saveTranscript(db, taskUuid, text) {
  const lines = String(text || '').split(/\n/).map((s) => s.replace(/\s+$/, '')).filter((s) => s.trim());
  const now = Date.now();
  updateMeetingFields(db, taskUuid, { transcript_edited_at: now, edited_at: now });
  clearChunks(db, taskUuid, 'transcript');
  const ids = [];
  for (const line of lines) {
    ids.push(insertChunk(db, { task_uuid: taskUuid, kind: 'transcript', chunk_text: line }));
  }
  return ids;
}

export function updateChunkVector(db, id, vectorJson) {
  db.prepare(`UPDATE chunks SET vector_json = ? WHERE id = ?`).run(vectorJson, id);
}

export function listChunks(db) {
  return db.prepare(`SELECT * FROM chunks WHERE vector_json IS NOT NULL`).all();
}

export function listPendingChunks(db) {
  return db.prepare(`SELECT * FROM chunks WHERE vector_json IS NULL`).all();
}

// ---------- 向量检索（内存余弦相似度，本地轻量，适合万级以下） ----------
export function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function getMeta(db, key) {
  const row = db.prepare(`SELECT value FROM app_meta WHERE key = ?`).get(key);
  return row ? row.value : null;
}

export function setMeta(db, key, value) {
  db.prepare(`
    INSERT INTO app_meta (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(key, value == null ? null : String(value));
}

export function updateMeetingFields(db, taskUuid, fields) {
  const allowed = ['title', 'attendees', 'summary', 'visibility', 'published_at', 'company_doc_id', 'company_dataset_id', 'card_json', 'edited_at', 'scope', 'tags_json', 'source', 'deep_summary', 'summary_edited_at', 'transcript_edited_at'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (fields[k] === undefined) continue;
    sets.push(`${k} = ?`);
    vals.push(fields[k]);
  }
  if (sets.length === 0) return;
  vals.push(taskUuid);
  db.prepare(`UPDATE meetings SET ${sets.join(', ')} WHERE task_uuid = ?`).run(...vals);
}

export function searchChunks(db, queryVector, { topK = 5, threshold = 0 } = {}) {
  const rows = listChunks(db);
  const scored = [];
  for (const row of rows) {
    const vec = JSON.parse(row.vector_json);
    const sim = cosineSimilarity(queryVector, vec);
    if (sim >= threshold) scored.push({ ...row, similarity: sim });
  }
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK);
}
