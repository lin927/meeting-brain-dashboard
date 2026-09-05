// 深度总结用的本地词表 + 提炼提示词加载。
//
// 提示词（版本随仓库）：server/会议记录提炼提示词.md
//   本机覆盖：~/.dsh/meetings/summarize-prompt.md（存在则优先）
// 词表：
//   仓库默认：server/glossary.default.json
//   本机增补：~/.dsh/meetings/glossary.json（按 name 覆盖默认，可加项目名/术语）

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbPath } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLED_DIR = join(__dirname, '..', 'server');
const DEFAULT_GLOSSARY_FILE = 'glossary.default.json';
const DEFAULT_PROMPT_FILE = '会议记录提炼提示词.md';

export function meetingsHome() {
  return dirname(dbPath());
}

export function glossaryUserPath() {
  return process.env.MEETING_BRAIN_GLOSSARY || join(meetingsHome(), 'glossary.json');
}

export function summarizePromptPath() {
  if (process.env.MEETING_BRAIN_SUMMARIZE_PROMPT) return process.env.MEETING_BRAIN_SUMMARIZE_PROMPT;
  const local = join(meetingsHome(), 'summarize-prompt.md');
  if (existsSync(local)) return local;
  return join(BUNDLED_DIR, DEFAULT_PROMPT_FILE);
}

function bundledGlossaryPath() {
  return join(BUNDLED_DIR, DEFAULT_GLOSSARY_FILE);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/** 统一条目：字符串 "Cesium" 或 { name, aliases }。people / projects / terms 同一套。 */
function normalizeNamedEntry(item) {
  if (typeof item === 'string') {
    const name = item.trim();
    return name ? { name, aliases: [] } : null;
  }
  if (!item || typeof item !== 'object') return null;
  const name = String(item.name || '').trim();
  if (!name) return null;
  const aliases = [];
  const push = (v) => {
    const s = String(v || '').trim();
    if (s && s.toLowerCase() !== name.toLowerCase()) aliases.push(s);
  };
  if (Array.isArray(item.aliases)) item.aliases.forEach(push);
  if (item.englishName) push(item.englishName);
  if (Array.isArray(item.also)) item.also.forEach(push);
  const seen = new Set();
  const unique = [];
  for (const a of aliases) {
    const k = a.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(a);
  }
  return { name, aliases: unique };
}

function normalizeNamedList(arr) {
  const byName = new Map();
  for (const item of arr || []) {
    const n = normalizeNamedEntry(item);
    if (!n) continue;
    byName.set(n.name, n);
  }
  return [...byName.values()];
}

function normalizeGlossary(raw) {
  return {
    people: normalizeNamedList(raw && raw.people),
    projects: normalizeNamedList(raw && raw.projects),
    terms: normalizeNamedList(raw && raw.terms),
  };
}

function mergeNamedList(base, overlay) {
  const byName = new Map();
  for (const n of base) byName.set(n.name, n);
  for (const n of overlay) byName.set(n.name, n);
  return [...byName.values()];
}

function mergeGlossary(base, overlay) {
  return {
    people: mergeNamedList(base.people, overlay.people),
    projects: mergeNamedList(base.projects, overlay.projects),
    terms: mergeNamedList(base.terms, overlay.terms),
  };
}

/** 首次把默认词表复制到本机，方便直接编辑。之后以本机文件覆盖默认。 */
function seedUserGlossary() {
  const dest = glossaryUserPath();
  if (existsSync(dest)) return;
  const src = bundledGlossaryPath();
  if (!existsSync(src)) return;
  try {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, readFileSync(src));
  } catch (e) {
    console.error('[glossary] 无法写入本机词表:', e.message);
  }
}

export function loadGlossary() {
  seedUserGlossary();
  const bundled = normalizeGlossary(readJson(bundledGlossaryPath()) || {});
  const userRaw = readJson(glossaryUserPath());
  if (!userRaw) return bundled;
  return mergeGlossary(bundled, normalizeGlossary(userRaw));
}

export function loadSummarizePrompt() {
  const path = summarizePromptPath();
  if (!existsSync(path)) {
    throw new Error(`未找到会议记录提炼提示词: ${path}`);
  }
  return readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
}

