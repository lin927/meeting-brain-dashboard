import { upsertMeeting, getMeeting, clearActions, insertAction, clearChunks, insertChunk } from './db.js';
import { classifyNewMeeting } from './classify.js';
import { inferProvider, providerMeta } from './providers/ids.js';

export function writeTranscriptChunks(db, taskUuid, plist) {
  clearChunks(db, taskUuid, 'transcript');
  let n = 0;
  for (const p of plist || []) {
    if (typeof p === 'string') {
      const t = p.trim();
      if (!t) continue;
      insertChunk(db, { task_uuid: taskUuid, kind: 'transcript', chunk_text: t });
      n += 1;
      continue;
    }
    const speaker = p.nickName ?? p.speakerDisplay?.nickName ?? p.speaker ?? p.user_name ?? p.name ?? '';
    const text = p.paragraph ?? p.text ?? p.content ?? p.sentence ?? '';
    if (!text) continue;
    insertChunk(db, {
      task_uuid: taskUuid,
      kind: 'transcript',
      chunk_text: speaker ? `【${speaker}】${text}` : String(text),
    });
    n += 1;
  }
  return n;
}

export function transcriptFromText(text) {
  return String(text || '').split(/\n/).map((s) => s.replace(/\s+$/, '')).filter((s) => s.trim());
}

/** 增量同步：本机还没有的，或有记录但缺开会时间的，才再拉。空纪要不再每次回填。 */
export function meetingNeedsRefresh(db, taskUuid) {
  const row = getMeeting(db, taskUuid);
  if (!row) return true;
  return !row.start_time;
}

/** 把归一化后的一场会写入本机库。本机手改过的记录/逐字稿不覆盖。 */
export function ingestNormalized(db, rec, { skipTranscript = false, log = () => {} } = {}) {
  const taskUuid = rec.task_uuid;
  const prev = getMeeting(db, taskUuid);
  const isNew = !prev;
  const keptRecord = !!(prev && prev.summary_edited_at);
  const keptTranscript = !!(prev && prev.transcript_edited_at);
  const provider = rec.provider || inferProvider({ ...prev, ...rec });
  const origin = rec.origin || providerMeta(provider).origin;
  upsertMeeting(db, {
    task_uuid: taskUuid,
    title: rec.title || (prev && prev.title) || '未命名会议',
    start_time: rec.start_time ?? (prev && prev.start_time),
    end_time: rec.end_time ?? (prev && prev.end_time),
    duration_ms: rec.duration_ms ?? (prev && prev.duration_ms),
    url: rec.url ?? (prev && prev.url),
    source: rec.source || (prev && prev.source) || 'mine',
    summary: keptRecord ? prev.summary : rec.summary,
    keywords_json: rec.keywords != null
      ? (typeof rec.keywords === 'string' ? rec.keywords : JSON.stringify(rec.keywords))
      : (keptRecord ? prev.keywords_json : null),
    attendees: keptRecord ? prev.attendees : (rec.attendees ?? null),
    meeting_time: rec.meeting_time ?? rec.start_time,
    provider,
    remote_id: rec.remote_id || (prev && prev.remote_id) || '',
    remote_json: rec.remote_json
      ? (typeof rec.remote_json === 'string' ? rec.remote_json : JSON.stringify(rec.remote_json))
      : (prev && prev.remote_json) || null,
  });

  let actionTitles = new Set();
  let todosOk = rec.todos === undefined;
  if (rec.todos !== undefined) {
    todosOk = true;
    clearActions(db, taskUuid);
    for (const t of rec.todos || []) {
      let title = null;
      let minutesTodoId = null;
      if (typeof t === 'string') {
        try { const parsed = JSON.parse(t); title = parsed.value ?? parsed.title ?? parsed.content; }
        catch { title = t; }
      } else {
        title = t.title ?? t.value ?? t.text ?? t.content ?? t.todo;
        minutesTodoId = t.minutesTodoId ?? t.id ?? t.todo_id ?? null;
      }
      title = String(title || '').trim();
      if (!title || actionTitles.has(title)) continue;
      actionTitles.add(title);
      insertAction(db, {
        task_uuid: taskUuid,
        title,
        minutes_todo_id: minutesTodoId,
        status: 'open',
        origin,
      });
    }
  }

  let nChunks = 0;
  if (!skipTranscript) {
    if (keptTranscript) {
      nChunks = db.prepare(`SELECT COUNT(*) c FROM chunks WHERE task_uuid = ? AND kind = 'transcript'`).get(taskUuid).c;
    } else if (rec.transcript) {
      nChunks = writeTranscriptChunks(db, taskUuid, rec.transcript);
    }
    if (!keptRecord) {
      clearChunks(db, taskUuid, 'summary');
      if (rec.summary) {
        insertChunk(db, { task_uuid: taskUuid, kind: 'summary', chunk_text: rec.summary });
      }
    }
  }

  log(`  ✓ ${rec.title || taskUuid} (${String(taskUuid).slice(0, 10)}…) 待办${actionTitles.size} 段落${nChunks}`);
  if (isNew) {
    try { classifyNewMeeting(db, taskUuid); } catch { /* ignore */ }
  }
  const chunkIds = db.prepare(`SELECT id FROM chunks WHERE task_uuid = ? AND kind IN ('summary','transcript')`).all(taskUuid).map((r) => r.id);
  return {
    ok: true,
    title: rec.title || '',
    keptRecord,
    keptTranscript,
    todosUpdated: todosOk,
    actionCount: actionTitles.size,
    transcriptCount: nChunks,
    chunkIds,
  };
}
