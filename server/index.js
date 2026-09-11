/**
 * meeting-brain 本地后端服务
 *
 * 给 DSH 驾驶舱插件提供 HTTP API（localhost 专用）。所有数据仍在本机
 * SQLite，语义问答/深度总结按用户配置走 DeepSeek 云端。
 * 每个使用者各自电脑独立运行一份。
 */
import express from 'express'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { ask, summarizeTranscript, testLlm } from '../lib/ask.js'
import { loadGlossary, glossaryForSettings, saveUserNamedList } from '../lib/glossary.js'
import { projectPatch, projectChoices } from '../lib/project.js'
import { importProjectsFromCsv } from '../lib/project-csv.js'
import { indexChunkIds } from '../lib/embed.js'
import { overview, todosByRange, keywordSearch, meetingCount } from '../lib/overview.js'
import {
  meetingDetail, projectTodos, queryMeetings, queryTodos,
  backfillSummaries,
} from '../lib/overview.js'
import {
  open, updateMeetingFields, setMeta, getMeta, parseTags,
  insertAction, updateActionFields, deleteAction, getAction, getMeeting,
  getTodoCats, setTodoCats, saveDeepSummary, saveRecord, saveTranscript, deleteMeetingLocal,
} from '../lib/db.js'
import { setMeetingVisibility, peekCompanyMeeting, testRagflow, repairPublishedMetadata } from '../lib/publish.js'
import { importMeeting } from '../lib/import-meeting.js'
import { refreshMeeting } from '../lib/pull.js'
import { updateDingTalkTitle, updateDingTalkSummary } from '../lib/minutes-write.js'
import { syncStatus } from '../lib/sync-status.js'
import { persistSyncResult, isSyncing, syncProgress, enqueueSync } from '../lib/sync-run.js'
import { listLogs, pushLog } from '../lib/runtime-log.js'
import {
  loadClassifyConfig, saveClassifyConfig, classifyPublicView, classifyExisting,
} from '../lib/classify.js'
import { getMcpState, setMcpEnabled, rotateMcpToken, mcpIsEnabled, bearerMatches } from '../lib/mcp-config.js'
import { handleMcpHttp } from '../lib/mcp-server.js'
import {
  resolveLlmConfig, saveLlmConfig, llmPublicView,
  resolveKbConfig, saveKbConfig, kbPublicView,
  resolveWriteback, saveWriteback,
} from '../lib/runtime-config.js'
import { normalizeType, canPublishType } from '../lib/meeting-type.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3400
const HOST = process.env.HOST || '127.0.0.1'
const PUBLIC_DIR = path.join(__dirname, '..', 'public')

const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(express.static(PUBLIC_DIR))

// CORS：浏览器页面（DSH Web, localhost:3080）fetch 本后端（localhost:3400）属跨域，
// 必须放行。本服务仅监听 127.0.0.1，只服务本机页面，允许任意 Origin 无隐私风险。
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id, Last-Event-ID, MCP-Protocol-Version')
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const ok = (res, data) => res.json(data)
const fail = (res, e) => res.status(500).json({ error: String((e && e.message) || e) })

// ---------- 数据 ----------
app.get('/api/health', (_req, res) => {
  ok(res, { ok: true, name: 'meeting-brain', port: PORT })
})

app.get('/api/overview', async (_req, res) => {
  try { ok(res, overview()) } catch (e) { fail(res, e) }
})

app.get('/api/meetings', async (req, res) => {
  try {
    ok(res, queryMeetings({
      q: req.query.q,
      tag: req.query.tag,
      filter: req.query.filter,
      cursor: req.query.cursor,
      limit: req.query.limit,
      id: req.query.id,
    }))
  } catch (e) { fail(res, e) }
})

app.get('/api/todos', async (req, res) => {
  try {
    ok(res, queryTodos({
      q: req.query.q,
      cat: req.query.cat,
      status: req.query.status || 'open',
      cursor: req.query.cursor,
      limit: req.query.limit,
      id: req.query.id,
    }))
  } catch (e) { fail(res, e) }
})

