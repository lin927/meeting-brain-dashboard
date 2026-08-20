// DeepSeek RAG 问答：本地语义检索命中会议块 -> 把命中内容作为上下文交给 DeepSeek 生成答案。
// 数据不出本机，只有命中文本与问题发往云端模型。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { semanticSearch } from './embed.js';
import { open, listActions, getMeeting } from './db.js';
import { todosByRange } from './overview.js';

function getApiKey() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  try {
    const y = readFileSync(join(homedir(), '.dsh', '.credentials.yaml'), 'utf8');
    const m = y.match(/DEEPSEEK_API_KEY:\s*(\S+)/);
    if (m) return m[1];
  } catch {}
  throw new Error('未找到 DEEPSEEK_API_KEY');
}

const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function callDeepSeek(messages, { maxTokens = 1200 } = {}) {
  const key = getApiKey();
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DeepSeek API ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// 把会议待办整理成上下文供 DeepSeek 参考
function buildActionsContext(db, hitTaskUuids) {
  const lines = [];
  for (const uuid of hitTaskUuids) {
    const m = getMeeting(db, uuid);
    if (!m) continue;
    const actions = listActions(db, uuid);
    if (actions.length === 0) continue;
    lines.push(`## 会议「${m.title}」的待办：`);
    actions.forEach((a, i) => lines.push(`  ${i + 1}. ${a.title}（状态:${a.status}${a.owner ? `,负责人:${a.owner}` : ''}）`));
  }
  return lines.join('\n');
}

// 识别问题中的时间范围词，返回对应的 range 值；无时间词返回 null
function detectTimeRange(query) {
  if (/今天|今日/.test(query)) return 'today';
  if (/昨天|昨日/.test(query)) return 'yesterday';
  if (/本周|这周|这一周/.test(query)) return 'thisWeek';
  const m = query.match(/近\s*(\d+)\s*天/);
  if (m) return `lastNdays:${m[1]}`;
  return null;
}

// 归一化答案中的出处引用：把 DeepSeek 写的各种占位符（会议ID缩写/带后缀）替换成完整会议标题，
// 这样前端 linkMap 能按标题精确匹配成可点击链接。
function normalizeCitations(answer, enriched) {
  if (!answer || !enriched || enriched.length === 0) return answer;
  let out = answer;
  // 1. 会议uuid前缀（如 [会议76327569…]、[763275696434…，summary]）→ 完整标题
  for (const h of enriched) {
    const prefix = h.taskUuid.slice(0, 8);
    // [会议76327569…] 或 [76327569…] 或带后缀 [会议76327569…，summary]
    const re = new RegExp(`\\[\\s*(?:会议\\s*)?${prefix}[^\\]]*\\]`, 'g');
    out = out.replace(re, `[${h.title}]`);
  }
  // 2. 兜底：任何 [会议xxx…] 形式的残留（长度>6 的），如果 hits 里有 uuid 前缀匹配则替换
  return out;
}

export async function ask({ query, dbPath, topK = 5, threshold = 0, model, dtype, maxTokens } = {}) {
  // 只要问题含时间词（今天/昨天/本周/近N天等），就走结构化查询：
  // 把该时间范围内的会议（标题/时间/摘要/待办）作为上下文，避免语义检索答出历史会议。
  const timeRange = detectTimeRange(query);
  if (timeRange) {
    const data = todosByRange(timeRange);
    if (data.meetings.length > 0) {
      const lines = [];
      for (const m of data.meetings) {
        lines.push(`## 会议「${m.title}」（${new Date(m.time).toLocaleString('zh-CN')}）`);
        if (m.summary) {
          const brief = m.summary.replace(/!\[.*?\]\(.*?\)/g, '').replace(/<img.*?>/g, '').slice(0, 400);
          lines.push(brief);
        }
        if (m.actions.length > 0) {
          lines.push('待办：');
          m.actions.forEach((a, i) => lines.push(`  ${i + 1}. ${a.title}（状态:${a.status}）`));
        }
      }
      const system = [
        '你是公司"会议智能中枢"的助手。下面是某时间范围内的真实会议记录（含摘要与待办），请仅基于这些内容回答。',
        '回答要点：优先整理【决策】【共识】【待办】；回答须与该时间范围内的会议相关，不得引用范围外内容。',
        '引用标注：每条结论/待办后紧跟 [会议标题] 标注其出处，如：完成XX（[08-19 光伏项目分阶段建设表调整]）。',
      ].join('\n');
      const user = [
        `问题：${query}`,
        '',
        `【${data.label}（${new Date(data.start).toLocaleDateString('zh-CN')} ~ ${new Date(data.end - 1).toLocaleDateString('zh-CN')}）的会议记录】`,
        lines.join('\n\n'),
        '请回答上述问题。',
      ].join('\n');
      const answer = await callDeepSeek(
        [{ role: 'system', content: system }, { role: 'user', content: user }],
        { maxTokens },
      );
      // 结构化路径：把该时间范围内的会议作为 hits 返回（供前端把 [会议标题] 渲染成可点击链接）
      const rangeHits = data.meetings.map((m) => ({
        taskUuid: m.taskUuid,
        title: m.title,
        kind: 'meeting',
        similarity: 1,
      }));
      return { answer, hits: rangeHits, structured: true };
    }
  }

  // 1. 本地语义检索
  const hits = await semanticSearch({ dbPath, query, topK, threshold, model, dtype });

  // 给每个命中会议分配编号（去重），供 DeepSeek 用 [N] 精确引用
  const db0 = open(dbPath);
  const seenUuids = new Set();
  const numbered = [];
  for (const h of hits) {
    if (seenUuids.has(h.task_uuid)) continue;
    seenUuids.add(h.task_uuid);
    const m = getMeeting(db0, h.task_uuid);
    numbered.push({
      taskUuid: h.task_uuid,
      title: m ? m.title : '未知会议',
      kind: h.kind,
      similarity: h.similarity,
      chunk: h.chunk_text,
      idx: numbered.length + 1,
    });
  }
  db0.close();

  const contextParts = [];
  for (const n of numbered) {
    contextParts.push(`【${n.idx}| ${n.kind} · ${n.title}】\n${n.chunk}`);
  }

  const hitUuids = new Set(numbered.map((n) => n.taskUuid));
  const db = open(dbPath);
  const actionsCtx = buildActionsContext(db, hitUuids);
  db.close();
  if (actionsCtx) contextParts.push(actionsCtx);

  if (contextParts.length === 0) {
    return { answer: '本地没有检索到相关会议内容，请换一个问法。', hits: [] };
  }

  const system = [
    '你是公司"会议智能中枢"的助手。你会收到带编号的检索片段，请基于这些内容回答。',
    '回答要点：优先给出【决策】【共识】【待办】等结构化结论；若检索内容不足以回答，明确说明缺口。',
    '引用标注：每条结论/要点后用 [编号] 标注其出处，编号必须来自片段开头【N| …】中的数字，如：完成XX（[1]）。',
  ].join('\n');

  const user = [
    `问题：${query}`,
    '',
    '以下是命中的会议内容：',
    '--------',
    contextParts.join('\n\n'),
    '--------',
    '请回答上述问题。',
  ].join('\n');

  const answer = await callDeepSeek(
    [{ role: 'system', content: system }, { role: 'user', content: user }],
    { maxTokens },
  );

  // 把答案中的 [N] 编号引用替换为完整会议标题（精确映射，不受 uuid 前缀/标题拼写影响）
  let finalAnswer = answer;
  for (const n of numbered) {
    finalAnswer = finalAnswer.replace(new RegExp(`\\[${n.idx}\\]`, 'g'), `[${n.title}]`);
  }
  // 兜底：残留的 [会议uuid前缀…] 用完整 uuid 精确匹配替换
  for (const n of numbered) {
    const re = new RegExp(`\\[\\s*(?:会议\\s*)?${n.taskUuid}[^\\]]*\\]`, 'g');
    finalAnswer = finalAnswer.replace(re, `[${n.title}]`);
  }

  const enriched = numbered.map((n) => ({
    taskUuid: n.taskUuid,
    title: n.title,
    kind: n.kind,
    similarity: n.similarity,
  }));

  return { answer: finalAnswer, hits: enriched };
}

// 基于某场会议的完整逐字稿 + 大模型，生成一次结构化总结（决策/共识/待办/要点）。
export async function summarizeTranscript({ taskUuid, maxTokens = 3000 } = {}) {
  const db = open();
  const m = getMeeting(db, taskUuid);
  if (!m) { db.close(); return { error: '未找到会议' }; }
  const paras = db.prepare(`SELECT chunk_text FROM chunks WHERE task_uuid=? AND kind='transcript' ORDER BY id`).all(taskUuid);
  const acts = db.prepare(`SELECT title,status FROM actions WHERE task_uuid=?`).all(taskUuid);
  db.close();

  // 清洗逐字稿：过滤纯语气词/无意义段落，拼接为文本
  const noiseRe = /^(【[^】]*】)?\s*(嗯|啊|哦|噢|呃|喂|哈|哎|唉|hmm|hm|um|uh|对|是|好|行|ok|okay|yes|no|嗯嗯|啊啊|好好|对对|是是|谢谢|不|没有)[。，！？\s,.!?]*$/i;
  const meaningful = paras
    .map((p) => p.chunk_text)
    .filter((t) => !noiseRe.test(t))
    .filter((t) => t.replace(/【[^】]*】/g, '').trim().length >= 4);
  const fullText = meaningful.join('\n');

  if (fullText.length < 50) {
    return { error: '该会议逐字稿内容过少，无法总结', meeting: m.title, paras: paras.length, meaningful: meaningful.length };
  }

  const system = [
    '你是公司"会议智能中枢"的助手。下面是某场会议语音转写的逐字稿（按【发言人】标注），请基于全文做一次结构化总结。',
    '输出结构：',
    '1. 会议概览：一句话主题 + 主要议程。',
    '2. 【各发言人要点】按发言人分组（这是重点，必须具体）：',
    '   - 每位发言人一段，列出他/她说了什么：提出的观点、分享的信息、提出的问题、承诺或承担的待办。',
    '   - 引用时用【发言人】+ 原话大意（保留关键表述）。',
    '3. 【决策】明确决议了什么。',
    '4. 【共识】大家达成的一致。',
    '5. 【待办】谁、做什么、截止时间（结合钉钉已提取的待办核对补充）。',
    '6. 【信息缺口】逐字稿未覆盖的内容。',
    '注意：逐字稿是口语转写，可能含识别错误和无关寒暄，请提炼实质内容，忽略寒暄；未说话或只有寒暄的发言人可省略。',
  ].join('\n');
  const user = [
    `会议：${m.title}`,
    `时间：${m.start_time ? new Date(m.start_time).toLocaleString('zh-CN') : '未知'}`,
    `待办（钉钉已提取 ${acts.length} 项）：`,
    acts.map((a) => `  - ${a.title} (${a.status})`).join('\n') || '  无',
    '',
    '以下是完整逐字稿：',
    '--------',
    fullText.slice(0, 14000),
    '--------',
    '请生成结构化总结，重点按发言人分开展开。',
  ].join('\n');

  const answer = await callDeepSeek(
    [{ role: 'system', content: system }, { role: 'user', content: user }],
    { maxTokens },
  );
  return { meeting: m.title, taskUuid, paras: paras.length, meaningful: meaningful.length, summary: answer };
}
