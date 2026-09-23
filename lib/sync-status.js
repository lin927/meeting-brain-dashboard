import { userInfo } from 'node:os';
import { open, getMeta } from './db.js';
import { pushLog } from './runtime-log.js';
import { SOURCE_ORDER, authAll, providerMeta } from './providers/index.js';

let _operator = { at: 0, name: '' };

function fallbackOperator() {
  try {
    return userInfo().username || '';
  } catch {
    return '';
  }
}

/** 当前操作者：优先任一已登录源的用户名，否则本机用户名。结果缓存 5 分钟。 */
export async function currentOperator() {
  if (_operator.name && Date.now() - _operator.at < 5 * 60 * 1000) return _operator.name;
  let name = '';
  try {
    const all = await authAll();
    for (const id of SOURCE_ORDER) {
      const u = all[id] && all[id].user;
      if (u) { name = String(u).trim(); break; }
    }
  } catch (e) {
    pushLog('听记', '登录状态检查失败: ' + String(e.message || e), 'error');
  }
  name = name || fallbackOperator() || '本机';
  _operator = { at: Date.now(), name };
  return name;
}

export async function syncStatus({ syncing = false, skipDws = false, progress = null } = {}) {
  const db = open();
  let last = null;
  try {
    const raw = getMeta(db, 'last_sync_json');
    if (raw) last = JSON.parse(raw);
  } catch { /* ignore */ }
  db.close();
  const sources = {};
  if (!skipDws) {
    try {
      const all = await authAll();
      for (const id of SOURCE_ORDER) {
        sources[id] = { ...providerMeta(id), ...(all[id] || {}) };
      }
    } catch (e) {
      pushLog('听记', '登录状态检查失败: ' + String(e.message || e), 'error');
    }
  }
  const dingtalk = sources.dingtalk || null;
  return {
    syncing,
    progress: syncing ? progress : null,
    autoSyncMs: Number(process.env.MEETING_BRAIN_AUTO_SYNC_MS) || 30 * 60 * 1000,
    last,
    sources,
    dws: dingtalk
      ? { authenticated: !!dingtalk.authenticated, user: dingtalk.user || null, error: dingtalk.error }
      : undefined,
  };
}
