// 手动导入非钉钉会议材料（粘贴纪要 / 转写文本）。

import { randomUUID } from 'node:crypto';
import { open, upsertMeeting, insertChunk, updateMeetingFields } from './db.js';
import { indexChunks } from './embed.js';

function parseMeetingStart({ date, meetingTime } = {}) {
  const now = Date.now();
  const ymd = String(date || (typeof meetingTime === 'string' ? meetingTime : '')).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const local = new Date(y, mo, d);
    if (local.getFullYear() !== y || local.getMonth() !== mo || local.getDate() !== d) return now;
    const today = new Date(now);
    if (today.getFullYear() === y && today.getMonth() === mo && today.getDate() === d) return now;
    return new Date(y, mo, d, 12, 0, 0, 0).getTime();
  }
  const n = Number(meetingTime);
  if (Number.isFinite(n) && n > 1e11) return n;
  if (Number.isFinite(n) && n > 1e9) return n * 1000;
  return now;
}

export async function importMeeting({ title, body, date, meetingTime } = {}) {
  const t = String(title || '').trim() || '未命名会议';
  const text = String(body || '').trim();
  if (!text) return { error: '缺少正文' };
  const taskUuid = 'import-' + randomUUID();
  const ts = parseMeetingStart({ date, meetingTime });
  const db = open();
  upsertMeeting(db, {
    task_uuid: taskUuid,
    title: t,
    start_time: ts,
    meeting_time: ts,
    source: 'import',
    summary: text.slice(0, 8000),
    attendees: null,
  });
  updateMeetingFields(db, taskUuid, { scope: '个人', tags_json: '[]', visibility: 'private' });
  const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = parts.length > 0 ? parts : [text];
  for (const c of chunks) {
    insertChunk(db, { task_uuid: taskUuid, kind: 'transcript', chunk_text: c });
  }
  db.close();
  try { await indexChunks(); } catch (e) { console.error('import indexChunks:', e.message); }
  return { ok: true, id: taskUuid, title: t, chunks: chunks.length };
}
