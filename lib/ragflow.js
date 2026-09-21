// RAGFlow HTTP：上传/查文档/改元数据/切块/删除。不新建知识库。
import { randomBytes } from 'node:crypto';
import { proxiedFetch } from './ask.js';

function stripSlash(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function parseBody(text) {
  if (!text) return {};
  try { return JSON.parse(text); } catch {
    throw new Error('RAGFlow 返回非 JSON');
  }
}

function ragflowError(res, data) {
  const msg = (data && (data.message || data.msg)) || res.text.slice(0, 200);
  return new Error(`RAGFlow ${res.status}: ${msg || '请求失败'}`);
}

function isGone(err) {
  const s = String(err && err.message || err);
  return /does not have the document|doesn't exist|not found|不存在|不拥有|don't own the document/i.test(s);
}

export function encodeMultipartFile(filename, content) {
  const boundary = '----MeetingBrain' + randomBytes(12).toString('hex');
  const name = String(filename || 'meeting.md');
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
  const star = encodeURIComponent(name).replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const head =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${ascii || 'meeting.md'}"; filename*=UTF-8''${star}\r\n` +
    `Content-Type: text/markdown; charset=utf-8\r\n\r\n`;
  const body = Buffer.concat([
    Buffer.from(head, 'utf8'),
    Buffer.from(String(content || ''), 'utf8'),
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
  ]);
  return { body, contentType: `multipart/form-data; boundary=${boundary}` };
}

export async function ragflowRequest(kb, { method, path, json, rawBody, contentType }) {
  const url = `${stripSlash(kb.url)}${path}`;
  const headers = { Authorization: `Bearer ${kb.apiKey}` };
  let body = '';
  if (rawBody) {
    body = rawBody;
    if (contentType) headers['Content-Type'] = contentType;
  } else if (json !== undefined) {
    body = JSON.stringify(json);
    headers['Content-Type'] = 'application/json';
  }
  const res = await proxiedFetch(url, { method: method || 'GET', headers, body });
  const data = parseBody(res.text);
  if (res.status >= 400) throw ragflowError(res, data);
  if (data && data.code != null && Number(data.code) !== 0) throw ragflowError(res, data);
  return data;
}

function docsFrom(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.docs)) return data.docs;
  if (Array.isArray(data.documents)) return data.documents;
  return [];
}

export async function listDocuments(kb, datasetId, query = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === '') continue;
    q.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const qs = q.toString();
  const path = `/api/v1/datasets/${encodeURIComponent(datasetId)}/documents${qs ? `?${qs}` : ''}`;
  const data = await ragflowRequest(kb, { method: 'GET', path });
  return docsFrom(data && data.data);
}

export async function uploadDocument(kb, datasetId, filename, content) {
  const { body, contentType } = encodeMultipartFile(filename, content);
  const data = await ragflowRequest(kb, {
    method: 'POST',
    path: `/api/v1/datasets/${encodeURIComponent(datasetId)}/documents`,
    rawBody: body,
    contentType,
  });
  const docs = docsFrom(data && data.data);
  const doc = docs[0] || (data && data.data && !Array.isArray(data.data) ? data.data : null);
  if (!doc || !doc.id) throw new Error('RAGFlow 上传成功但没有返回文档 id');
  return doc;
}

export async function updateDocument(kb, datasetId, documentId, body) {
  const path = `/api/v1/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(documentId)}`;
  try {
    return await ragflowRequest(kb, { method: 'PATCH', path, json: body });
  } catch (err) {
    if (!/405|Method Not Allowed/i.test(String(err && err.message))) throw err;
    return ragflowRequest(kb, { method: 'PUT', path, json: body });
  }
}

/** 共享知识库往往不许改单篇文档，但允许批量写元数据；自有库则走 PATCH/PUT。 */
export async function updateDocumentMetaFields(kb, datasetId, documentId, metaFields, opts = {}) {
  const fields = metaFields || {};
  const updates = Object.entries(fields)
    .filter(([, v]) => v != null && v !== '')
    .map(([key, value]) => ({ key, value }));
  const deletes = [...new Set((opts.deletes || []).map((k) => {
    if (k && typeof k === 'object') return String(k.key || '').trim();
    return String(k || '').trim();
  }).filter(Boolean))].map((key) => ({ key }));
  if (!updates.length && !deletes.length) return { code: 0 };
  try {
    return await ragflowRequest(kb, {
      method: 'PATCH',
      path: `/api/v1/datasets/${encodeURIComponent(datasetId)}/documents/metadatas`,
      json: { selector: { document_ids: [documentId] }, updates, deletes },
    });
  } catch (err) {
    try {
      return await updateDocument(kb, datasetId, documentId, { meta_fields: fields });
    } catch (err2) {
      throw new Error(`${err.message}；${err2.message}`);
    }
  }
}

