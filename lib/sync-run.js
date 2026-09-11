import { pull } from './pull.js'
import { meetingCount } from './overview.js'
import { open, setMeta } from './db.js'
import { indexChunks } from './embed.js'
import { pushLog } from './runtime-log.js'

let syncing = false
let progress = null

export function isSyncing() {
  return syncing
}

export function syncProgress() {
  return progress
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

function setProgress(next) {
  progress = next
}

export async function runSync({ full = false } = {}) {
  if (syncing) return { success: false, message: '正在同步中…请稍候', syncing: true }
  syncing = true
  const started = Date.now()
  const label = full ? '全量' : '更新'
  setProgress({ phase: 'list', current: 0, total: 0, full: !!full })
  pushLog(label, full ? '开始全量同步' : '开始更新')
  try {
    const before = meetingCount()
    const syncedCount = await pull({
      maxUuid: full ? 10000 : 300,
      quiet: true,
      skipExisting: true,
      onProgress: (p) => {
        setProgress({ ...p, full: !!full })
        if (p.phase === 'list') return
        if (p.phase === 'pull' && p.total && (p.current === 0 || p.current === p.total || p.current % 20 === 0)) {
          pushLog(label, p.total ? `已拉 ${p.current}/${p.total}` : '正在拉取')
        }
      },
    })
    setProgress({ phase: 'index', current: syncedCount, total: syncedCount, full: !!full })
    const added = Math.max(0, meetingCount() - before)
    try { await indexChunks() } catch (e) { console.error('indexChunks:', e.message) }
    const r = {
      success: true, added, syncedCount, elapsedMs: Date.now() - started,
      at: Date.now(),
      full: !!full,
      message: added > 0
        ? (full ? `全量完成，新增 ${added} 条` : `新增 ${added} 条`)
        : (full ? '全量完成，无新增' : '无新增'),
    }
    pushLog(label, r.message)
    return r
  } catch (e) {
    const r = { success: false, at: Date.now(), full: !!full, message: `${label}失败: ${String(e && e.message || e)}` }
    pushLog(label, r.message, 'error')
    return r
  } finally {
    syncing = false
    progress = null
  }
}

/** 后台启动一次同步。已在跑则 started=false，不覆盖上次结果。 */
export function enqueueSync(opts = {}) {
  if (syncing) return { started: false, syncing: true, done: null }
  const done = runSync(opts)
  return { started: true, syncing: true, done }
}
