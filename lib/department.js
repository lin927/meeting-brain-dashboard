// 部门会议的主部门：本机一等字段。编号是身份接口的 department_id，
// 上传知识库时写成 department_code，名称写成 department_name_snapshot。

import { parseTags } from './db.js';
import { loadGlossary } from './glossary.js';
import { normalizeType } from './meeting-type.js';

const MIN_NEEDLE = 3;

function fold(s) {
  return String(s || '').trim().toLowerCase();
}

function needleOk(s) {
  return [...String(s || '').trim()].length >= MIN_NEEDLE;
}

export function findDepartment(glossary, needle) {
  const n = fold(needle);
  if (!n) return null;
  for (const d of (glossary && glossary.departments) || []) {
    if (fold(d.name) === n) return d;
    if (d.code && fold(d.code) === n) return d;
    if ((d.aliases || []).some((a) => fold(a) === n)) return d;
  }
  return null;
}

/** 主部门、常用（按用户顺序）、所属的其他部门，其余按名称。 */
export function orderDepartments(list) {
  const rows = (list || []).filter((d) => d && String(d.name || '').trim());
  const rank = (d) => {
    if (d.primary) return [0, 0];
    if (Number.isInteger(d.pin)) return [1, d.pin];
    if (d.member) return [2, 0];
    return [3, 0];
  };
  return rows.slice().sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra[0] !== rb[0]) return ra[0] - rb[0];
    if (ra[1] !== rb[1]) return ra[1] - rb[1];
    return String(a.name).localeCompare(String(b.name), 'zh');
  });
}

export function departmentChoices(glossary) {
  return orderDepartments(glossary && glossary.departments)
    .map((d) => ({
      name: d.name,
      code: d.code || '',
      primary: !!d.primary,
      member: !!d.member,
    }))
    .filter((d) => d.name);
}

function emptyDepartment() {
  return { name: '', code: '', aliases: [] };
}

function fromEntry(d, fallbackName = '', fallbackCode = '') {
  if (!d && !fallbackName) return emptyDepartment();
  return {
    name: (d && d.name) || fallbackName,
    code: (d && d.code) || fallbackCode || '',
    aliases: (d && d.aliases) || [],
  };
}

function fromTags(tags, glossary) {
  for (const t of tags || []) {
    const hit = findDepartment(glossary, t);
    if (hit) return fromEntry(hit);
  }
  return emptyDepartment();
}

/** 标题、记录里命中称呼表部门。按名称长短优先，避免「市场营销部」盖住「市场营销一部」。 */
export function matchDepartmentInText(text, glossary) {
  const hay = fold(text);
  if (!hay) return emptyDepartment();
  const pairs = [];
  for (const d of (glossary && glossary.departments) || []) {
    const needles = [d.name, ...(d.aliases || [])].filter(needleOk);
    for (const n of needles) pairs.push({ d, n });
  }
  pairs.sort((a, b) => [...b.n].length - [...a.n].length);
  for (const { d, n } of pairs) {
    if (hay.includes(fold(n))) return fromEntry(d);
  }
  return emptyDepartment();
}

/** 已存字段优先；没有则用标签、标题对称呼表推断。 */
export function resolveMeetingDepartment(meeting, glossary) {
  const g = glossary || loadGlossary();
  const stored = String(meeting && meeting.department_name || '').trim();
  const storedCode = String(meeting && meeting.department_id || '').trim();
  if (stored) {
    const hit = findDepartment(g, stored);
    return {
      name: hit ? hit.name : stored,
      code: storedCode || (hit && hit.code) || '',
      aliases: (hit && hit.aliases) || [],
    };
  }
  if (normalizeType(meeting && meeting.scope) !== '部门') return emptyDepartment();
  const tagged = fromTags(parseTags(meeting && meeting.tags_json), g);
  if (tagged.name) return tagged;
  return matchDepartmentInText([meeting && meeting.title, meeting && meeting.summary].filter(Boolean).join('\n'), g);
}

export function departmentFromHit(hit, glossary) {
  const g = glossary || loadGlossary();
  if (hit && hit.department) {
    const found = findDepartment(g, hit.department);
    return fromEntry(found, String(hit.department).trim(), hit.departmentId || '');
  }
  return fromTags(hit && hit.tags, g);
}

/** PATCH 会议时写入的部门字段。非部门类型会清空。 */
export function departmentPatch(body, nextType, glossary) {
  const typeInBody = body && (body.type !== undefined || body.scope !== undefined);
  const hasName = body && body.departmentName !== undefined;
  const hasCode = body && body.departmentId !== undefined;
  if (nextType !== '部门') {
    if (typeInBody || hasName || hasCode) return { department_name: '', department_id: '' };
    return {};
  }
  if (!hasName && !hasCode) return {};
  const name = hasName ? String(body.departmentName || '').trim() : '';
  if (hasName && !name) return { department_name: '', department_id: '' };
  const hit = name ? findDepartment(glossary || loadGlossary(), name) : null;
  const out = {};
  if (hasName) out.department_name = hit ? hit.name : name;
  if (hasCode) out.department_id = String(body.departmentId || '').trim();
  else if (hasName) out.department_id = (hit && hit.code) || '';
  return out;
}
