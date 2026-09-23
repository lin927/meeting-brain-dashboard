import { meetingCount } from './overview.js'
import { open, setMeta } from './db.js'
import { indexChunks } from './embed.js'
import { pushLog } from './runtime-log.js'
import { SOURCE_ORDER, authStatus, pullProvider, providerMeta } from './providers/index.js'

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

function parseWanted(providers) {
  if (!providers) return [...SOURCE_ORDER]
  const list = Array.isArray(providers) ? providers : String(providers).split(',')
  const wanted = list.map((s) => String(s || '').trim()).filter((id) => SOURCE_ORDER.includes(id))
  return wanted.length ? wanted : [...SOURCE_ORDER]
}

export async function runSync({ full = false, providers = null } = {}) {
  if (syncing) return { success: false, message: '正在同步中…请稍候', syncing: true }
  syncing = true
  const started = Date.now()
  const label = full ? '全量' : '更新'
  const wanted = parseWanted(providers)
  setProgress({ phase: 'list', current: 0, total: 0, full: !!full })
  pushLog(label, full ? '开始全量同步' : '开始更新')
  const sources = []
  try {
    const before = meetingCount()
    let syncedCount = 0
    for (const id of wanted) {
      const meta = providerMeta(id)
      const auth = await authStatus(id)
      if (!auth.authenticated) {
        const reason = auth.error || '未登录'
        sources.push({ id, label: meta.label, skipped: true, message: reason })
        pushLog(label, meta.label + '跳过：' + reason)
        continue
      }
      setProgress({ phase: 'list', current: 0, total: 0, full: !!full, provider: id })
      try {
        const n = await pullProvider(id, {
          maxUuid: full ? 10000 : 300,
          quiet: true,
          skipExisting: true,
          full: !!full,
          onProgress: (p) => {
            setProgress({ ...p, full: !!full, provider: id })
            if (p.phase === 'list') return
            if (p.phase === 'pull' && p.total && (p.current === 0 || p.current === p.total || p.current % 20 === 0)) {
              pushLog(label, meta.label + (p.total ? ` ${p.current}/${p.total}` : ' 正在拉取'))
            }
          },
        })
        syncedCount += Number(n) || 0
        sources.push({ id, label: meta.label, ok: true, syncedCount: n })
      } catch (e) {
        const msg = String((e && e.message) || e)
        sources.push({ id, label: meta.label, ok: false, message: msg })
        pushLog(label, meta.label + '失败：' + msg, 'error')
      }
    }
    setProgress({ phase: 'index', current: syncedCount, total: syncedCount, full: !!full })
    const added = Math.max(0, meetingCount() - before)
    try { await indexChunks() } catch (e) { console.error('indexChunks:', e.message) }
    const failed = sources.filter((s) => s.ok === false)
    const skipped = sources.filter((s) => s.skipped)
    const ran = sources.filter((s) => s.ok)
    const bits = []
    if (added > 0) bits.push('新增 ' + added + ' 条')
    else bits.push('无新增')
    if (skipped.length) bits.push(skipped.map((s) => s.label + '未登录').join('、'))
    if (failed.length) bits.push(failed.map((s) => s.label + '失败').join('、'))
    const r = {
      success: failed.length === 0,
      added,
      syncedCount,
      elapsedMs: Date.now() - started,
      at: Date.now(),
      full: !!full,
      sources,
      message: (full ? '全量完成，' : '') + bits.join(' · '),
    }
    if (!ran.length && skipped.length && !failed.length) {
      r.success = false
      r.message = '没有已登录的听记来源。请到设置 → 听记登录钉钉、飞书或腾讯会议'
    }
    pushLog(label, r.message, r.success ? 'info' : 'error')
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

export function enqueueSync(opts = {}) {
  if (syncing) return { started: false, syncing: true, done: null }
  const done = runSync(opts)
  return { started: true, syncing: true, done }
}
