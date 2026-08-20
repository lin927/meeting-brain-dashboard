// 本地结构化存储层：会议档案、待办、向量块。
// 全部落在本地 SQLite 文件，数据不出本机。向量以 JSON blob 存储，检索时内存余弦相似度。

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_DB = join(homedir(), '.dsh', 'meetings', 'meeting-brain.sqlite');

let _db = null;

export function dbPath(override) {
  return override || process.env.MEETING_BRAIN_DB || DEFAULT_DB;
}

export function open(override) {
  if (_db) {
    // 单例若已被 close，重建
    try { _db.prepare('SELECT 1').get(); return _db; }
    catch { _db = null; }
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
      source         TEXT DEFAULT 'mine',      -- mine | shared
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
      kind           TEXT NOT NULL,             -- summary | transcript | action
      chunk_text     TEXT NOT NULL,
      vector_json    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_chunks_task ON chunks(task_uuid);
    CREATE INDEX IF NOT EXISTS idx_actions_task ON actions(task_uuid);
  `);
  _db = db;
  return db;
}

export function close() {
  if (_db) { try { _db.close(); } catch {} _db = null; }
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

// ---------- actions ----------
export function clearActions(db, taskUuid) {
  db.prepare(`DELETE FROM actions WHERE task_uuid = ?`).run(taskUuid);
}

export function insertAction(db, a) {
  db.prepare(`
    INSERT INTO actions (task_uuid, title, minutes_todo_id, owner, status, created_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(a.task_uuid, a.title, a.minutes_todo_id ?? null, a.owner ?? null,
         a.status ?? 'open', a.created_time ?? null);
}

export function listActions(db, taskUuid) {
  if (taskUuid) return db.prepare(`SELECT * FROM actions WHERE task_uuid = ?`).all(taskUuid);
  return db.prepare(`SELECT * FROM actions`).all();
}

// ---------- chunks ----------
export function clearChunks(db, taskUuid) {
  db.prepare(`DELETE FROM chunks WHERE task_uuid = ?`).run(taskUuid);
}

export function insertChunk(db, c) {
  db.prepare(`INSERT INTO chunks (task_uuid, kind, chunk_text, vector_json) VALUES (?, ?, ?, ?)`)
    .run(c.task_uuid, c.kind, c.chunk_text, c.vector_json ?? null);
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