export async function parseDocuments(kb, datasetId, documentIds) {
  const ids = (documentIds || []).filter(Boolean);
  if (!ids.length) return;
  await ragflowRequest(kb, {
    method: 'POST',
    path: `/api/v1/datasets/${encodeURIComponent(datasetId)}/chunks`,
    json: { document_ids: ids },
  });
}

export async function deleteDocuments(kb, datasetId, ids) {
  const list = [...new Set((ids || []).filter(Boolean))];
  if (!list.length) return { ok: true, deleted: 0 };
  try {
    await ragflowRequest(kb, {
      method: 'DELETE',
      path: `/api/v1/datasets/${encodeURIComponent(datasetId)}/documents`,
      json: { ids: list },
    });
    return { ok: true, deleted: list.length };
  } catch (err) {
    if (isGone(err)) return { ok: true, deleted: 0, gone: true };
    throw err;
  }
}

function metaMeetingId(doc) {
  const meta = (doc && (doc.meta_fields || doc.metadata || doc.meta)) || {};
  return String(meta.meeting_id || '').trim();
}

async function listByMeetingMeta(kb, datasetId, meetingId) {
  try {
    const docs = await listDocuments(kb, datasetId, {
      page: 1,
      page_size: 50,
      metadata_condition: {
        logic: 'and',
        conditions: [{ name: 'meeting_id', comparison_operator: 'is', value: meetingId }],
      },
    });
    return docs.filter((d) => metaMeetingId(d) === meetingId);
  } catch {
    return null;
  }
}

async function scanByMeetingId(kb, datasetId, meetingId) {
  const hits = [];
  for (let page = 1; page <= 5; page += 1) {
    const docs = await listDocuments(kb, datasetId, { page, page_size: 100, orderby: 'update_time', desc: true });
    for (const doc of docs) {
      if (metaMeetingId(doc) === meetingId) hits.push(doc);
    }
    if (docs.length < 100) break;
  }
  return hits;
}

/** 在若干数据集里找出这场会已有的文档（覆盖/撤回都靠 meeting_id，不靠文件名）。 */
export async function findMeetingDocuments(kb, datasetIds, meetingId, known = {}, opts = {}) {
  const found = [];
  const seen = new Set();
  const push = (datasetId, doc) => {
    const id = doc && doc.id;
    if (!datasetId || !id) return;
    const key = `${datasetId}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ datasetId, docId: id, name: doc.name || '', doc });
  };

  const datasets = [...new Set((datasetIds || []).filter(Boolean))];
  if (known.docId && known.datasetId && !datasets.includes(known.datasetId)) datasets.push(known.datasetId);

  if (known.docId && known.datasetId) {
    try {
      const docs = await listDocuments(kb, known.datasetId, {
        page: 1,
        page_size: 100,
        orderby: 'update_time',
        desc: true,
      });
      const hit = docs.find((d) => d.id === known.docId);
      if (hit) push(known.datasetId, hit);
      else if (opts.includeStaleKnown) push(known.datasetId, { id: known.docId, name: '' });
    } catch (err) {
      if (!isGone(err)) throw err;
      if (opts.includeStaleKnown) push(known.datasetId, { id: known.docId, name: '' });
    }
  }

  for (const datasetId of datasets) {
    let docs = await listByMeetingMeta(kb, datasetId, meetingId);
    if (docs === null && !known.docId) docs = await scanByMeetingId(kb, datasetId, meetingId);
    for (const doc of docs || []) push(datasetId, doc);
  }
  return found;
}

export async function documentNameTaken(kb, datasetId, name, ignoreDocId) {
  if (!name) return false;
  try {
    const docs = await listDocuments(kb, datasetId, { name, page: 1, page_size: 10 });
    return docs.some((d) => d.name === name && d.id !== ignoreDocId);
  } catch {
    return false;
  }
}
