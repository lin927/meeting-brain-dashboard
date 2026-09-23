// 公司会议知识库发布。
// 一台 RAGFlow、四个数据集；按会议类型写入对应库。
// 项目用 project_name（及可选编号）区分，部门用标签区分。不按项目拆库。
// 同一场会靠 meeting_id 覆盖，不新建第二份。上传前四个库都查；已有则需确认 overwrite。
// 撤回则删除远端那一篇。默认上传本机总结，没有则用记录；不传逐字稿。

import { open, getMeeting, updateMeetingFields, listActions, parseTags } from './db.js';
import { proxiedFetch } from './ask.js';
import {
  normalizeType, canPublishType, typeLabel, datasetForType,
  categoryForMeetingType, categoryFromMeta, DOC_KIND_MEETING,
} from './meeting-type.js';
import { datasetIdForMeeting, resolveKbConfig } from './runtime-config.js';
import { resolveMeetingProject } from './project.js';
import { loadGlossary } from './glossary.js';
import { pushLog } from './runtime-log.js';
import { currentOperator } from './sync-status.js';
import {
  deleteDocuments,
  documentNameTaken,
  findMeetingDocuments,
  listDocuments,
  parseDocuments,
  updateDocumentMetaFields,
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

function sanitizeTitle(raw, fallback = '未命名会议') {
  const s = String(raw ?? '')
    .replace(/^会议录制：/, '')
    .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (s || fallback).slice(0, 80);
}

function shortId(uuid) {
  return String(uuid || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'id';
}

export function meetingFileName(meeting, { collide = false, stillCollide = false } = {}) {
  const title = sanitizeTitle(meeting.title);
  const project = sanitizeTitle(meeting.project_name, '').slice(0, 24);
  const { ymd, hm } = meetingDate(meeting);
  const titleHasProject = project && title.toLowerCase().includes(project.toLowerCase());
  const mid = project && !titleHasProject ? `${project} ${title}` : title;
  let stem = `${ymd} ${mid}`;
  if (collide) stem = `${ymd} ${mid} ${hm}`;
  if (stillCollide) stem = `${stem} ${shortId(meeting.task_uuid)}`;
  return `${stem}.md`;
}

export function companyBodyText(meeting) {
  const deep = String(meeting.deep_summary || '').trim();
  const record = String(meeting.summary || '').trim();
  return deep || record;
}

const ABSTRACT_MAX_CHARS = 300;

function stripMdInline(s) {
  return String(s || '')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clipChars(s, max) {
  const chars = Array.from(String(s || '').trim());
  if (!chars.length) return '';
  if (chars.length <= max) return chars.join('');
  return chars.slice(0, max).join('').replace(/[、，。；\s]+$/u, '') + '…';
}

function sectionAfter(md, headingRe) {
  const m = String(md || '').match(headingRe);
  if (!m) return '';
  const rest = String(md).slice(m.index + m[0].length);
  const next = rest.search(/\n#{1,3}\s+/);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function firstContentParagraph(md) {
  for (const p of String(md || '').split(/\n\s*\n/)) {
    const t = p.trim();
    if (!t || /^#{1,6}\s/.test(t)) continue;
    if (/会议主题|参会人|时间\s*\//.test(t) && t.length < 80) continue;
    const cleaned = stripMdInline(t);
    if (cleaned.length >= 8) return cleaned;
  }
  return '';
}

/** 短摘要：只用本机总结，不用记录/逐字稿。优先「一句话结论」，否则首段，最多 300 字。 */
export function meetingAbstract(meeting) {
  const deep = String((meeting && meeting.deep_summary) || '').trim();
  if (!deep) return '';
  const conclusion = sectionAfter(deep, /#{2,3}\s*(?:[一二三四五六七八九十0-9]+[、.．]\s*)?一句话结论\s*/);
  const raw = conclusion || firstContentParagraph(deep);
  return clipChars(stripMdInline(raw), ABSTRACT_MAX_CHARS);
}

export function buildCompanyMarkdown(meeting, actions, meta) {
  const { when } = meetingDate(meeting);
  const tags = (meta.tags || []).filter(Boolean).join('、');
  const lines = [
    `# ${meeting.title || '未命名会议'}`,
    '',
    `- 会议编号：${meta.meeting_id}`,
    `- 时间：${when || '—'}`,
    `- 类别：${meta.category_label || meta.meeting_type || '—'}`,
    `- 资料类型：${meta.doc_kind_label || '会议'}`,
  ];
  if (meta.dept) lines.push(`- 部门：${meta.dept}`);
  if (meta.project_name) {
    lines.push(`- 项目：${meta.project_name}`);
    if (meta.project_code) lines.push(`- 项目编号：${meta.project_code}`);
  }
  if (meta.abstract) lines.push(`- 摘要：${meta.abstract}`);
  lines.push(
    `- 参会人：${meta.attendees || '—'}`,
    `- 标签：${tags || '—'}`,
    `- 来源：${meta.source || '—'}`,
    `- 上传人：${meta.uploaded_by || '—'}`,
    `- 上传时间：${meta.uploaded_at_label || meta.uploaded_at || '—'}`,
    '',
    '## 总结',
    '',
    companyBodyText(meeting) || '（无）',
  );
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

const OBSOLETE_RAGFLOW_META = ['type', 'type_label'];

export function ragflowMetaFields(meta) {
  const out = {};
  const skip = new Set(['visibility', 'url', 'ragflow_dataset_id', 'ragflow_dataset', 'uploaded_at_label', ...OBSOLETE_RAGFLOW_META]);
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

function firstTag(tags) {
  for (const t of tags || []) {
    const s = String(t || '').trim();
    if (s) return s;
  }
  return '';
}

function themeTags(tags, meta) {
  const skip = new Set(
    [
      meta.project_name, meta.project_code, meta.dept,
      meta.category_label, meta.meeting_type, meta.doc_kind_label,
      '会议', '项目', '公司管理', '公司运营', '部门', '部门管理',
    ].map((s) => String(s || '').trim()).filter(Boolean).map((s) => s.toLowerCase()),
  );
  return (tags || [])
    .map((t) => String(t || '').trim())
    .filter((t) => t && !skip.has(t.toLowerCase()));
}

/** 组装待上传元数据。不要把逐字稿默认送进知识库。 */
export function buildCompanyMetadata(meeting, target) {
  const type = normalizeType(meeting.scope);
  const rawTags = parseTags(meeting.tags_json);
  const source = meeting.provider === 'feishu' ? 'feishu'
    : (meeting.provider === 'tencent' ? 'tencent'
      : (meeting.source === 'import' || meeting.provider === 'import' ? 'import' : 'dingtalk'));
  const cat = categoryForMeetingType(type);
  const project = resolveMeetingProject(meeting, loadGlossary());
  const abstract = meetingAbstract(meeting);
  const meta = {
    meeting_id: meeting.task_uuid,
    title: meeting.title,
    start_time: meeting.start_time || meeting.meeting_time || null,
    attendees: meeting.attendees || '',
    source,
    url: meeting.url || '',
    visibility: 'company',
    meeting_type: type,
    ...DOC_KIND_MEETING,
    ragflow_dataset_id: target && target.datasetId || '',
    ragflow_dataset: target && target.label || '',
    uploaded_by: (target && target.uploadedBy) || '',
    uploaded_at: (target && target.uploadedAt) || '',
    uploaded_at_label: (target && target.uploadedAtLabel) || '',
  };
  if (cat) {
    meta.category = cat.category;
    meta.category_label = cat.category_label;
  }
  if (type === '部门') {
    const dept = firstTag(rawTags);
    if (dept) meta.dept = dept;
  }
  if (cat && (cat.category === 'project' || cat.category === 'project_case') && project.name) {
    meta.project_name = project.name;
    if (project.code) meta.project_code = project.code;
    if (project.aliases && project.aliases.length) meta.project_aliases = project.aliases;
  }
  const tags = themeTags(rawTags, meta);
  if (tags.length) meta.tags = tags;
  if (abstract) meta.abstract = abstract;
  return meta;
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
    type: String(meta.meeting_type || meta.type || '').trim(),
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
    await updateDocumentMetaFields(kb, target.datasetId, doc.id, ragflowMetaFields(meta), {
      deletes: OBSOLETE_RAGFLOW_META,
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
  const project = resolveMeetingProject(m, loadGlossary());
  if (type === '项目' && !project.name) {
    db.close();
    return { error: '项目会议先标明是哪个项目再上传' };
  }
  if (type === '项目' && project.name) {
    m.project_name = project.name;
    m.project_code = project.code || '';
    updateMeetingFields(db, taskUuid, { project_name: project.name, project_code: project.code || '' });
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

function metaCovered(want, have) {
  return Object.entries(want || {}).every(([k, v]) => String((have && have[k]) || '') === String(v));
}

function hasObsoleteMeta(have) {
  return OBSOLETE_RAGFLOW_META.some((k) => String((have && have[k]) || '').trim());
}

/** 给已经传上去、但 RAGFlow 里还是空元数据的会议补写。启动时静默跑一次。 */
export async function repairPublishedMetadata() {
  const db = open();
  const kb = resolveKbConfig(db);
  const rows = db.prepare(`
    SELECT * FROM meetings
    WHERE visibility = 'company'
      AND IFNULL(company_doc_id, '') != ''
      AND IFNULL(company_dataset_id, '') != ''
  `).all();
  db.close();
  if (!kb.url || !kb.apiKey || !rows.length) return { ok: true, updated: 0, failed: 0 };

  const operator = await currentOperator();
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  for (const meeting of rows) {
    const type = normalizeType(meeting.scope);
    const spec = datasetForType(type);
    const publishedAt = Number(meeting.published_at);
    const stamp = Number.isFinite(publishedAt) && publishedAt > 0
      ? meetingDate({ start_time: publishedAt })
      : meetingDate({ start_time: Date.now() });
    try {
      const known = knownDocRef(meeting, kb, meeting.company_dataset_id);
      const found = await findMeetingDocuments(
        kb,
        allDatasetIds(kb, meeting.company_dataset_id),
        meeting.task_uuid,
        known,
      );
      const row = pickExisting(found, meeting.company_dataset_id);
      const doc = row && found.find((f) => f.docId === row.docId);
      if (!doc || !doc.doc) {
        failed += 1;
        console.error(`[publish] 补写跳过「${meeting.title}」：知识库里找不到这篇`);
        continue;
      }
      const existing = docMeta(doc.doc);
      const meta = buildCompanyMetadata(meeting, {
        datasetId: doc.datasetId || meeting.company_dataset_id,
        label: (spec && spec.label) || typeLabel(type),
        uploadedBy: existing.uploaded_by || operator,
        uploadedAt: existing.uploaded_at
          || (Number.isFinite(publishedAt) && publishedAt > 0 ? new Date(publishedAt).toISOString() : ''),
        uploadedAtLabel: stamp.when,
      });
      const fields = ragflowMetaFields(meta);
      const dropTags = !fields.tags && String(existing.tags || '').trim() !== '';
      if (metaCovered(fields, existing) && !hasObsoleteMeta(existing) && !dropTags) {
        skipped += 1;
        continue;
      }
      const deletes = dropTags ? [...OBSOLETE_RAGFLOW_META, 'tags'] : OBSOLETE_RAGFLOW_META;
      await updateDocumentMetaFields(kb, doc.datasetId, doc.docId, fields, { deletes });
      updated += 1;
    } catch (err) {
      failed += 1;
      const msg = `补写「${meeting.title}」元数据失败：${err.message}`;
      console.error('[publish]', msg);
      pushLog('publish', msg, 'error');
    }
  }
  const summary = `补写知识库元数据：更新 ${updated}，跳过 ${skipped}，失败 ${failed}`;
  console.log('[publish]', summary);
  if (updated || failed) pushLog('publish', summary, failed ? 'error' : 'info');

  try {
    const extra = await repairDatasetMeetingFields(kb);
    if (extra.updated || extra.failed) {
      const msg = `知识库旧字段改名：更新 ${extra.updated}，失败 ${extra.failed}`;
      console.log('[publish]', msg);
      pushLog('publish', msg, extra.failed ? 'error' : 'info');
    }
  } catch (err) {
    console.error('[publish] 知识库旧字段改名失败：', err && err.message || err);
  }
  return { ok: true, updated, failed, skipped };
}

async function listAllDocuments(kb, datasetId) {
  const all = [];
  for (let page = 1; page <= 20; page += 1) {
    const docs = await listDocuments(kb, datasetId, { page, page_size: 100, orderby: 'update_time', desc: true });
    all.push(...docs);
    if (docs.length < 100) break;
  }
  return all;
}

function tagsFromMeta(meta) {
  const raw = String((meta && meta.tags) || '').trim();
  if (!raw) return [];
  return raw.split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
}

function meetingFieldsFromExisting(existing) {
  const meetingType = String((existing && (existing.meeting_type || existing.type)) || '').trim();
  const cat = categoryFromMeta(existing);
  const fields = {
    ...DOC_KIND_MEETING,
    doc_kind: String((existing && existing.doc_kind) || '').trim() || DOC_KIND_MEETING.doc_kind,
    doc_kind_label: String((existing && existing.doc_kind_label) || '').trim() || DOC_KIND_MEETING.doc_kind_label,
  };
  if (meetingType) fields.meeting_type = meetingType;
  if (cat) {
    fields.category = cat.category;
    fields.category_label = cat.category_label;
  }
  if (cat && cat.category === 'dept_mgmt') {
    const dept = String((existing && existing.dept) || '').trim() || firstTag(tagsFromMeta(existing));
    if (dept) fields.dept = dept;
  }
  return fields;
}

/** 给知识库里已有会议补 category / doc_kind，同事传的也会扫到。 */
async function repairDatasetMeetingFields(kb) {
  let updated = 0;
  let failed = 0;
  const datasetIds = [...new Set(Object.values(kb.datasets || {}).filter(Boolean))];
  for (const datasetId of datasetIds) {
    let docs = [];
    try {
      docs = await listAllDocuments(kb, datasetId);
    } catch (err) {
      failed += 1;
      console.error(`[publish] 列出知识库 ${datasetId} 失败：${err.message}`);
      continue;
    }
    for (const doc of docs) {
      const existing = docMeta(doc);
      if (!String(existing.meeting_id || '').trim()) continue;
      const fields = meetingFieldsFromExisting(existing);
      if (!fields.category && !fields.meeting_type) continue;
      if (metaCovered(fields, existing) && !hasObsoleteMeta(existing)) continue;
      try {
        await updateDocumentMetaFields(kb, datasetId, doc.id, fields, { deletes: OBSOLETE_RAGFLOW_META });
        updated += 1;
      } catch (err) {
        failed += 1;
        console.error(`[publish] 改名「${doc.name}」失败：${err.message}`);
      }
    }
  }
  return { updated, failed };
}
