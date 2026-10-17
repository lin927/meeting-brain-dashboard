// 公司会议知识库发布。
// 走 HTWorkbuddy 知识库网关，不直连 RAGFlow。
// 类型决定知识库：公司管理 / 公司运营 / 项目 / 部门。个人会不上传。
// 项目必须有精确 project_code。部门必须有 department_id，写入网关时为 department_code 与 department_name_snapshot。
// 点上传即拥有者确认：prepare 后立刻 confirm。覆盖先 revoke 再归档。

import { open, getMeeting, updateMeetingFields, listActions, parseTags } from './db.js';
import {
  normalizeType, canPublishType, knowledgeTargetForType,
  categoryForMeetingType, DOC_KIND_MEETING,
} from './meeting-type.js';
import { resolveHtConfig } from './runtime-config.js';
import { resolveMeetingProject } from './project.js';
import { resolveMeetingDepartment } from './department.js';
import { loadGlossary } from './glossary.js';
import { pushLog } from './runtime-log.js';
import { currentOperator } from './sync-status.js';
import {
  SOURCE_SYSTEM,
  contentHash,
  isGatewayDocumentUid,
  getKnowledgeSchema,
  schemaAllowsContribute,
  contributeDeniedMessage,
  prepareKnowledgeDocument,
  confirmKnowledgeDocument,
  revokeKnowledgeDocument,
} from './knowledge.js';

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

function isoOccurredAt(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return '';
  const d = new Date(n);
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
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

/** 组装 markdown 里用的展示字段。网关规范 metadata 另走 buildGatewayMetadata。 */
export function buildCompanyMetadata(meeting, target) {
  const type = normalizeType(meeting.scope);
  const rawTags = parseTags(meeting.tags_json);
  const source = meeting.provider === 'feishu' ? 'feishu'
    : (meeting.provider === 'tencent' ? 'tencent'
      : (meeting.source === 'import' || meeting.provider === 'import' ? 'import' : 'dingtalk'));
  const cat = categoryForMeetingType(type);
  const glossary = loadGlossary();
  const project = resolveMeetingProject(meeting, glossary);
  const department = resolveMeetingDepartment(meeting, glossary);
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
    knowledge_base_code: target && target.knowledgeBaseCode || '',
    uploaded_by: (target && target.uploadedBy) || '',
    uploaded_at: (target && target.uploadedAt) || '',
    uploaded_at_label: (target && target.uploadedAtLabel) || '',
  };
  if (cat) {
    meta.category = cat.category;
    meta.category_label = cat.category_label;
  }
  if (type === '部门' && department.name) meta.dept = department.name;
  if (cat && cat.category === 'project' && project.name) {
    meta.project_name = project.name;
    if (project.code) meta.project_code = project.code;
  }
  const tags = themeTags(rawTags, meta);
  if (tags.length) meta.tags = tags;
  if (abstract) meta.abstract = abstract;
  return meta;
}

export function buildGatewayMetadata(meeting) {
  const type = normalizeType(meeting.scope);
  const cat = categoryForMeetingType(type);
  if (!cat) throw new Error('先选类型再上传');
  const glossary = loadGlossary();
  const project = resolveMeetingProject(meeting, glossary);
  const department = resolveMeetingDepartment(meeting, glossary);
  const occurred = isoOccurredAt(meeting.start_time || meeting.meeting_time);
  const title = String(meeting.title || '').trim() || '未命名会议';
  const meta = {
    source_system: SOURCE_SYSTEM,
    source_record_id: String(meeting.task_uuid || '').trim(),
    doc_kind: 'meeting',
    category: cat.category,
    title,
    sensitivity: type === '公司管理' ? 'confidential' : 'internal',
  };
  if (occurred) meta.occurred_at = occurred;
  if (type === '项目') {
    const code = String(project.code || '').trim();
    if (!code) throw new Error('项目会议先标明带编号的项目再上传');
    meta.project_code = code;
    if (project.name) meta.project_name_snapshot = project.name;
  }
  if (type === '部门') {
    const code = String(department.code || '').trim();
    if (!code) throw new Error('部门会议先标明带编号的部门再上传');
    meta.department_code = code;
    if (department.name) meta.department_name_snapshot = department.name;
  }
  return meta;
}