app.post('/api/todos-range', async (req, res) => {
  try { ok(res, todosByRange(req.body && req.body.range)) } catch (e) { fail(res, e) }
})

app.get('/api/search-keywords', async (req, res) => {
  try {
    const kw = String(req.query.keyword || '').trim()
    if (!kw) return fail(res, new Error('缺少 keyword'))
    ok(res, keywordSearch(kw))
  } catch (e) { fail(res, e) }
})

app.get('/api/detail', async (req, res) => {
  try {
    const id = String(req.query.id || '')
    if (!id) return fail(res, new Error('缺少 id'))
    ok(res, meetingDetail(id))
  } catch (e) { fail(res, e) }
})

app.get('/api/projects', async (_req, res) => {
  try { ok(res, { items: projectChoices(loadGlossary()) }) } catch (e) { fail(res, e) }
})

app.get('/api/project', async (req, res) => {
  try {
    const name = String(req.query.name || '')
    if (!name) return fail(res, new Error('缺少 name'))
    ok(res, projectTodos(name))
  } catch (e) { fail(res, e) }
})

// ---------- 同步 ----------
const AUTO_SYNC_MS = Number(process.env.MEETING_BRAIN_AUTO_SYNC_MS) || 30 * 60 * 1000
function finishSync(r) {
  persistSyncResult(r)
  if (r.success && r.added > 0) console.log(`[auto-sync] ${r.message}`)
}
function startSync(opts, reason) {
  const kicked = enqueueSync(opts)
  if (!kicked.started) return false
  kicked.done.then(finishSync).catch((e) => {
    console.error('[auto-sync] 异常:', e.message)
    pushLog('更新', (reason || '自动更新') + '异常: ' + e.message, 'error')
  })
  return true
}
function armAutoSync() {
  setTimeout(() => {
    try {
      const db = open()
      const last = getMeta(db, 'last_sync_json')
      db.close()
      if (!last && meetingCount() === 0) {
        pushLog('更新', '首次启动，开始全量同步')
        startSync({ full: true }, '首次全量')
      }
    } catch (e) {
      console.error('[auto-sync] 首次检测失败:', e.message)
    }
  }, 8000)
  setInterval(() => startSync({}, '自动更新'), AUTO_SYNC_MS)
  console.log(`[auto-sync] 已启用：空库首次全量；之后每 ${AUTO_SYNC_MS / 60000} 分钟增量`)
}

app.get('/api/sync-status', async (req, res) => {
  try {
    ok(res, await syncStatus({
      syncing: isSyncing(),
      progress: syncProgress(),
      skipDws: String(req.query.meta || '') === '1',
    }))
  } catch (e) { fail(res, e) }
})

app.post('/api/sync', async (req, res) => {
  const full = !!(req.body && req.body.full)
  if (isSyncing()) {
    return ok(res, {
      success: true, started: false, syncing: true, full,
      message: '正在同步中…页面可继续用',
    })
  }
  startSync({ full }, full ? '全量' : '更新')
  ok(res, {
    success: true, started: true, syncing: true, full,
    message: full ? '开始全量同步，页面可继续用' : '开始更新，页面可继续用',
  })
})

// ---------- AI ----------
app.post('/api/ask', async (req, res) => {
  try {
    const query = String((req.body && req.body.query) || '')
    if (!query) return fail(res, new Error('缺少 query'))
    const r = await ask({ query })
    ok(res, { answer: r.answer || '', hits: r.hits || [] })
  } catch (e) { fail(res, e) }
})

app.post('/api/summarize', async (req, res) => {
  try {
    const id = String((req.body && req.body.id) || '')
    if (!id) return fail(res, new Error('缺少 id'))
    const r = await summarizeTranscript({ taskUuid: id })
    if (r && r.error) return fail(res, new Error(r.error))
    const text = r.summary || ''
    const db = open()
    const chunkId = saveDeepSummary(db, id, text)
    db.close()
    try { if (chunkId) await indexChunkIds([chunkId]) } catch (e) { console.error('index deep:', e.message) }
    ok(res, { summary: text, id, saved: true })
  } catch (e) { fail(res, e) }
})

