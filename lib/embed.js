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
  _extractor = await pipeline('feature-extraction', model, { dtype });
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
