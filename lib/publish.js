// 公司会议知识库发布。
// 一台 RAGFlow、四个数据集；按会议类型写入对应库，项目/部门用标签区分。
// 同一场会靠 meeting_id 覆盖，不新建第二份。上传前四个库都查；已有则需确认 overwrite。
// 撤回则删除远端那一篇。默认上传本机总结，没有则用记录；不传逐字稿。

import { open, getMeeting, updateMeetingFields, listActions, parseTags } from './db.js';
import { proxiedFetch } from './ask.js';
import {
  normalizeType, canPublishType, typeLabel,
} from './meeting-type.js';
import { datasetIdForMeeting, resolveKbConfig } from './runtime-config.js';
import { pushLog } from './runtime-log.js';
import { currentOperator } from './sync-status.js';
import {
  deleteDocuments,
  documentNameTaken,
  findMeetingDocuments,
  parseDocuments,
  updateDocument,
  uploadDocument,
} from './ragflow.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

function meetingDate(meeting) {
  const ms = Number(meeting.start_time || meeting.meeting_time || Date.now());
  const d = new Date(Number.isFinite(ms) && ms > 0 ? ms : Date.now());
  return {
    ymd: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hm: `${pad(d.getHours())}-${pad(d.getMinutes())}`,
    when: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function sanitizeTitle(raw) {
  const s = String(raw || '未命名会议')
    .replace(/^会议录制：/, '')
    .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (s || '未命名会议').slice(0, 80);
}

function shortId(uuid) {
  return String(uuid || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'id';
}

export function meetingFileName(meeting, { collide = false, stillCollide = false } = {}) {
  const title = sanitizeTitle(meeting.title);
  const { ymd, hm } = meetingDate(meeting);
  let stem = `${ymd} ${title}`;
  if (collide) stem = `${ymd} ${title} ${hm}`;
  if (stillCollide) stem = `${stem} ${shortId(meeting.task_uuid)}`;
  return `${stem}.md`;
}

export function companyBodyText(meeting) {
  const deep = String(meeting.deep_summary || '').trim();
  const record = String(meeting.summary || '').trim();
  return deep || record;
}

export function buildCompanyMarkdown(meeting, actions, meta) {
  const { when } = meetingDate(meeting);
  const tags = (meta.tags || []).filter(Boolean).join('、');
  const lines = [
    `# ${meeting.title || '未命名会议'}`,
    '',
    `- 会议编号：${meta.meeting_id}`,
    `- 时间：${when || '—'}`,
    `- 类型：${meta.type_label || meta.type || '—'}`,
    `- 参会人：${meta.attendees || '—'}`,
    `- 标签：${tags || '—'}`,
    `- 来源：${meta.source || '—'}`,
    `- 上传人：${meta.uploaded_by || '—'}`,
    `- 上传时间：${meta.uploaded_at_label || meta.uploaded_at || '—'}`,
    '',
    '## 总结',
    '',
    companyBodyText(meeting) || '（无）',
  ];
  const todos = (actions || []).filter((a) => String(a.title || '').trim());
  if (todos.length) {
    lines.push('', '## 待办', '');
    for (const a of todos) {
      const mark = a.status === 'done' ? 'x' : ' ';
      const owner = a.owner ? `（${a.owner}）` : '';
      lines.push(`- [${mark}] ${String(a.title).trim()}${owner}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

export function ragflowMetaFields(meta) {
  const out = {};
  const skip = new Set(['visibility', 'url', 'ragflow_dataset_id', 'ragflow_dataset', 'uploaded_at_label']);
  for (const [k, v] of Object.entries(meta || {})) {
    if (skip.has(k) || v == null || v === '') continue;
    if (Array.isArray(v)) {
      const s = v.map((x) => String(x).trim()).filter(Boolean).join('、');
      if (s) out[k] = s;
    } else if (k === 'start_time') {
      const n = Number(v);
      out[k] = Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : String(v);
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

/** 组装待上传元数据。不要把逐字稿默认送进知识库。 */
export function buildCompanyMetadata(meeting, target) {
  const type = normalizeType(meeting.scope);
  const tags = parseTags(meeting.tags_json);
  const source = meeting.source === 'import' ? 'import' : 'dingtalk';
  return {
    meeting_id: meeting.task_uuid,
    title: meeting.title,
    start_time: meeting.start_time || meeting.meeting_time || null,
    attendees: meeting.attendees || '',
    source,
    url: meeting.url || '',
    visibility: 'company',
    type,
    type_label: typeLabel(type),
    tags,
    ragflow_dataset_id: target && target.datasetId || '',
    ragflow_dataset: target && target.label || '',
    uploaded_by: (target && target.uploadedBy) || '',
    uploaded_at: (target && target.uploadedAt) || '',
    uploaded_at_label: (target && target.uploadedAtLabel) || '',
  };
}

function knownDocRef(meeting, kb, currentDatasetId) {
  const docId = String(meeting.company_doc_id || '').trim();
  if (!docId) return {};
  const datasetIds = new Set(Object.values(kb.datasets || {}).filter(Boolean));
  if (datasetIds.has(docId)) return {};
  const datasetId = String(meeting.company_dataset_id || '').trim() || currentDatasetId || '';
  return datasetId ? { docId, datasetId } : { docId, datasetId: currentDatasetId || '' };
}

function allDatasetIds(kb, extra) {
  const ids = Object.values(kb.datasets || {}).filter(Boolean);
  if (extra) ids.push(extra);
  return [...new Set(ids)];
}

function docMeta(doc) {
  return (doc && (doc.meta_fields || doc.metadata || doc.meta)) || {};
}

function existingView(row) {
  const meta = docMeta(row && row.doc);
  return {
    datasetId: row.datasetId,
    docId: row.docId,
    name: row.name || '',
    uploadedBy: String(meta.uploaded_by || '').trim(),
    uploadedAt: String(meta.uploaded_at || '').trim(),
    type: String(meta.type || '').trim(),
  };
}

function pickExisting(found, preferDatasetId) {
  if (!found || !found.length) return null;
  const hit = preferDatasetId && found.find((f) => f.datasetId === preferDatasetId);
  return existingView(hit || found[0]);
}

async function findRemoteCopies(kb, meeting, target) {
  const known = knownDocRef(meeting, kb, target && target.datasetId);
  return findMeetingDocuments(
    kb,
    allDatasetIds(kb, known.datasetId),
    meeting.task_uuid,
    known,
  );
}

export async function peekCompanyMeeting(taskUuid) {
  const db = open();
  const m = getMeeting(db, taskUuid);
  if (!m) {
    db.close();
    return { error: '未找到会议' };
  }
  const type = normalizeType(m.scope);
  const target = datasetIdForMeeting(db, type);
  const kb = resolveKbConfig(db);
  const localVisibility = m.visibility === 'company' ? 'company' : 'private';
  db.close();
  const operator = await currentOperator();
  if (!kb.url || !kb.apiKey) {
    return { ok: true, operator, localVisibility, remote: null };
  }
  try {
    const found = await findRemoteCopies(kb, m, target);
    return {
      ok: true,
      operator,
      localVisibility,
      remote: pickExisting(found, target && target.datasetId),
    };
  } catch (err) {
    return { error: String(err && err.message || err) };
  }
}

function markUnpublished(db, taskUuid) {
  updateMeetingFields(db, taskUuid, {
    visibility: 'private',
    published_at: null,
    company_doc_id: null,
    company_dataset_id: null,
  });
}

async function removeRemoteCopies(kb, datasetIds, meetingId, known) {
  const found = await findMeetingDocuments(kb, datasetIds, meetingId, known, { includeStaleKnown: true });
  const byDs = new Map();
  for (const row of found) {
    if (!byDs.has(row.datasetId)) byDs.set(row.datasetId, []);
    byDs.get(row.datasetId).push(row.docId);
  }
  for (const [datasetId, ids] of byDs) {
    await deleteDocuments(kb, datasetId, ids);
  }
  return found.length;
}

export async function testRagflow() {
  const kb = resolveKbConfig();
  if (!kb.url) return { ok: false, error: '到设置 → 上传 填 RAGFlow 地址' };
  if (!kb.apiKey) return { ok: false, error: '到设置 → 上传 填 RAGFlow 密钥' };
  const res = await proxiedFetch(`${kb.url}/api/v1/datasets?page=1&page_size=30`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${kb.apiKey}` },
  });
  if (res.status >= 400) {
    return { ok: false, error: `RAGFlow ${res.status}: ${res.text.slice(0, 200)}` };
  }
  let data;
  try { data = JSON.parse(res.text); } catch {
    return { ok: false, error: 'RAGFlow 返回非 JSON' };
  }
  const rows = (data && data.data) || [];
  const names = (Array.isArray(rows) ? rows : []).map((r) => r.name || r.id).filter(Boolean);
  return { ok: true, count: names.length, names: names.slice(0, 12) };
}

export async function retractMeeting({ taskUuid } = {}) {
  const db = open();
  const m = getMeeting(db, taskUuid);
  if (!m) {
    db.close();
    return { error: '未找到会议' };
  }
  const kb = resolveKbConfig(db);
  const type = normalizeType(m.scope);
  const target = datasetIdForMeeting(db, type);
  const known = knownDocRef(m, kb, target && target.datasetId);
  const snapshot = { title: m.title, meetingId: m.task_uuid, uploaded: !!known.docId };
  db.close();

  if (kb.url && kb.apiKey) {
    try {
      await removeRemoteCopies(kb, allDatasetIds(kb, known.datasetId), snapshot.meetingId, known);
    } catch (err) {
      const msg = String(err && err.message || err);
      pushLog('publish', `撤回「${snapshot.title}」失败：${msg}`, 'error');
      return { error: `撤回失败：${msg}` };
    }
  } else if (snapshot.uploaded) {
    return { error: '到设置 → 上传 填 RAGFlow 地址和密钥后再撤回' };
  }

  const db2 = open();
  markUnpublished(db2, taskUuid);
  db2.close();
  pushLog('publish', `已撤回「${snapshot.title}」`);
  return { ok: true, visibility: 'private', message: '已取消上传' };
}

async function publishMeeting(meeting, actions, kb, target, operator) {
  const uploadedAt = new Date();
  const stamp = meetingDate({ start_time: uploadedAt.getTime() });
  const meta = buildCompanyMetadata(meeting, {
    ...target,
    uploadedBy: operator,
    uploadedAt: uploadedAt.toISOString(),
    uploadedAtLabel: stamp.when,
  });
  const body = companyBodyText(meeting);
  if (!body) return { error: '没有总结或记录，先写完再上传' };

  const known = knownDocRef(meeting, kb, target.datasetId);
  await removeRemoteCopies(kb, allDatasetIds(kb, known.datasetId), meeting.task_uuid, known);

  let name = meetingFileName(meeting);
  if (await documentNameTaken(kb, target.datasetId, name)) {
    name = meetingFileName(meeting, { collide: true });
  }
  if (await documentNameTaken(kb, target.datasetId, name)) {
    name = meetingFileName(meeting, { collide: true, stillCollide: true });
  }

  const markdown = buildCompanyMarkdown(meeting, actions, meta);
  const doc = await uploadDocument(kb, target.datasetId, name, markdown);
  try {
    await updateDocument(kb, target.datasetId, doc.id, {
      name,
      meta_fields: ragflowMetaFields(meta),
    });
  } catch (err) {
    pushLog('publish', `已上传但元数据未写上：${err.message}`, 'error');
  }
  try {
    await parseDocuments(kb, target.datasetId, [doc.id]);
  } catch (err) {
    pushLog('publish', `已上传但切块未完成：${err.message}`, 'error');
  }
  return { ok: true, docId: doc.id, datasetId: target.datasetId, name, meta };
}

export async function setMeetingVisibility({ taskUuid, visibility, overwrite = false }) {
  const vis = visibility === 'company' ? 'company' : 'private';
  if (vis === 'private') {
    return retractMeeting({ taskUuid });
  }

  const db = open();
  const m = getMeeting(db, taskUuid);
  if (!m) {
    db.close();
    return { error: '未找到会议' };
  }
  const type = normalizeType(m.scope);
  if (type === '个人') {
    db.close();
    return { error: '个人会议不上传' };
  }
  if (!canPublishType(type)) {
    db.close();
    return { error: '先选类型再上传' };
  }
  const target = datasetIdForMeeting(db, type);
  const kb = resolveKbConfig(db);
  const actions = listActions(db, taskUuid);
  db.close();

  if (!kb.url || !kb.apiKey) {
    return { error: '到设置 → 上传 填 RAGFlow 地址和密钥再上传' };
  }
  if (!target || !target.datasetId) {
    const need = target && target.label ? `「${target.label}」` : '对应';
    return { error: `到设置里填${need}的 dataset id 再上传` };
  }

  const operator = await currentOperator();
  if (!overwrite) {
    try {
      const found = await findRemoteCopies(kb, m, target);
      if (found.length) {
        return {
          ok: false,
          needsOverwrite: true,
          existing: pickExisting(found, target.datasetId),
          operator,
        };
      }
    } catch (err) {
      const msg = String(err && err.message || err);
      return { error: `查询知识库失败：${msg}` };
    }
  }

  let uploaded;
  try {
    uploaded = await publishMeeting(m, actions, kb, target, operator);
  } catch (err) {
    const msg = String(err && err.message || err);
    pushLog('publish', `上传「${m.title}」失败：${msg}`, 'error');
    return { error: `上传失败：${msg}` };
  }
  if (uploaded.error) return uploaded;

  const db2 = open();
  updateMeetingFields(db2, taskUuid, {
    visibility: 'company',
    published_at: Date.now(),
    company_doc_id: uploaded.docId,
    company_dataset_id: uploaded.datasetId,
  });
  db2.close();
  pushLog('publish', `已上传「${m.title}」到${type}（${uploaded.name}）`);
  return {
    ok: true,
    visibility: 'company',
    documentId: uploaded.docId,
    datasetId: uploaded.datasetId,
    filename: uploaded.name,
    metadata: uploaded.meta,
    message: `已上传到${type}`,
  };
}
