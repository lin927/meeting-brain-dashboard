import { pull } from './pull.js'
import { meetingCount } from './overview.js'
import { open, setMeta } from './db.js'
import { indexChunks } from './embed.js'
import { pushLog } from './runtime-log.js'

let syncing = false

export function isSyncing() {
  return syncing
}

export function persistSyncResult(r) {
  try {
    const db = open()
    setMeta(db, 'last_sync_json', JSON.stringify(r))
    db.close()
  } catch (e) {
    console.error('[sync-meta]', e.message)
  }
}

export async function runSync() {
  if (syncing) return { success: false, message: '正在同步中…请稍候', syncing: true }
  syncing = true
  const started = Date.now()
  try {
    const before = meetingCount()
    const syncedCount = await pull({ maxUuid: 300, quiet: true, skipExisting: true })
    const added = Math.max(0, meetingCount() - before)
    try { await indexChunks() } catch (e) { console.error('indexChunks:', e.message) }
    const r = {
      success: true, added, syncedCount, elapsedMs: Date.now() - started,
      at: Date.now(),
      message: added > 0 ? `新增 ${added} 条` : '无新增',
    }
    pushLog('更新', r.message)
    return r
  } catch (e) {
    const r = { success: false, at: Date.now(), message: `同步失败: ${String(e && e.message || e)}` }
    pushLog('更新', r.message, 'error')
    return r
  } finally {
    syncing = false
  }
}