app.post('/api/backfill-summaries', async (_req, res) => {
  try { ok(res, await backfillSummaries()) } catch (e) { fail(res, e) }
})

app.patch('/api/meeting', async (req, res) => {
  try {
    const id = String((req.body && req.body.id) || '')
    if (!id) return fail(res, new Error('缺少 id'))
    const fields = {}
    for (const k of ['title', 'attendees']) {
      if (req.body[k] !== undefined) fields[k] = req.body[k]
    }
    const typeRaw = req.body.type !== undefined ? req.body.type : req.body.scope
    if (typeRaw !== undefined) {
      fields.scope = normalizeType(typeRaw)
      fields.scope_source = fields.scope ? 'user' : ''
    }
    if (req.body.tags !== undefined) fields.tags_json = JSON.stringify(parseTags(req.body.tags))
    const deepIn = req.body.deepSummary !== undefined ? req.body.deepSummary
      : (req.body.deep_summary !== undefined ? req.body.deep_summary : undefined)
    const hasSummary = req.body.summary !== undefined
    const hasTranscript = req.body.transcript !== undefined
    const db = open()
    const m = getMeeting(db, id)
    if (!m) { db.close(); return fail(res, new Error('未找到会议')) }
    const nextType = fields.scope !== undefined ? fields.scope : normalizeType(m.scope)
    Object.assign(fields, projectPatch(req.body, nextType, loadGlossary()))
    if (Object.keys(fields).length === 0 && deepIn === undefined && !hasSummary && !hasTranscript) {
      db.close()
      return fail(res, new Error('没有可更新字段'))
    }
    const wasCompany = (m.visibility || 'private') === 'company' || !!m.company_doc_id
    const typeChanged = fields.scope !== undefined && nextType !== normalizeType(m.scope)
    if (fields.scope === '个人' && wasCompany) {
      fields.visibility = 'private'
    }
    const prevTitle = m.title
    const prevSummary = m.summary
    const meetingSource = m.source
    const writebackOn = resolveWriteback(db).enabled
    db.close()
    if (wasCompany && nextType === '个人') {
      const retracted = await setMeetingVisibility({ taskUuid: id, visibility: 'private' })
      if (retracted && retracted.error) return res.status(400).json({ error: retracted.error })
    }
    const db2 = open()
    if (Object.keys(fields).length > 0) {
      fields.edited_at = Date.now()
      updateMeetingFields(db2, id, fields)
    }
    const indexIds = []
    if (hasSummary) indexIds.push(...saveRecord(db2, id, req.body.summary))
    if (hasTranscript) indexIds.push(...saveTranscript(db2, id, req.body.transcript))
    let deepChunkId = null
    if (deepIn !== undefined) deepChunkId = saveDeepSummary(db2, id, deepIn)
    db2.close()
    if (wasCompany && typeChanged && canPublishType(nextType)) {
      const moved = await setMeetingVisibility({ taskUuid: id, visibility: 'company', overwrite: true })
      if (moved && moved.error) return res.status(400).json({ error: moved.error })
    }
    if (deepChunkId) indexIds.push(deepChunkId)
    if (indexIds.length) {
      try { await indexChunkIds(indexIds) } catch (e) { console.error('index meeting:', e.message) }
    }
    let dingTalkTitle = null
    let dingTalkSummary = null
    const skipDingTalk = req.body.skipDingTalk === true || !writebackOn
    if (fields.title !== undefined && String(fields.title) !== String(prevTitle || '')) {
      if (skipDingTalk) {
        dingTalkTitle = {
          ok: true,
          status: 'skipped_local',
          message: writebackOn ? '本机已保存，未改钉钉听记标题' : '本机已保存，写回钉钉已关闭',
        }
      } else {
        dingTalkTitle = await updateDingTalkTitle({
          taskUuid: id,
          title: fields.title,
          source: meetingSource,
        })
      }
    }
    if (hasSummary && String(req.body.summary) !== String(prevSummary || '')) {
      if (skipDingTalk) {
        dingTalkSummary = {
          ok: true,
          status: 'skipped_local',
          message: writebackOn ? '本机已保存，未改钉钉纪要' : '本机已保存，写回钉钉已关闭',
        }
      } else {
        dingTalkSummary = await updateDingTalkSummary({
          taskUuid: id,
          content: req.body.summary,
          source: meetingSource,
        })
      }
    }
    const detail = meetingDetail(id)
    if (detail && dingTalkTitle) detail.dingTalkTitle = dingTalkTitle
    if (detail && dingTalkSummary) detail.dingTalkSummary = dingTalkSummary
    ok(res, detail)
  } catch (e) { fail(res, e) }
})

