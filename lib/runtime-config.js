// 本机设置：大模型（问/总结）与公司 RAGFlow（发布）。
// 环境变量仍可覆盖，方便装机脚本和完全本地模式。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { open, getMeta, setMeta } from './db.js';
import { KB_DATASETS, datasetForType, normalizeType } from './meeting-type.js';

export const LLM_PRESETS = {
  deepseek: { baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  ollama: { baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b' },
  custom: { baseUrl: '', model: '' },
};

function yamlDeepseekKey() {
  try {
    const y = readFileSync(join(homedir(), '.dsh', '.credentials.yaml'), 'utf8');
    const m = y.match(/DEEPSEEK_API_KEY:\s*(\S+)/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

function stripSlash(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

export function resolveLlmConfig(db) {
  const owned = db || open();
  const preset = getMeta(owned, 'llm_preset') || 'deepseek';
  const defaults = LLM_PRESETS[preset] || LLM_PRESETS.deepseek;
  const savedUrl = getMeta(owned, 'llm_base_url') || '';
  const savedModel = getMeta(owned, 'llm_model') || '';
  const savedKey = getMeta(owned, 'llm_api_key') || '';

  const envKey = process.env.DEEPSEEK_API_KEY || '';
  const envUrl = process.env.DEEPSEEK_BASE_URL || '';
  const envModel = process.env.DEEPSEEK_MODEL || '';
  const yamlKey = yamlDeepseekKey();
  const envLocked = !!(envKey || envUrl || envModel);

  const baseUrl = stripSlash(envUrl || savedUrl || defaults.baseUrl);
  const model = (envModel || savedModel || defaults.model).trim();
  const apiKey = envKey || savedKey || yamlKey || (preset === 'ollama' ? 'ollama' : '');

  let source = 'none';
  if (envLocked) source = 'env';
  else if (savedKey || savedUrl || savedModel) source = 'settings';
  else if (yamlKey) source = 'dsh';

  return { preset, baseUrl, model, apiKey, source, envLocked, keySet: !!apiKey };
}

export function saveLlmConfig(db, body) {
  const preset = ['deepseek', 'ollama', 'custom'].includes(body.preset) ? body.preset : 'deepseek';
  setMeta(db, 'llm_preset', preset);
  if (body.baseUrl !== undefined) setMeta(db, 'llm_base_url', stripSlash(body.baseUrl));
  if (body.model !== undefined) setMeta(db, 'llm_model', String(body.model || '').trim());
  if (body.apiKey !== undefined && String(body.apiKey).trim()) {
    setMeta(db, 'llm_api_key', String(body.apiKey).trim());
  }
}

export function resolveKbConfig(db) {
  const owned = db || open();
  const envUrl = process.env.RAGFLOW_BASE_URL || '';
  const envKey = process.env.RAGFLOW_API_KEY || '';
  const url = stripSlash(envUrl || getMeta(owned, 'kb_url') || '');
  const apiKey = envKey || getMeta(owned, 'kb_key') || '';
  const datasets = {};
  for (const d of KB_DATASETS) {
    datasets[d.key] = getMeta(owned, d.meta) || '';
  }
  const filled = KB_DATASETS.filter((d) => datasets[d.key]).length;
  return {
    url,
    keySet: !!apiKey,
    apiKey,
    datasets,
    filled,
    envLocked: !!(envUrl || envKey),
  };
}

export function saveKbConfig(db, body) {
  if (body.url !== undefined) setMeta(db, 'kb_url', stripSlash(body.url));
  if (body.apiKey !== undefined && String(body.apiKey).trim()) {
    setMeta(db, 'kb_key', String(body.apiKey).trim());
  }
  const ds = body.datasets || {};
  for (const d of KB_DATASETS) {
    if (ds[d.key] !== undefined) setMeta(db, d.meta, String(ds[d.key] || '').trim());
  }
}

export function datasetIdForMeeting(db, type) {
  const spec = datasetForType(type);
  if (!spec) return null;
  const kb = resolveKbConfig(db);
  const id = kb.datasets[spec.key] || '';
  return id ? { ...spec, datasetId: id, url: kb.url, apiKey: kb.apiKey } : { ...spec, datasetId: '', url: kb.url, apiKey: kb.apiKey };
}

export function llmPublicView(cfg) {
  return {
    preset: cfg.preset,
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    keySet: cfg.keySet,
    source: cfg.source,
    envLocked: cfg.envLocked,
  };
}

export function kbPublicView(cfg) {
  return {
    url: cfg.url,
    keySet: cfg.keySet,
    datasets: cfg.datasets,
    filled: cfg.filled,
    envLocked: cfg.envLocked,
  };
}

export { normalizeType, KB_DATASETS };
