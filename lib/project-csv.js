// 从项目清单 CSV 导入称呼表项目（编号 + 名称）。
// 表头需含「项目编号」「项目名称」，其余列忽略。按编号、名称去重。

import { loadGlossary, saveUserNamedList } from './glossary.js';

function fold(s) {
  return String(s || '').trim().toLowerCase();
}

function parseCsvText(text) {
  const s = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
        continue;
      }
      cell += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (c === '\r') continue;
    cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => String(x).trim()));
}

function colIndex(headers, names) {
  const hs = (headers || []).map((h) => String(h || '').trim());
  for (const n of names) {
    const i = hs.findIndex((h) => h === n);
    if (i >= 0) return i;
  }
  return -1;
}

function uniqueAliases(list, also) {
  const seen = new Set();
  const out = [];
  for (const a of [...(list || []), ...(also || [])]) {
    const s = String(a || '').trim();
    if (!s) continue;
    const k = fold(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function asRow(p) {
  const name = String(p && p.name || '').trim();
  if (!name) return null;
  const aliases = Array.isArray(p.aliases)
    ? p.aliases
    : String(p.aliases || '').split(/[、，,;；/|]+/).map((s) => s.trim()).filter(Boolean);
  const code = String(p && p.code || '').trim();
  return code ? { name, aliases: uniqueAliases(aliases), code } : { name, aliases: uniqueAliases(aliases) };
}

export function parseProjectCsv(text) {
  const table = parseCsvText(text);
  if (!table.length) return { error: 'CSV 是空的' };
  const headers = table[0];
  const codeI = colIndex(headers, ['项目编号']);
  const nameI = colIndex(headers, ['项目名称']);
  if (nameI < 0 || codeI < 0) {
    return { error: '表头需要「项目编号」和「项目名称」，请用模板' };
  }
  const incoming = [];
  const seenCode = new Set();
  const seenName = new Set();
  let skipped = 0;
  for (const row of table.slice(1)) {
    const name = String((row && row[nameI]) || '').trim();
    const code = String((row && row[codeI]) || '').trim();
    if (!name) {
      skipped += 1;
      continue;
    }
    const nk = fold(name);
    const ck = fold(code);
    if (ck && seenCode.has(ck)) {
      skipped += 1;
      continue;
    }
    if (seenName.has(nk)) {
      skipped += 1;
      continue;
    }
    if (ck) seenCode.add(ck);
    seenName.add(nk);
    incoming.push(code ? { name, code, aliases: [] } : { name, aliases: [] });
  }
  if (!incoming.length) return { error: '没有读到项目名称', skipped };
  return { incoming, skipped };
}

function findExisting(list, row) {
  const ck = fold(row.code);
  const nk = fold(row.name);
  if (ck) {
    const i = list.findIndex((p) => fold(p.code) === ck);
    if (i >= 0) return i;
  }
  return list.findIndex((p) => fold(p.name) === nk);
}

export function mergeProjectRows(existing, incoming) {
  const out = [];
  for (const p of existing || []) {
    const row = asRow(p);
    if (row) out.push(row);
  }
  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const row of incoming || []) {
    const i = findExisting(out, row);
    if (i < 0) {
      out.push(asRow(row));
      added += 1;
      continue;
    }
    const prev = out[i];
    const nextCode = row.code || prev.code || '';
    const nextName = row.name || prev.name;
    const extra = [];
    if (fold(prev.name) !== fold(nextName)) extra.push(prev.name);
    const aliases = uniqueAliases(prev.aliases, extra).filter((a) => fold(a) !== fold(nextName));
    const same = fold(prev.name) === fold(nextName) && fold(prev.code) === fold(nextCode);
    out[i] = nextCode ? { name: nextName, aliases, code: nextCode } : { name: nextName, aliases };
    if (same && aliases.length === (prev.aliases || []).length) skipped += 1;
    else updated += 1;
  }
  return { projects: out.filter(Boolean), added, updated, skipped };
}

export function importProjectsFromCsv(csvText) {
  const parsed = parseProjectCsv(csvText);
  if (parsed.error) return parsed;
  const g = loadGlossary();
  const merged = mergeProjectRows(g.projects || [], parsed.incoming);
  saveUserNamedList('projects', merged.projects);
  return {
    ok: true,
    added: merged.added,
    updated: merged.updated,
    skipped: (parsed.skipped || 0) + merged.skipped,
    total: merged.projects.length,
  };
}