app.post('/api/meeting/delete', async (req, res) => {
  try {
    const id = String((req.body && req.body.id) || '')
    if (!id) return fail(res, new Error('缺少 id'))
    const db = open()
    const m = getMeeting(db, id)
    if (!m) { db.close(); return fail(res, new Error('未找到会议')) }
    const needRetract = (m.visibility || 'private') === 'company' || !!m.company_doc_id
    db.close()
    if (needRetract) {
      const retracted = await setMeetingVisibility({ taskUuid: id, visibility: 'private' })
      if (retracted && retracted.error) return res.status(400).json({ error: retracted.error })
    }
    const db2 = open()
    const okDel = deleteMeetingLocal(db2, id)
    db2.close()
    if (!okDel) return fail(res, new Error('未找到会议'))
    ok(res, { ok: true, id })
  } catch (e) { fail(res, e) }
})

app.post('/api/meeting/refresh', async (req, res) => {
  try {
    const id = String((req.body && req.body.id) || '')
    if (!id) return fail(res, new Error('缺少 id'))
    if (isSyncing()) return fail(res, new Error('正在同步中…请稍候'))
    const r = await refreshMeeting({ taskUuid: id })
    if (r.chunkIds && r.chunkIds.length) {
      try { await indexChunkIds(r.chunkIds) } catch (e) { console.error('index refresh:', e.message) }
    }
    const bits = []
    if (r.keptRecord) bits.push('本机改过的记录未覆盖')
    if (r.keptTranscript) bits.push('本机改过的逐字稿未覆盖')
    const message = bits.length ? ('已从钉钉重拉；' + bits.join('，')) : '已从钉钉重拉'
    pushLog('更新', '重拉 ' + (r.title || id) + (bits.length ? '（' + bits.join('，') + '）' : ''))
    const detail = meetingDetail(id)
    if (detail) detail.refresh = { ok: true, keptRecord: r.keptRecord, keptTranscript: r.keptTranscript, message }
    ok(res, detail)
  } catch (e) { fail(res, e) }
})

app.get('/api/publish/status', async (req, res) => {
  try {
    const id = String((req.query && req.query.id) || '')
    if (!id) return fail(res, new Error('缺少 id'))
    const r = await peekCompanyMeeting(id)
    if (r && r.error) return res.status(400).json({ error: r.error })
    ok(res, r)
  } catch (e) { fail(res, e) }
})

app.post('/api/publish', async (req, res) => {
  try {
    const id = String((req.body && req.body.id) || '')
    const visibility = String((req.body && req.body.visibility) || 'private')
    const overwrite = !!(req.body && req.body.overwrite)
    if (!id) return fail(res, new Error('缺少 id'))
    const r = await setMeetingVisibility({ taskUuid: id, visibility, overwrite })
    if (r && r.error) return res.status(400).json({ error: r.error })
    ok(res, r)
  } catch (e) { fail(res, e) }
})

app.post('/api/import', async (req, res) => {
  try {
    const r = await importMeeting(req.body || {})
    if (r && r.error) return fail(res, new Error(r.error))
    ok(res, r)
  } catch (e) { fail(res, e) }
})

