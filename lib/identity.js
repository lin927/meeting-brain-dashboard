// 数智系统身份上下文：当前令牌对应的人员，以及可写入的业务部门目录。
// 个人身份不进公共缓存。部门编号写入称呼表，上传时映射为 department_code。

import { proxiedFetch } from './ask.js';
import { loadDepartmentPrefs, loadGlossary, saveDepartmentPrefs, saveUserNamedList } from './glossary.js';
import { mergeProjectRows } from './project-csv.js';
import { resolveHtConfig } from './runtime-config.js';

export const IDENTITY_PATH = '/api/integrations/v1/identity-context';

function parseBody(text) {
  if (!text) return {};
  try { return JSON.parse(text); } catch {
    throw new Error('数智系统接口返回非 JSON');
  }
}

function missingConfig() {
  const cfg = resolveHtConfig();
  if (!cfg.url) return '到设置 → 外部系统 填公司数智系统地址';
  if (!cfg.apiKey) return '到设置 → 外部系统 填公司数智系统接入令牌';
  return '';
}

export function mapBusinessDepartment(item) {
  const name = String((item && item.department_name) || '').trim();
  const code = String((item && item.department_id) || '').trim();
  if (!name || !code) return null;
  if (item && item.business_enabled === false) return null;
  return { name, code, aliases: [], synced: true };
}

export async function fetchIdentityContext() {
  const missing = missingConfig();
  if (missing) return { configured: false, error: missing };
  const cfg = resolveHtConfig();
  const res = await proxiedFetch(`${cfg.url}${IDENTITY_PATH}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  });
  const data = parseBody(res.text);
  if (res.status >= 400) {
    let msg = (data && (data.message || data.error || data.detail)) || String(res.text || '').slice(0, 200);
    if (data && data.code === 'scope_denied') msg = '令牌需要勾选「读取本人身份与业务部门」';
    return { configured: true, error: `数智系统 ${res.status}: ${msg || '请求失败'}` };
  }
  const subject = (data && data.subject) || {};
  const raw = Array.isArray(data.business_departments) ? data.business_departments : [];
  const departments = raw.map(mapBusinessDepartment).filter(Boolean);
  const codes = new Set(departments.map((d) => d.code));
  const memberIds = [];
  for (const item of Array.isArray(subject.departments) ? subject.departments : []) {
    if (item && item.business_enabled === false) continue;
    const id = String((item && item.department_id) || '').trim();
    if (!id || !codes.has(id) || memberIds.includes(id)) continue;
    memberIds.push(id);
  }
  const primaryId = String(subject.primary_department_id || '').trim();
  return {
    ok: true,
    configured: true,
    name: String(subject.name || '').trim(),
    userid: String(subject.userid || '').trim(),
    departments,
    memberIds,
    primaryDepartmentId: codes.has(primaryId) ? primaryId : '',
    catalogUpdatedAt: (data && data.catalog_updated_at) || '',
  };
}

export async function identityForBanner() {
  const r = await fetchIdentityContext();
  if (!r.configured) return { configured: false, name: '' };
  if (r.error) return { configured: true, name: '', error: r.error };
  return { configured: true, name: r.name || '' };
}

export async function syncDepartmentsFromIdentity() {
  const r = await fetchIdentityContext();
  if (r.error || !r.configured) return r;
  const g = loadGlossary();
  const stored = loadDepartmentPrefs();
  const merged = mergeProjectRows(g.departments || [], r.departments || []);
  saveUserNamedList('departments', merged.projects, { fromSync: true });
  const primaryId = stored.primaryTouched ? stored.primaryId : (r.primaryDepartmentId || '');
  saveDepartmentPrefs({
    primaryId,
    primaryTouched: stored.primaryTouched || !!primaryId,
    pinnedIds: stored.pinnedIds,
    memberIds: r.memberIds || [],
  });
  return {
    ok: true,
    name: r.name || '',
    added: merged.added,
    updated: merged.updated,
    skipped: merged.skipped,
    total: merged.projects.length,
    matched: (r.departments || []).length,
    primaryId,
  };
}
