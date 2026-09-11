// 按本机规则给会议填类型（及可选标签）。
// 新拉进来的未定场次自动套；已有场次只在用户点「按规则填写/重算」时改。
// 手改过类型的不覆盖。词表项目名命中可作为兜底。

import { randomUUID } from 'node:crypto';
import { open, getMeeting, getMeta, setMeta, updateMeetingFields, parseTags } from './db.js';
import { loadGlossary } from './glossary.js';
import { MEETING_TYPES, normalizeType } from './meeting-type.js';

const META_KEY = 'classify_rules_json';

export function splitTerms(v) {
  return String(v || '').split(/[、，,;；/|]+/).map((s) => s.trim()).filter(Boolean);
}

function fold(s) {
  return String(s || '').toLowerCase();
}

function includesTerm(hay, term) {
  const t = String(term || '').trim();
  if (!t) return false;
  return fold(hay).includes(fold(t));
}

function unique(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const s = String(x || '').trim();
    if (!s) continue;
    const k = fold(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function normalizeRule(raw, i = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const type = normalizeType(raw.type);
  if (!type || !MEETING_TYPES.includes(type)) return null;
  const title = splitTerms(raw.title);
  const people = splitTerms(raw.people);
  const record = splitTerms(raw.record);
  const tags = splitTerms(raw.tags);
  if (!title.length && !people.length && !record.length) return null;
  return {
    id: String(raw.id || ('r-' + randomUUID())).slice(0, 64),
    type,
    title: title.join('、'),
    people: people.join('、'),
    record: record.join('、'),
    tags: tags.join('、'),
    _title: title,
    _people: people,
    _record: record,
    _tags: tags,
    _i: i,
  };
}

export function loadClassifyConfig(db) {
  const owned = db || open();
  let raw = {};
  try { raw = JSON.parse(getMeta(owned, META_KEY) || '{}') || {}; } catch { raw = {}; }
  const rules = [];
  const src = Array.isArray(raw.rules) ? raw.rules : [];
  for (let i = 0; i < src.length; i++) {
    const r = normalizeRule(src[i], i);
    if (r) rules.push(r);
  }
  return {
    projectFromGlossary: raw.projectFromGlossary !== false,
    rules,
  };
}

export function classifyPublicView(cfg) {
  return {
    projectFromGlossary: !!cfg.projectFromGlossary,
    rules: (cfg.rules || []).map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title || '',
      people: r.people || '',
      record: r.record || '',
      tags: r.tags || '',
    })),
  };
}

export function saveClassifyConfig(db, body) {
  const rules = [];
  const src = Array.isArray(body && body.rules) ? body.rules : [];
  for (let i = 0; i < src.length; i++) {
    const r = normalizeRule(src[i], i);
    if (r) {
      rules.push({
        id: r.id,
        type: r.type,
        title: r.title,
        people: r.people,
        record: r.record,
        tags: r.tags,
      });
    }
  }
  const next = {
    projectFromGlossary: body && body.projectFromGlossary === false ? false : true,
    rules,
  };
  setMeta(db, META_KEY, JSON.stringify(next));
  return loadClassifyConfig(db);
}

function personNeedles(name, glossary) {
  const n = String(name || '').trim();
  if (!n) return [];
  const out = [n];
  for (const p of (glossary && glossary.people) || []) {
    const names = [p.name, ...(p.aliases || [])];
    if (names.some((x) => fold(x) === fold(n))) {
      for (const x of names) if (x) out.push(x);
    }
  }
  return unique(out);
}

function hasPerson(hay, name, glossary) {
  return personNeedles(name, glossary).some((n) => includesTerm(hay, n));
}

function ruleMatches(rule, ctx, glossary) {
  if (rule._title.length && !rule._title.some((t) => includesTerm(ctx.title, t))) return false;
  if (rule._people.length && !rule._people.every((p) => hasPerson(ctx.people, p, glossary))) return false;
  if (rule._record.length && !rule._record.some((t) => includesTerm(ctx.record, t))) return false;
  return true;
}

function meetingContext(m) {
  const title = String(m.title || '');
  const attendees = String(m.attendees || '');
  let keywords = '';
  try {
    const k = m.keywords_json ? JSON.parse(m.keywords_json) : null;
    if (Array.isArray(k)) keywords = k.join(' ');
    else if (typeof k === 'string') keywords = k;
  } catch { /* ignore */ }
  return {
    title,
    people: title + '\n' + attendees,
    record: String(m.summary || '') + '\n' + keywords,
  };
}

function matchGlossaryProject(ctx, glossary) {
  for (const p of (glossary && glossary.projects) || []) {
    const needles = unique([p.name, ...(p.aliases || [])]);
    if (needles.some((n) => includesTerm(ctx.title, n) || includesTerm(ctx.record, n))) {
      return { type: '项目', tags: [p.name], via: 'glossary:' + p.name };
    }
  }
  return null;
}

export function matchMeeting(m, cfg, glossary) {
  const ctx = meetingContext(m);
  const g = glossary || loadGlossary();
  for (const rule of cfg.rules || []) {
    if (ruleMatches(rule, ctx, g)) {
      return { type: rule.type, tags: rule._tags || splitTerms(rule.tags), via: 'rule:' + rule.id };
    }
  }
  if (cfg.projectFromGlossary) return matchGlossaryProject(ctx, g);
  return null;
}

function mergeTags(existing, extra) {
  return unique([...(existing || []), ...(extra || [])]);
}

/**
 * onlyEmpty: 只填未定（新同步）。
 * force: 连手改过的也盖（不用）。
 * 默认：未定或先前由规则填的可改，手改过的跳过。
 */
export function applyClassify(db, taskUuid, { onlyEmpty = false, force = false } = {}) {
  const m = getMeeting(db, taskUuid);
  if (!m) return null;
  const source = m.scope_source || '';
  const cur = normalizeType(m.scope);
  // 未定可填；先前由规则填的可重算；手改过的（含加这个功能前已有类型的）不覆盖。
  if (!force && source === 'user') return { skipped: 'user', taskUuid };
  if (!force && cur && source !== 'rule') return { skipped: 'user', taskUuid };
  if (onlyEmpty && cur) return { skipped: 'has-type', taskUuid };
  const cfg = loadClassifyConfig(db);
  const hit = matchMeeting(m, cfg, loadGlossary());
  if (!hit) return { skipped: 'no-match', taskUuid };
  const tags = mergeTags(parseTags(m.tags_json), hit.tags);
  updateMeetingFields(db, taskUuid, {
    scope: hit.type,
    tags_json: JSON.stringify(tags),
    scope_source: 'rule',
  });
  return { ok: true, taskUuid, title: m.title, type: hit.type, tags, via: hit.via };
}

export function classifyNewMeeting(db, taskUuid) {
  return applyClassify(db, taskUuid, { onlyEmpty: true });
}

export function classifyExisting(db, { id = '', all = false } = {}) {
  if (id) {
    const r = applyClassify(db, id, { onlyEmpty: false });
    return { updated: r && r.ok ? 1 : 0, items: r && r.ok ? [r] : [], skipped: r && !r.ok ? [r] : [] };
  }
  if (!all) return { updated: 0, items: [] };
  const rows = db.prepare(`SELECT task_uuid FROM meetings`).all();
  const items = [];
  const skipped = [];
  for (const row of rows) {
    const r = applyClassify(db, row.task_uuid, { onlyEmpty: false });
    if (r && r.ok) items.push(r);
    else if (r) skipped.push(r);
  }
  return { updated: items.length, items, skipped };
}
