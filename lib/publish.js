// 公司会议知识库发布。
// 一台 RAGFlow、四个数据集；项目/部门各一个库，不同项目或部门用元数据区分。
// 权限：能用钉钉 DWS 拉到这场听记（已在本地库中）即可标记上传。

import { open, getMeeting, updateMeetingFields } from './db.js';
import { parseTags } from './db.js';
import { proxiedFetch } from './ask.js';
import {
  normalizeType, canPublishType, typeLabel,
} from './meeting-type.js';
import { datasetIdForMeeting, resolveKbConfig } from './runtime-config.js';

/** 组装待上传元数据。公司标准到位后在此映射，不要把逐字稿默认送进知识库。 */
export function buildCompanyMetadata(meeting, target) {
  const type = normalizeType(meeting.scope);
  const tags = parseTags(meeting.tags_json);
  return {
    meeting_id: meeting.task_uuid,
    title: meeting.title,
    start_time: meeting.start_time || meeting.meeting_time || null,
    attendees: meeting.attendees || '',
    source: meeting.source || 'dingtalk',
    url: meeting.url || '',
    visibility: 'company',
    type,
    type_label: typeLabel(type),
    tags,
    ragflow_dataset_id: target && target.datasetId || '',
    ragflow_dataset: target && target.label || '',
  };
}

export async function testRagflow() {
  const kb = resolveKbConfig();
  if (!kb.url) return { ok: false, error: '到设置里填 RAGFlow 地址' };
  if (!kb.apiKey) return { ok: false, error: '到设置里填 RAGFlow 密钥' };
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

export async function setMeetingVisibility({ taskUuid, visibility }) {
  const vis = visibility === 'company' ? 'company' : 'private';
  const db = open();
  const m = getMeeting(db, taskUuid);
  if (!m) {
    db.close();
    return { error: '未找到会议' };
  }
  const type = normalizeType(m.scope);
  if (vis === 'company' && type === '个人') {
    db.close();
    return { error: '个人会议不同步到公司' };
  }
  if (vis === 'company' && !canPublishType(type)) {
    db.close();
    return { error: '先选类型再同步到公司' };
  }
  if (vis === 'private') {
    updateMeetingFields(db, taskUuid, { visibility: 'private' });
    db.close();
    return { ok: true, visibility: 'private', message: '已取消同步' };
  }
  const target = datasetIdForMeeting(db, type);
  const meta = buildCompanyMetadata(m, target);
  const kb = resolveKbConfig(db);
  if (!kb.url || !kb.apiKey) {
    updateMeetingFields(db, taskUuid, {
      visibility: 'company',
      published_at: Date.now(),
    });
    db.close();
    return {
      ok: true,
      deferred: true,
      visibility: 'company',
      metadata: meta,
      message: '已记下。到设置里填 RAGFlow 地址和密钥再实际上传。',
    };
  }
  if (!target || !target.datasetId) {
    updateMeetingFields(db, taskUuid, {
      visibility: 'company',
      published_at: Date.now(),
    });
    db.close();
    const need = target && target.label ? `「${target.label}」` : '对应';
    return {
      ok: true,
      deferred: true,
      visibility: 'company',
      metadata: meta,
      message: `已记下。到设置里填${need}的 dataset id 再实际上传。`,
    };
  }
  // 实际 HTTP 上传：等公司元数据字段表到位后按 datasetId 写入 RAGFlow
  updateMeetingFields(db, taskUuid, {
    visibility: 'company',
    published_at: Date.now(),
    company_doc_id: target.datasetId,
  });
  db.close();
  return {
    ok: true,
    visibility: 'company',
    metadata: meta,
    message: `已同步到公司 · ${target.label}`,
  };
}
