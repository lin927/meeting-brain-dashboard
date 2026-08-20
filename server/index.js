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

import { ask, summarizeTranscript } from '../lib/ask.js'
import { pull } from '../lib/pull.js'
import { indexChunks } from '../lib/embed.js'
import { overview, todosByRange } from '../lib/overview.js'
import {
  allMeetings, meetingDetail, projectTodos, todoTracking, backfillSummaries,
} from '../lib/overview.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3400
const HOST = process.env.HOST || '127.0.0.1'

const app = express()
app.use(express.json({ limit: '10mb' }))

const ok = (res, data) => res.json(data)
const fail = (res, e) => res.status(500).json({ error: String((e && e.message) || e) })

// ---------- 数据 ----------
app.get('/api/health', (_req, res) => {
  ok(res, { ok: true, name: 'meeting-brain', port: PORT })
})

app.get('/api/overview', async (_req, res) => {
  try { ok(res, overview()) } catch (e) { fail(res, e) }
})

app.get('/api/meetings', async (_req, res) => {
  try { ok(res, allMeetings()) } catch (e) { fail(res, e) }
})

app.get('/api/todos', async (_req, res) => {
  try { ok(res, todoTracking()) } catch (e) { fail(res, e) }
})

app.post('/api/todos-range', async (req, res) => {
  try { ok(res, todosByRange(req.body && req.body.range)) } catch (e) { fail(res, e) }
})

app.get('/api/detail', async (req, res) => {
  try {
    const id = String(req.query.id || '')
    if (!id) return fail(res, new Error('缺少 id'))
    ok(res, meetingDetail(id))
  } catch (e) { fail(res, e) }
})

app.get('/api/project', async (req, res) => {
  try {
    const name = String(req.query.name || '')
    if (!name) return fail(res, new Error('缺少 name'))
    ok(res, projectTodos(name))
  } catch (e) { fail(res, e) }
})

// ---------- 同步 ----------
let syncing = false
app.post('/api/sync', async (req, res) => {
  if (syncing) return ok(res, { success: false, message: '正在同步中…请稍候', syncing: true })
  syncing = true
  const started = Date.now()
  try {
    const before = allMeetings().length
    const syncedCount = await pull({ maxUuid: 300, quiet: true, skipExisting: true })
    const added = Math.max(0, allMeetings().length - before)
    try { await indexChunks() } catch (e) { console.error('indexChunks:', e.message) }
    ok(res, {
      success: true, added, syncedCount, elapsedMs: Date.now() - started,
      message: `同步完成，新增 ${added} 条听记，耗时 ${((Date.now() - started) / 1000).toFixed(1)}s`,
    })
  } catch (e) {
    fail(res, e)
  } finally {
    syncing = false
  }
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
    ok(res, { summary: r.summary || '', id })
  } catch (e) { fail(res, e) }
})

app.post('/api/backfill-summaries', async (_req, res) => {
  try { ok(res, await backfillSummaries()) } catch (e) { fail(res, e) }
})

// ---------- 启动 ----------
const server = createServer(app)
server.listen(PORT, HOST, () => {
  console.log(`✅ meeting-brain 后端已启动: http://${HOST}:${PORT}`)
})
server.on('error', (e) => {
  console.error('❌ 启动失败:', e.message)
  process.exit(1)
})