app.post('/api/todos', async (req, res) => {
  try {
    const title = String((req.body && req.body.title) || '').trim()
    const meetingId = String((req.body && req.body.meetingId) || '')
    if (!title) return fail(res, new Error('缺少待办'))
    if (!meetingId) return fail(res, new Error('缺少会议'))
    const db = open()
    const m = getMeeting(db, meetingId)
    if (!m) { db.close(); return fail(res, new Error('未找到会议')) }
    const id = insertAction(db, {
      task_uuid: meetingId,
      title,
      owner: String((req.body && req.body.owner) || '待定'),
      status: 'open',
      created_time: Date.now(),
      cat: String((req.body && req.body.cat) || '其他'),
      origin: String((req.body && req.body.origin) || '手工'),
      due: String((req.body && req.body.due) || ''),
    })
    db.close()
    const listed = queryTodos({ id, status: 'all', limit: 1 })
    ok(res, { ok: true, id, item: listed.selected || null })
  } catch (e) { fail(res, e) }
})

app.patch('/api/todos', async (req, res) => {
  try {
    const id = Number(req.body && req.body.id)
    if (!id) return fail(res, new Error('缺少 id'))
    const db = open()
    const row = getAction(db, id)
    if (!row) { db.close(); return fail(res, new Error('未找到待办')) }
    const fields = {}
    for (const k of ['title', 'owner', 'cat', 'due', 'origin']) {
      if (req.body[k] !== undefined) fields[k] = req.body[k]
    }
    if (req.body.status !== undefined) {
      fields.status = req.body.status === 'done' ? 'done' : 'open'
      fields.closed_at = fields.status === 'done' ? (req.body.closed_at || Date.now()) : null
    }
    updateActionFields(db, id, fields)
    db.close()
    ok(res, { ok: true, id })
  } catch (e) { fail(res, e) }
})

app.post('/api/todos/delete', async (req, res) => {
  try {
    const id = Number(req.body && req.body.id)
    if (!id) return fail(res, new Error('缺少 id'))
    const db = open()
    deleteAction(db, id)
    db.close()
    ok(res, { ok: true, id })
  } catch (e) { fail(res, e) }
})

app.post('/api/todo-cats', async (req, res) => {
  try {
    const name = String((req.body && req.body.name) || '').trim()
    if (!name) return fail(res, new Error('缺少归类名称'))
    const db = open()
    const cats = getTodoCats(db)
    if (cats.includes(name)) { db.close(); return fail(res, new Error('归类已存在')) }
    cats.push(name)
    setTodoCats(db, cats)
    db.close()
    ok(res, { ok: true, cats })
  } catch (e) { fail(res, e) }
})

function settingsPayload() {
  const g = glossaryForSettings()
  const db = open()
  const llm = llmPublicView(resolveLlmConfig(db))
  const kb = kbPublicView(resolveKbConfig(db))
  const cats = getTodoCats(db)
  const writeback = resolveWriteback(db)
  const classify = classifyPublicView(loadClassifyConfig(db))
  db.close()
  return {
    people: g.people,
    projects: g.projects,
    terms: g.terms,
    llm,
    kb,
    cats,
    writeback,
    classify,
    mcp: getMcpState(PORT),
  }
}

app.get('/api/settings', async (_req, res) => {
  try { ok(res, settingsPayload()) } catch (e) { fail(res, e) }
})

app.post('/api/settings', async (req, res) => {
  try {
    const body = req.body || {}
    if (body.people !== undefined) saveUserNamedList('people', body.people)
    if (body.projects !== undefined) saveUserNamedList('projects', body.projects)
    if (body.terms !== undefined) saveUserNamedList('terms', body.terms)
    const db = open()
    if (body.llm) saveLlmConfig(db, body.llm)
    if (body.kb) saveKbConfig(db, body.kb)
    if (body.kbUrl !== undefined || body.kbKey !== undefined) {
      saveKbConfig(db, { url: body.kbUrl, apiKey: body.kbKey })
    }
    if (body.writeback) saveWriteback(db, body.writeback)
    if (body.classify) saveClassifyConfig(db, body.classify)
    db.close()
    if (body.mcp) {
      if (body.mcp.rotateToken) rotateMcpToken(PORT)
      else if (body.mcp.enabled !== undefined) setMcpEnabled(!!body.mcp.enabled, PORT)
    }
    ok(res, settingsPayload())
  } catch (e) { fail(res, e) }
})

