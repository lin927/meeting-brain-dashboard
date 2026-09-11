// 项目会议的主项目：本机一等字段，上传时写入正文和 RAGFlow 元数据。
// 编号挂在称呼表项目上，可选；一场会只认一个主项目。

import { parseTags } from './db.js';
import { loadGlossary } from './glossary.js';
import { normalizeType } from './meeting-type.js';

function fold(s) {
  return String(s || '').trim().toLowerCase();
}

export function findProject(glossary, needle) {
  const n = fold(needle);
  if (!n) return null;
  for (const p of (glossary && glossary.projects) || []) {
    if (fold(p.name) === n) return p;
    if (p.code && fold(p.code) === n) return p;
    if ((p.aliases || []).some((a) => fold(a) === n)) return p;
  }
  return null;
}

export function projectChoices(glossary) {
  return ((glossary && glossary.projects) || [])
    .map((p) => ({ name: p.name, code: p.code || '' }))
    .filter((p) => p.name);
}

function emptyProject() {
  return { name: '', code: '', aliases: [] };
}

function fromEntry(p, fallbackName = '') {
  if (!p && !fallbackName) return emptyProject();
  return {
    name: (p && p.name) || fallbackName,
    code: (p && p.code) || '',
    aliases: (p && p.aliases) || [],
  };
}

function fromTags(tags, glossary) {
  for (const t of tags || []) {
    const hit = findProject(glossary, t);
    if (hit) return fromEntry(hit);
  }
  return emptyProject();
}

function fromText(meeting, glossary) {
  const blob = [meeting && meeting.title, meeting && meeting.summary].filter(Boolean).join('\n');
  if (!blob) return emptyProject();
  const hay = fold(blob);
  for (const p of (glossary && glossary.projects) || []) {
    const needles = [p.name, ...(p.aliases || []), p.code].filter(Boolean);
    if (needles.some((n) => hay.includes(fold(n)))) return fromEntry(p);
  }
  return emptyProject();
}

/** 已存字段优先；没有则用标签、标题对称呼表推断。 */
export function resolveMeetingProject(meeting, glossary) {
  const g = glossary || loadGlossary();
  const stored = String(meeting && meeting.project_name || '').trim();
  const storedCode = String(meeting && meeting.project_code || '').trim();
  if (stored) {
    const hit = findProject(g, stored);
    return {
      name: hit ? hit.name : stored,
      code: storedCode || (hit && hit.code) || '',
      aliases: (hit && hit.aliases) || [],
    };
  }
  if (normalizeType(meeting && meeting.scope) !== '项目') return emptyProject();
  const tagged = fromTags(parseTags(meeting && meeting.tags_json), g);
  if (tagged.name) return tagged;
  return fromText(meeting, g);
}

export function projectFromHit(hit, glossary) {
  const g = glossary || loadGlossary();
  if (hit && hit.project) {
    const found = findProject(g, hit.project);
    return fromEntry(found, String(hit.project).trim());
  }
  return fromTags(hit && hit.tags, g);
}

/** PATCH 会议时写入的项目字段。非项目类型会清空。 */
export function projectPatch(body, nextType, glossary) {
  const typeInBody = body && (body.type !== undefined || body.scope !== undefined);
  const hasName = body && (body.projectName !== undefined || body.project !== undefined);
  const hasCode = body && body.projectCode !== undefined;
  if (nextType !== '项目') {
    if (typeInBody || hasName || hasCode) return { project_name: '', project_code: '' };
    return {};
  }
  if (!hasName && !hasCode) return {};
  const rawName = hasName ? (body.projectName !== undefined ? body.projectName : body.project) : '';
  const name = String(rawName || '').trim();
  if (hasName && !name) return { project_name: '', project_code: '' };
  const hit = name ? findProject(glossary || loadGlossary(), name) : null;
  const out = {};
  if (hasName) out.project_name = hit ? hit.name : name;
  if (hasCode) out.project_code = String(body.projectCode || '').trim();
  else if (hasName) out.project_code = (hit && hit.code) || '';
  return out;
}