function localExisting(meeting, operator) {
  const docId = String(meeting.company_doc_id || '').trim();
  if (!docId) return null;
  const publishedAt = Number(meeting.published_at);
  return {
    datasetId: String(meeting.company_dataset_id || '').trim(),
    docId,
    name: '',
    uploadedBy: operator || '',
    uploadedAt: Number.isFinite(publishedAt) && publishedAt > 0 ? new Date(publishedAt).toISOString() : '',
    type: normalizeType(meeting.scope),
    gateway: isGatewayDocumentUid(docId),
  };
}

export async function peekCompanyMeeting(taskUuid) {
  const db = open();
  const m = getMeeting(db, taskUuid);
  if (!m) {
    db.close();
    return { error: '未找到会议' };
  }
  const localVisibility = m.visibility === 'company' ? 'company' : 'private';
  const snapshot = { ...m };
  db.close();
  const operator = await currentOperator();
  return {
    ok: true,
    operator,
    localVisibility,
    remote: localExisting(snapshot, operator),
  };
}

function markUnpublished(db, taskUuid) {
  updateMeetingFields(db, taskUuid, {
    visibility: 'private',
    published_at: null,
    company_doc_id: null,
    company_dataset_id: null,
  });
}

function htReadyError() {
  const ht = resolveHtConfig();
  if (!ht.url) return '到设置 → 外部系统 填公司数智系统地址';
  if (!ht.apiKey) return '到设置 → 外部系统 填公司数智系统接入令牌';
  return '';
}

async function revokeIfGateway(docId) {
  const uid = String(docId || '').trim();
  if (!isGatewayDocumentUid(uid)) return { skipped: true };
  await revokeKnowledgeDocument(uid);
  return { skipped: false };
}

function isGatewayRevokeDenied(err) {
  return String((err && err.message) || err).includes('无权撤销该文档');
}

export async function retractMeeting({ taskUuid } = {}) {
  const db = open();
  const m = getMeeting(db, taskUuid);
  if (!m) {
    db.close();
    return { error: '未找到会议' };
  }
  const snapshot = {
    title: m.title,
    docId: String(m.company_doc_id || '').trim(),
  };
  db.close();

  let remoteSkipped = !isGatewayDocumentUid(snapshot.docId);
  if (isGatewayDocumentUid(snapshot.docId)) {
    const missing = htReadyError();
    if (missing) return { error: missing + '后再撤回' };
    try {
      await revokeIfGateway(snapshot.docId);
    } catch (err) {
      const msg = String(err && err.message || err);
      if (!isGatewayRevokeDenied(err)) {
        pushLog('publish', `撤回「${snapshot.title}」失败：${msg}`, 'error');
        return { error: `撤回失败：${msg}` };
      }
      remoteSkipped = true;
      pushLog('publish', `撤回「${snapshot.title}」：网关没有可撤销的已发布稿，只取消本机标记`);
    }
  }

  const db2 = open();
  markUnpublished(db2, taskUuid);
  db2.close();
  pushLog('publish', `已撤回「${snapshot.title}」`);
  const message = remoteSkipped && isGatewayDocumentUid(snapshot.docId)
    ? '本机已取消上传标记。网关只能撤销已经发布成功的文档；这篇多半还在后台发布、发布失败，或不是用你的令牌归档的。'
    : (isGatewayDocumentUid(snapshot.docId)
      ? '已取消上传'
      : (snapshot.docId
        ? '已取消本机上传标记。以前传到 RAGFlow 的那篇不会自动删，需要的话重新归档到知识库网关。'
        : '已取消上传'));
  return { ok: true, visibility: 'private', message };
}

