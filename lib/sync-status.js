import { userInfo } from 'node:os';
import { open, getMeta } from './db.js';
import { execDws } from './dws-exec.js';

let _operator = { at: 0, name: '' };

function fallbackOperator() {
  try {
    return userInfo().username || '';
  } catch {
    return '';
  }
}

async function dwsAuth() {
  try {
    const { stdout } = await execDws(['auth', 'status'], { timeout: 4000 });
    const text = String(stdout || '');
    const authenticated = /"authenticated"\s*:\s*true/.test(text);
    const user = (text.match(/"user_name"\s*:\s*"([^"]*)"/) || [])[1] || null;
    return { authenticated, user };
  } catch {
    return { authenticated: false, user: null, error: 'dws auth status 不可用' };
  }
}

/** 当前操作者：优先钉钉 DWS 登录名，否则本机用户名。结果缓存 5 分钟。 */
export async function currentOperator() {
  if (_operator.name && Date.now() - _operator.at < 5 * 60 * 1000) return _operator.name;
  const dws = await dwsAuth();
  const name = String((dws && dws.user) || fallbackOperator() || '本机').trim() || '本机';
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
  const dws = skipDws ? null : await dwsAuth();
  return {
    syncing,
    progress: syncing ? progress : null,
    autoSyncMs: Number(process.env.MEETING_BRAIN_AUTO_SYNC_MS) || 30 * 60 * 1000,
    last,
    ...(dws ? { dws } : {}),
  };
}
