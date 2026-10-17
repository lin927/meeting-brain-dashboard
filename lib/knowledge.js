// HTWorkbuddy 知识库网关。调用方只传 knowledge_base_code，不接触 RAGFlow。
import { createHash } from 'node:crypto';
import { proxiedFetch } from './ask.js';
import { KB_TARGETS } from './meeting-type.js';
import { resolveHtConfig } from './runtime-config.js';

export const KNOWLEDGE_PATH = '/api/integrations/v1/knowledge';
export const SOURCE_SYSTEM = 'meeting_assistant';

function parseBody(text) {
  if (!text) return {};
  try { return JSON.parse(text); } catch {
    throw new Error('知识库网关返回非 JSON');
  }
}

function gatewayError(status, data, text) {
  const msg = (data && (data.error || data.message || data.detail)) || String(text || '').slice(0, 200);
  return new Error(msg ? (`知识库网关 ${status}: ` + msg) : (`知识库网关 ${status}`));
}

export function contentHash(text) {
  return createHash('sha256').update(String(text || ''), 'utf8').digest('hex');
}

export function isGatewayDocumentUid(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || '').trim());
}

async function knowledgeRequest(method, path, { query, json } = {}) {
  const cfg = resolveHtConfig();
  if (!cfg.url) throw new Error('到设置 → 外部系统 填公司数智系统地址');
  if (!cfg.apiKey) throw new Error('到设置 → 外部系统 填公司数智系统接入令牌');
  const qs = query ? ('?' + new URLSearchParams(query).toString()) : '';
  const headers = { Authorization: `Bearer ${cfg.apiKey}` };
  const opts = { method, headers };
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(json);
  }
  const res = await proxiedFetch(`${cfg.url}${KNOWLEDGE_PATH}${path}${qs}`, opts);
  let data = {};
  try {
    data = parseBody(res.text);
  } catch (err) {
    if (res.status >= 400) throw gatewayError(res.status, {}, res.text);
    throw err;
  }
  if (res.status >= 400) throw gatewayError(res.status, data, res.text);
  return data;
}

export async function getKnowledgeSchema(knowledgeBaseCode) {
  const code = String(knowledgeBaseCode || '').trim();
  if (!code) throw new Error('缺少知识库代码');
  return knowledgeRequest('GET', '/schema', { query: { knowledge_base_code: code } });
}

export async function prepareKnowledgeDocument({ knowledgeBaseCode, content, metadata, idempotencyKey }) {
  return knowledgeRequest('POST', '/prepare', {
    json: {
      knowledge_base_code: knowledgeBaseCode,
      content,
      metadata,
      idempotency_key: idempotencyKey,
    },
  });
}

export async function confirmKnowledgeDocument(draftId) {
  return knowledgeRequest('POST', '/confirm', { json: { draft_id: draftId } });
}

export async function revokeKnowledgeDocument(documentUid) {
  return knowledgeRequest('POST', '/revoke', { json: { document_uid: documentUid } });
}

export function schemaAllowsContribute(schema) {
  const actions = Array.isArray(schema && schema.allowed_actions) ? schema.allowed_actions : [];
  return actions.includes('contribute');
}

export function contributeDeniedMessage(type, knowledgeBaseCode) {
  const label = String(type || '').trim() || '对应';
  const code = String(knowledgeBaseCode || '').trim();
  return `你没有「${label}」知识库的归档权限。当前令牌对${code ? `「${code}」` : '该库'}只能读，不能写入。可把类型改成你能归档的库后再传，或请管理员开通归档角色。`;
}

export async function testKnowledgeGateway() {
  const cfg = resolveHtConfig();
  if (!cfg.url) return { ok: false, error: '到设置 → 外部系统 填公司数智系统地址' };
  if (!cfg.apiKey) return { ok: false, error: '到设置 → 外部系统 填公司数智系统接入令牌' };
  const writable = [];
  const readable = [];
  const failed = [];
  for (const target of KB_TARGETS) {
    try {
      const schema = await getKnowledgeSchema(target.knowledgeBaseCode);
      const name = schema.display_name || target.label || target.knowledgeBaseCode;
      if (schemaAllowsContribute(schema)) writable.push(name);
      else readable.push(name);
    } catch (err) {
      failed.push(target.label + '：' + String((err && err.message) || err));
    }
  }
  if (!writable.length && !readable.length) {
    return { ok: false, error: failed[0] || '知识库网关不通' };
  }
  const bits = [];
  if (writable.length) bits.push('可归档 ' + writable.join('、'));
  if (readable.length) bits.push('仅可读 ' + readable.join('、'));
  if (failed.length) bits.push('未通 ' + failed.join('；'));
  return {
    ok: true,
    detail: bits.join('。'),
    writable,
    readable,
    failed,
  };
}