export function extractSpeakers(lines) {
  const names = [];
  const seen = new Set();
  for (const line of lines || []) {
    const m = String(line).match(/^【([^】]+)】/);
    if (!m) continue;
    const name = m[1].trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

export function parseNameList(text) {
  if (!text) return [];
  return String(text).split(/[、，,;；/|]+/).map((s) => s.trim()).filter(Boolean);
}

function aliasKey(s) {
  return String(s || '').trim().toLowerCase();
}

function buildAliasIndex(people) {
  const map = new Map();
  for (const p of people) {
    for (const a of p.aliases) {
      const k = aliasKey(a);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(p);
    }
  }
  return map;
}

/**
 * 用本场参会人 / 发言人 / 标题 / 正文，把称呼消歧成正式姓名。
 * 一对多（海哥）只有上下文能唯一确定时才落名。
 */
export function resolveGlossary({ glossary, attendees, speakers, title, actions, transcript }) {
  const g = glossary || { people: [], projects: [], terms: [] };
  const attendeeList = Array.isArray(attendees) ? attendees : parseNameList(attendees);
  const speakerList = speakers || [];
  const actionText = (actions || []).map((a) => a.title || a).join('\n');
  const blob = [title || '', attendeeList.join('、'), speakerList.join('\n'), actionText, transcript || ''].join('\n');

  const aliasIndex = buildAliasIndex(g.people);
  const shared = new Set();
  for (const [k, ps] of aliasIndex) {
    if (ps.length > 1) shared.add(k);
  }

  const determined = [];
  const ambiguous = [];
  const seenAlias = new Set();
  for (const [k, ps] of aliasIndex) {
    const alias = ps[0].aliases.find((a) => aliasKey(a) === k) || k;
    if (seenAlias.has(k)) continue;
    seenAlias.add(k);
    if (ps.length === 1) {
      determined.push({ alias, name: ps[0].name });
      continue;
    }
    const present = ps.filter((p) => blob.includes(p.name));
    if (present.length === 1) {
      determined.push({ alias, name: present[0].name, reason: '本场上下文可唯一确定' });
    } else {
      ambiguous.push({
        alias,
        candidates: ps.map((p) => p.name),
        present: present.map((p) => p.name),
      });
    }
  }

  const officialByAlias = new Map();
  for (const d of determined) officialByAlias.set(aliasKey(d.alias), d.name);
  for (const p of g.people) officialByAlias.set(aliasKey(p.name), p.name);

  const identity = [];
  const unmapped = [];
  for (const speaker of speakerList) {
    const k = aliasKey(speaker);
    if (officialByAlias.has(k)) {
      identity.push({ speaker, name: officialByAlias.get(k) });
      continue;
    }
    const hit = attendeeList.find((a) => aliasKey(a) === k);
    if (hit) {
      identity.push({ speaker, name: hit });
      continue;
    }
    unmapped.push(speaker);
  }

  return {
    people: g.people,
    projects: g.projects,
    terms: g.terms,
    determined,
    ambiguous,
    identity,
    unmapped,
    attendees: attendeeList,
    speakers: speakerList,
    sharedAliases: [...shared],
  };
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return null;
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return '不足 1 分钟';
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

/** 拼进 user 消息：身份映射、称呼对照、标准用词。不改逐字稿原文。 */
export function formatSummarizeInputs({ meeting, resolved, actions, transcript }) {
  const time = meeting.start_time ? new Date(meeting.start_time).toLocaleString('zh-CN') : '未知';
  const duration = formatDuration(meeting.duration_ms);
  const lines = [];
  lines.push('## 本场输入');
  lines.push('');
  lines.push(`- 会议主题：${meeting.title || '未命名会议'}`);
  lines.push(`- 时间：${time}`);
  if (duration) lines.push(`- 时长：${duration}`);

  const attendeeShow = [...resolved.attendees];
  for (const s of resolved.unmapped) {
    if (!attendeeShow.includes(s)) attendeeShow.push(`${s}?`);
  }
  lines.push(`- 参会人：${attendeeShow.length ? attendeeShow.join('、') : '未知'}`);
  lines.push('');

  lines.push('### 身份映射');
  if (resolved.identity.length === 0 && resolved.unmapped.length === 0) {
    lines.push('（逐字稿无说话人标签）');
  }
  for (const m of resolved.identity) {
    lines.push(`- ${m.speaker} = ${m.name}`);
  }
  for (const s of resolved.unmapped) {
    lines.push(`- ${s}：未映射，身份待确认`);
  }
  lines.push('');

  lines.push('### 内部称呼对照（已确定，总结中必须用正式姓名，禁止再写哥/总/老师/姐等称呼）');
  if (resolved.determined.length === 0) {
    lines.push('（无）');
  } else {
    for (const d of resolved.determined) {
      const extra = d.reason ? `（${d.reason}）` : '';
      lines.push(`- ${d.alias} = ${d.name}${extra}`);
    }
  }
  lines.push('');

  lines.push('### 内部称呼（无法确定：保留原称呼并列出候选，禁止二选一猜测）');
  if (resolved.ambiguous.length === 0) {
    lines.push('（无）');
  } else {
    for (const a of resolved.ambiguous) {
      lines.push(`- ${a.alias} → ${a.candidates.join(' 或 ')}`);
    }
  }
  lines.push('');

  const fmtNamed = (item) => {
    if (!item.aliases || item.aliases.length === 0) return `- ${item.name}`;
    return `- ${item.name}（口述/误识别可能是：${item.aliases.join('、')}）`;
  };
  lines.push('### 标准用词（项目名 / 术语；逐字稿中的同音、近音、中英混听请纠正为 name；不在表中的不要臆造）');
  if (resolved.projects.length === 0 && resolved.terms.length === 0) {
    lines.push('（词表暂无项目名/术语，仅按内部称呼与常识纠正明显误识别，不确定标?）');
  } else {
    if (resolved.projects.length) {
      lines.push('项目：');
      for (const p of resolved.projects) lines.push(fmtNamed(p));
    }
    if (resolved.terms.length) {
      lines.push('术语：');
      for (const t of resolved.terms) lines.push(fmtNamed(t));
    }
  }
  lines.push('');

  const acts = actions || [];
  lines.push(`### 钉钉已提取待办（${acts.length} 项，供行动项核对补充，责任人须写姓名）`);
  if (acts.length === 0) lines.push('- 无');
  else acts.forEach((a, i) => lines.push(`- ${i + 1}. ${a.title}${a.status ? `（${a.status}）` : ''}`));
  lines.push('');

  lines.push('### 会议逐字稿');
  lines.push('--------');
  lines.push(transcript);
  lines.push('--------');
  lines.push('');
  lines.push('请严格按系统提示词的输出结构（一至七）生成会议记录。人名用身份映射和称呼对照中的正式姓名。');
  return lines.join('\n');
}
