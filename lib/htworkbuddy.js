// 工时 HTWorkbuddy：检索或全量同步当前人可见的项目参考，合并进本机称呼表。
// 地址和令牌来自本机设置，不进仓库。带 q 为搜索；不带 q 按编号游标翻页全量同步。

import { proxiedFetch } from './ask.js';
import { loadGlossary, saveUserNamedList } from './glossary.js';
import { mergeProjectRows } from './project-csv.js';
import { resolveHtConfig } from './runtime-config.js';

export const PROJECT_REF_PATH = '/api/integrations/v1/project-references';
const MIN_Q = 2;
const SEARCH_LIMIT = 20;
const SYNC_LIMIT = 200;
const MAX_SYNC_PAGES = 50;

function parseBody(text) {
  if (!text) return {};
  try { return JSON.parse(text); } catch {
    throw new Error('数智系统接口返回非 JSON');
  }
}

export function mapProjectRef(item) {
  const name = String((item && (item.project_name || item.name)) || '').trim();
  const code = String((item && (item.project_code || item.code)) || '').trim();
  if (!name) return null;
  return code ? { name, code, aliases: [] } : { name, aliases: [] };
}

async function fetchProjectPage({ q = '', cursor = '', limit } = {}) {
  const cfg = resolveHtConfig();
  if (!cfg.url) return { configured: false, error: '到设置 → 外部系统 填公司数智系统地址' };
  if (!cfg.apiKey) return { configured: false, error: '到设置 → 外部系统 填公司数智系统接入令牌' };
  const query = String(q || '').trim();
  const after = String(cursor || '').trim();
  const params = new URLSearchParams();
  if (query) {
    if ([...query].length < MIN_Q) return { error: '关键词至少两个字' };
    params.set('q', query);
    params.set('limit', String(Math.min(SEARCH_LIMIT, Math.max(1, Number(limit) || SEARCH_LIMIT))));
  } else {
    params.set('limit', String(Math.min(SYNC_LIMIT, Math.max(1, Number(limit) || SYNC_LIMIT))));
    if (after) params.set('cursor', after);
  }
  const url = `${cfg.url}${PROJECT_REF_PATH}?${params.toString()}`;
  const res = await proxiedFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  });
  const data = parseBody(res.text);
  if (res.status >= 400) {
    const msg = (data && (data.message || data.error || data.detail)) || res.text.slice(0, 200);
    return { error: `数智系统 ${res.status}: ${msg || '请求失败'}` };
  }
  const raw = Array.isArray(data.items) ? data.items : [];
  const items = raw.map(mapProjectRef).filter(Boolean);
  const next = data.next_cursor == null || data.next_cursor === '' ? null : String(data.next_cursor);
  return {
    ok: true,
    configured: true,
    caller: data.caller || null,
    items,
    count: data.count != null ? Number(data.count) : items.length,
    next_cursor: next,
  };
}

export async function searchProjectReferences(q, limit = SEARCH_LIMIT) {
  return fetchProjectPage({ q, limit });
}

export async function listAllProjectReferences() {
  const first = await fetchProjectPage({ limit: SYNC_LIMIT });
  if (first.error || first.configured === false) return first;
  const items = [...(first.items || [])];
  let cursor = first.next_cursor;
  let pages = 1;
  while (cursor) {
    if (pages >= MAX_SYNC_PAGES) {
      return { error: `可见项目超过 ${MAX_SYNC_PAGES * SYNC_LIMIT} 条，同步中止` };
    }
    const page = await fetchProjectPage({ cursor, limit: SYNC_LIMIT });
    if (page.error) return page;
    items.push(...(page.items || []));
    cursor = page.next_cursor;
    pages += 1;
  }
  return {
    ok: true,
    configured: true,
    caller: first.caller || null,
    items,
    count: items.length,
    pages,
  };
}

export async function testHtworkbuddy() {
  const r = await fetchProjectPage({ limit: 5 });
  if (r.error) return { ok: false, error: r.error };
  const who = (r.caller && (r.caller.name || r.caller.userid)) || '';
  return {
    ok: true,
    caller: who,
    count: r.count,
    names: (r.items || []).slice(0, 5).map((p) => p.name),
  };
}

export function persistProjectRows(incoming) {
  const g = loadGlossary();
  const merged = mergeProjectRows(g.projects || [], incoming || []);
  saveUserNamedList('projects', merged.projects);
  return {
    ok: true,
    added: merged.added,
    updated: merged.updated,
    skipped: merged.skipped,
    total: merged.projects.length,
  };
}

export async function syncProjectsFromQuery(q) {
  const r = await searchProjectReferences(q);
  if (r.error) return r;
  const saved = persistProjectRows(r.items);
  return { ...saved, caller: r.caller, matched: (r.items || []).length };
}

export async function syncAllProjects() {
  const r = await listAllProjectReferences();
  if (r.error) return r;
  const saved = persistProjectRows(r.items);
  return { ...saved, caller: r.caller, matched: (r.items || []).length, pages: r.pages };
}

export function syncProjectsFromItems(rows) {
  const incoming = (rows || []).map(mapProjectRef).filter(Boolean);
  if (!incoming.length) return { error: '没有可写入的项目' };
  return persistProjectRows(incoming);
}