async function publishMeeting(meeting, actions, target, operator, { overwrite = false } = {}) {
  const uploadedAt = new Date();
  const stamp = meetingDate({ start_time: uploadedAt.getTime() });
  const displayMeta = buildCompanyMetadata(meeting, {
    ...target,
    uploadedBy: operator,
    uploadedAt: uploadedAt.toISOString(),
    uploadedAtLabel: stamp.when,
  });
  const body = companyBodyText(meeting);
  if (!body) return { error: '没有总结或记录，先写完再上传' };

  let gatewayMeta;
  try {
    gatewayMeta = buildGatewayMetadata(meeting);
  } catch (err) {
    return { error: String(err && err.message || err) };
  }

  const oldUid = String(meeting.company_doc_id || '').trim();
  if (overwrite && isGatewayDocumentUid(oldUid)) {
    try {
      await revokeIfGateway(oldUid);
    } catch (err) {
      if (!isGatewayRevokeDenied(err)) {
        return { error: `覆盖前撤回旧稿失败：${err && err.message || err}` };
      }
    }
  }

  const markdown = buildCompanyMarkdown(meeting, actions, displayMeta);
  const digest = contentHash(markdown);
  const idempotencyKey = [
    'meeting-assistant',
    meeting.task_uuid,
    digest.slice(0, 16),
    overwrite && oldUid ? oldUid : 'new',
  ].join(':');

  const prepared = await prepareKnowledgeDocument({
    knowledgeBaseCode: target.knowledgeBaseCode,
    content: markdown,
    metadata: gatewayMeta,
    idempotencyKey,
  });
  const draftId = String(prepared.draft_id || '').trim();
  const documentUid = String(prepared.document_uid || '').trim();
  if (!draftId || !documentUid) {
    return { error: '知识库网关没有返回草稿编号' };
  }

  const confirmed = await confirmKnowledgeDocument(draftId);
  const status = String((confirmed && confirmed.status) || '').trim();
  return {
    ok: true,
    docId: documentUid,
    datasetId: target.knowledgeBaseCode,
    name: meetingFileName(meeting),
    meta: displayMeta,
    status,
  };
}

function publishMessage(type, status) {
  if (status === 'awaiting_publication_approval') {
    return `已提交到${type}，等待知识库管理员发布`;
  }
  if (status === 'pending') {
    return `已上传到${type}，知识库后台正在发布`;
  }
  return `已上传到${type}`;
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
  if (type === '项目' && !String(project.code || '').trim()) {
    db.close();
    return { error: '项目会议必须有项目编号，先从称呼表选带编号的项目再上传' };
  }
  if (type === '项目' && project.name) {
    m.project_name = project.name;
    m.project_code = project.code || '';
    updateMeetingFields(db, taskUuid, { project_name: project.name, project_code: project.code || '' });
  }
  const department = resolveMeetingDepartment(m, loadGlossary());
  if (type === '部门' && !department.name) {
    db.close();
    return { error: '部门会议先标明是哪个部门再上传' };
  }
  if (type === '部门' && !String(department.code || '').trim()) {
    db.close();
    return { error: '部门会议必须有部门编号，先从称呼表选带编号的部门再上传' };
  }
  if (type === '部门' && department.name) {
    m.department_name = department.name;
    m.department_id = department.code || '';
    updateMeetingFields(db, taskUuid, { department_name: department.name, department_id: department.code || '' });
  }
  const target = knowledgeTargetForType(type);
  const actions = listActions(db, taskUuid);
  const existing = localExisting(m);
  db.close();

  const missing = htReadyError();
  if (missing) return { error: missing + '再上传' };
  if (!target || !target.knowledgeBaseCode) {
    return { error: '这场会的类型没有对应知识库' };
  }

  try {
    const schema = await getKnowledgeSchema(target.knowledgeBaseCode);
    if (!schemaAllowsContribute(schema)) {
      return { error: contributeDeniedMessage(type, target.knowledgeBaseCode) };
    }
  } catch (err) {
    const msg = String(err && err.message || err);
    if (msg.includes('无权访问该知识库')) {
      return { error: contributeDeniedMessage(type, target.knowledgeBaseCode) };
    }
    return { error: `查询知识库权限失败：${msg}` };
  }

  const operator = await currentOperator();
  if (!overwrite && existing) {
    return {
      ok: false,
      needsOverwrite: true,
      existing,
      operator,
    };
  }

  let uploaded;
  try {
    uploaded = await publishMeeting(m, actions, target, operator, { overwrite });
  } catch (err) {
    const msg = String(err && err.message || err);
    pushLog('publish', `上传「${m.title}」失败：${msg}`, 'error');
    if (msg.includes('无权访问该知识库')) {
      return { error: contributeDeniedMessage(type, target.knowledgeBaseCode) };
    }
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
  const message = publishMessage(type, uploaded.status);
  pushLog('publish', `「${m.title}」${message}`);
  return {
    ok: true,
    visibility: 'company',
    documentId: uploaded.docId,
    datasetId: uploaded.datasetId,
    filename: uploaded.name,
    metadata: uploaded.meta,
    status: uploaded.status,
    message,
  };
}