app.post('/api/settings/projects-import', async (req, res) => {
  try {
    const csv = String((req.body && req.body.csv) || '')
    if (!csv.trim()) return res.status(400).json({ error: '没有读到 CSV 内容' })
    const r = importProjectsFromCsv(csv)
    if (r.error) return res.status(400).json({ error: r.error })
    ok(res, { ...settingsPayload(), import: { added: r.added, updated: r.updated, skipped: r.skipped, total: r.total } })
  } catch (e) { fail(res, e) }
})

app.post('/api/classify', async (req, res) => {
  try {
    const id = String((req.body && req.body.id) || '')
    const all = !!(req.body && req.body.all)
    if (!id && !all) return fail(res, new Error('缺少 id'))
    const db = open()
    const r = classifyExisting(db, { id, all })
    db.close()
    if (id && r.updated === 0) {
      const skip = r.skipped && r.skipped[0]
      if (skip && skip.skipped === 'user') return fail(res, new Error('这场会的类型是手改的，规则不会覆盖'))
      if (skip && skip.skipped === 'no-match') return fail(res, new Error('没有规则命中这场会'))
    }
    if (all) pushLog('更新', '按规则填写类型 ' + r.updated + ' 场')
    else if (id && r.updated) pushLog('更新', '按规则填写 ' + ((r.items[0] && r.items[0].title) || id))
    const detail = id ? meetingDetail(id) : null
    ok(res, { ...r, meeting: detail })
  } catch (e) { fail(res, e) }
})

app.get('/api/logs', async (req, res) => {
  try { ok(res, { items: listLogs(req.query.limit) }) } catch (e) { fail(res, e) }
})

app.all('/mcp', async (req, res) => {
  if (!mcpIsEnabled()) {
    pushLog('MCP', '拒绝：未打开', 'error')
    return res.status(403).json({ jsonrpc: '2.0', error: { code: -32000, message: 'MCP 未打开，请在设置里打开' }, id: null })
  }
  if (!bearerMatches(req.headers.authorization)) {
    pushLog('MCP', '拒绝：密钥不对', 'error')
    return res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'MCP 密钥无效' }, id: null })
  }
  try {
    const method = req.body && req.body.method
    const tool = req.body && req.body.params && req.body.params.name
    if (method && method !== 'notifications/initialized') {
      pushLog('MCP', tool ? `${method} ${tool}` : String(method))
    }
    await handleMcpHttp(req, res, { port: PORT })
  } catch (e) {
    pushLog('MCP', '处理失败: ' + (e && e.message || e), 'error')
    if (!res.headersSent) fail(res, e)
  }
})

app.post('/api/settings/llm-test', async (_req, res) => {
  try { ok(res, await testLlm()) } catch (e) { ok(res, { ok: false, error: String((e && e.message) || e) }) }
})

app.post('/api/settings/kb-test', async (_req, res) => {
  try { ok(res, await testRagflow()) } catch (e) { ok(res, { ok: false, error: String((e && e.message) || e) }) }
})

// ---------- 启动 ----------
const server = createServer(app)
server.listen(PORT, HOST, () => {
  console.log(`✅ meeting-brain 已启动: http://${HOST}:${PORT}  （界面与 API 同源）`)
  pushLog('服务', `已启动 http://${HOST}:${PORT}`)
  try { loadGlossary(); } catch (e) { console.error('[glossary]', e.message); }
  armAutoSync()
  repairPublishedMetadata().catch((e) => {
    console.error('[publish] 补写知识库元数据失败:', e && e.message || e)
  })
})
server.on('error', (e) => {
  console.error('❌ 启动失败:', e.message)
  process.exit(1)
})
