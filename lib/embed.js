// 本地轻量嵌入：加载 bge-small-zh-v1.5（纯本地 CPU，模型已缓存到项目 .cache），
// 为会议文本生成 512 维向量。数据与模型都不出本机。

import { pipeline, env } from '@huggingface/transformers';
import { open, listChunks, searchChunks, listPendingChunks, updateChunkVector } from './db.js';

let _extractor = null;

// 模型默认走 HF 主站；公司内网无法访问时切 hf-mirror，且模型可本地缓存。
function setMirror() {
  if (process.env.HF_ENDPOINT) {
    env.remoteHost = process.env.HF_ENDPOINT;
  } else if (process.env.MEETING_BRAIN_MIRROR === '1') {
    env.remoteHost = 'https://hf-mirror.com';
  }
}

export async function loadExtractor({ model = 'Xenova/bge-small-zh-v1.5', dtype = 'q8' } = {}) {
  if (_extractor) return _extractor;
  setMirror();
  try {
    _extractor = await pipeline('feature-extraction', model, { dtype });
  } catch (e) {
    // 主站下载失败（国内网络 huggingface.co 常超时）→ 自动回退 hf-mirror 重试一次
    if (!process.env.HF_ENDPOINT && env.remoteHost !== 'https://hf-mirror.com') {
      console.error(`[embed] 模型下载失败（${e.message}），回退 hf-mirror.com 重试…`);
      env.remoteHost = 'https://hf-mirror.com';
      _extractor = await pipeline('feature-extraction', model, { dtype });
    } else {
      throw e;
    }
  }
  return _extractor;
}

export async function embed(texts, { model, dtype } = {}) {
  const extractor = await loadExtractor({ model, dtype });
  const out = await extractor(texts, { pooling: 'mean', normalize: true });
  // 单条文本返回 Tensor[batch, dim]；批量时 out 是单个 Tensor，data 已展平。
  // 必须按 dims 切分，否则整个 batch 会被展平成一个向量。
  const tensors = Array.isArray(out) ? out : [out];
  const result = [];
  for (const t of tensors) {
    const dims = t.dims ?? [t.data.length];
    const dim = dims[dims.length - 1] ?? 1;
    const total = t.data.length;
    const count = dims.length > 1 ? (dims[dims.length - 2] ?? total / dim) : 1;
    for (let i = 0; i < count; i++) {
      result.push(Array.from(t.data.subarray(i * dim, (i + 1) * dim)));
    }
  }
  return result;
}

function yieldLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

export async function indexChunkIds(ids, { dbPath, model, dtype, batchSize = 8 } = {}) {
  const list = [...new Set((ids || []).map(Number).filter((n) => n > 0))];
  if (list.length === 0) return 0;
  const db = open(dbPath);
  const rows = [];
  for (const id of list) {
    const row = db.prepare(`SELECT id, chunk_text FROM chunks WHERE id = ?`).get(id);
    if (row && row.chunk_text) rows.push(row);
  }
  if (rows.length === 0) { db.close(); return 0; }
  const take = Math.min(Math.max(1, Number(batchSize) || 8), 16);
  for (let i = 0; i < rows.length; i += take) {
    const batch = rows.slice(i, i + take);
    const vecs = await embed(batch.map((c) => c.chunk_text), { model, dtype });
    for (let j = 0; j < batch.length; j++) {
      updateChunkVector(db, batch[j].id, JSON.stringify(vecs[j]));
    }
    await yieldLoop();
  }
  db.close();
  return rows.length;
}

export async function indexChunks({ dbPath, batchSize = 8, model, dtype } = {}) {
  const db = open(dbPath);
  const pending = listPendingChunks(db);
  console.log(`[index] 待向量化 ${pending.length} 块`);

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    const texts = batch.map((c) => c.chunk_text);
    const vecs = await embed(texts, { model, dtype });
    for (let j = 0; j < batch.length; j++) {
      const c = batch[j];
      updateChunkVector(db, c.id, JSON.stringify(vecs[j]));
    }
    console.log(`  ✓ ${Math.min(i + batchSize, pending.length)}/${pending.length}`);
    await yieldLoop();
  }
  db.close();
  return pending.length;
}

export async function semanticSearch({ dbPath, query, topK = 5, threshold = 0, model, dtype } = {}) {
  const db = open(dbPath);
  const [qvec] = await embed([query], { model, dtype });
  const results = searchChunks(db, qvec, { topK, threshold });
  db.close();
  return results;
}
