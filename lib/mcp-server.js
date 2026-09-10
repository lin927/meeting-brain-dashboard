import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import { ask, summarizeTranscript } from './ask.js'
import { open, insertAction, updateActionFields, getAction, getMeeting, saveDeepSummary } from './db.js'
import { indexChunkIds } from './embed.js'
import { keywordSearch, meetingDetail, queryMeetings, queryTodos, todosByRange } from './overview.js'
import { mcpUrl } from './mcp-config.js'
import { pushLog } from './runtime-log.js'
import { isSyncing, persistSyncResult, runSync } from './sync-run.js'

const TX_CAP = 12000

function asText(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return {
    content: [{ type: 'text', text }],
    structuredContent: typeof data === 'object' && data ? data : { text },
  }
}

function asError(msg) {
  return { content: [{ type: 'text', text: '错误: ' + msg }], isError: true }
}

async function logged(name, fn) {
  const t0 = Date.now()
  try {
    const r = await fn()
    pushLog('MCP', `${name} · ${Date.now() - t0}ms`)
    return r
  } catch (e) {
    pushLog('MCP', `${name} 失败: ${e && e.message || e}`, 'error')
    return asError(String(e && e.message || e))
  }
}

function mapRange(range) {
  if (range === 'last7days') return 'lastNdays:7'
  if (range === 'last30days') return 'lastNdays:30'
  return range
}

function fmtTime(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function createServer(port) {
  const server = new McpServer({ name: 'htmeeting-mcp-server', version: '0.2.0' })

  server.registerTool('meeting_ask', {
    title: '问会议',
    description: '跨会议语义问答。适合「孟底沟定了什么」「上周拍了哪些板」。在本机听记/总结/待办里检索，再用大模型生成带来源的答案。',
    inputSchema: z.object({
      query: z.string().min(1).describe('自然语言问题'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ query }) => logged('meeting_ask', async () => {
    const r = await ask({ query })
    return asText({ answer: r.answer || '', hits: r.hits || [] })
  }))

  server.registerTool('meeting_list', {
    title: '列会议',
    description: '分页列出本机会议。只含标题、时间、类型、标签、是否已到公司，不含逐字稿。',
    inputSchema: z.object({
      q: z.string().optional().describe('标题过滤'),
      tag: z.string().optional().describe('标签'),
      filter: z.enum(['all', 'company']).optional().describe('all=全部, company=已到公司'),
      cursor: z.string().optional().describe('上一页返回的 nextCursor'),
      limit: z.number().int().min(1).max(80).optional().describe('每页条数，默认 40'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async (args) => logged('meeting_list', async () => {
    const r = queryMeetings({
      q: args.q, tag: args.tag, filter: args.filter || 'all',
      cursor: args.cursor, limit: args.limit || 40,
    })
    return asText({
      total: r.total,
      nextCursor: r.nextCursor,
      items: (r.items || []).map((m) => ({
        id: m.taskUuid,
        title: m.title,
        time: fmtTime(m.time),
        type: m.type || m.scope,
        tags: m.tags || [],
        source: m.source,
        visibility: m.visibility,
        actionCount: m.actionCount,
      })),
    })
  }))

  server.registerTool('meeting_get', {
    title: '打开一场会',
    description: '取一场会议的记录、本机总结、待办。逐字稿默认不返回；需要原文时设 include_transcript=true（过长会截断）。',
    inputSchema: z.object({
      id: z.string().min(1).describe('会议 taskUuid'),
      include_transcript: z.boolean().optional().describe('是否附带逐字稿，默认 false'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ id, include_transcript }) => logged('meeting_get', async () => {
    const d = meetingDetail(id)
    if (!d) return asError('未找到会议')
    const out = {
      id: d.taskUuid,
      title: d.title,
      time: fmtTime(d.startTime),
      attendees: d.attendees || '',
      type: d.type || d.scope,
      tags: d.tags || [],
      source: d.source,
      visibility: d.visibility,
      record: d.summary || '',
      deepSummary: d.deepSummary || '',
      actions: (d.actions || []).map((a) => ({
        id: a.id, title: a.title, status: a.status, owner: a.owner, cat: a.cat, due: a.due,
      })),
      ui: `${mcpUrl(port).replace(/\/mcp$/, '')}/?meet=${encodeURIComponent(d.taskUuid)}`,
    }
    if (include_transcript) {
      const raw = (d.transcript || []).join('\n')
      out.transcriptTruncated = raw.length > TX_CAP
      out.transcript = raw.length > TX_CAP ? raw.slice(0, TX_CAP) + '\n…（已截断）' : raw
    }
    return asText(out)
  }))

  server.registerTool('meeting_search_keywords', {
    title: '关键词检索',
    description: '找出标题/摘要/逐字稿里明确出现该词的会议。要语义相近而不是原词，用 meeting_ask。',
    inputSchema: z.object({
      keyword: z.string().min(1).describe('关键词，可逗号分隔多个'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ keyword }) => logged('meeting_search_keywords', async () => {
    const r = keywordSearch(keyword)
    return asText({
      keyword: r.keyword,
      count: r.count,
      meetings: (r.meetings || []).map((m) => ({
        id: m.taskUuid, title: m.title, time: fmtTime(m.time), matchedIn: m.matchedIn,
      })),
    })
  }))

  server.registerTool('meeting_list_todos', {
    title: '列待办',
    description: '按状态/归类/会议分页列本机待办。默认未关闭。',
    inputSchema: z.object({
      status: z.enum(['open', 'done', 'all']).optional().describe('默认 open'),
      cat: z.string().optional().describe('归类，如 项目/部门/公司/其他'),
      q: z.string().optional().describe('过滤事项、责任人或所属会议标题'),
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(80).optional(),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async (args) => logged('meeting_list_todos', async () => {
    const r = queryTodos({
      status: args.status || 'open',
      cat: args.cat,
      q: args.q,
      cursor: args.cursor,
      limit: args.limit || 40,
    })
    return asText({
      total: r.total,
      open: r.open,
      filteredTotal: r.filteredTotal,
      nextCursor: r.nextCursor,
      cats: r.cats,
      items: (r.items || []).map((t) => ({
        id: t.id, title: t.title, status: t.status, owner: t.owner, cat: t.cat,
        meeting: t.meeting, meetingId: t.meetingId, due: t.due,
      })),
    })
  }))

  server.registerTool('meeting_todos_by_range', {
    title: '按时间待办',
    description: '按今天/昨天/本周/近7天/近30天列出会议待办，适合日报。',
    inputSchema: z.object({
      range: z.enum(['today', 'yesterday', 'thisWeek', 'last7days', 'last30days']).describe('时间范围'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ range }) => logged('meeting_todos_by_range', async () => {
    const r = todosByRange(mapRange(range))
    return asText({
      label: r.label,
      count: r.count,
      meetings: (r.meetings || []).map((m) => ({
        id: m.taskUuid, title: m.title, time: fmtTime(m.time),
        actions: m.actions || [],
      })),
    })
  }))

  server.registerTool('meeting_open', {
    title: '打开界面',
    description: '返回本机会议助手里这场会的地址，给人在浏览器里核对原文。',
    inputSchema: z.object({
      id: z.string().optional().describe('会议 taskUuid；空则只返回首页'),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  }, async ({ id }) => logged('meeting_open', async () => {
    const base = mcpUrl(port).replace(/\/mcp$/, '')
    if (!id) return asText({ url: base })
    const d = meetingDetail(id)
    return asText({
      url: `${base}/?meet=${encodeURIComponent(id)}`,
      title: d ? d.title : '',
      found: !!d,
    })
  }))

  server.registerTool('meeting_add_todo', {
    title: '登记待办',
    description: '在本机一场会议上登记待办。不写到钉钉。',
    inputSchema: z.object({
      meeting_id: z.string().min(1).describe('所属会议 taskUuid'),
      title: z.string().min(1).describe('事项'),
      owner: z.string().optional().describe('责任人，可空'),
      cat: z.string().optional().describe('归类，默认其他'),
      due: z.string().optional().describe('时限，可空'),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async (args) => logged('meeting_add_todo', async () => {
    const db = open()
    const m = getMeeting(db, args.meeting_id)
    if (!m) { db.close(); return asError('未找到会议') }
    const id = insertAction(db, {
      task_uuid: args.meeting_id,
      title: args.title,
      owner: args.owner || '',
      status: 'open',
      created_time: Date.now(),
      cat: args.cat || '其他',
      origin: '手工',
      due: args.due || '',
    })
    db.close()
    return asText({ ok: true, id, meeting: m.title })
  }))

  server.registerTool('meeting_update_todo', {
    title: '改待办',
    description: '关闭、打开或改本机待办的标题/责任人/归类/时限。不写到钉钉。',
    inputSchema: z.object({
      id: z.number().int().describe('待办 id'),
      status: z.enum(['open', 'done']).optional(),
      title: z.string().optional(),
      owner: z.string().optional(),
      cat: z.string().optional(),
      due: z.string().optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  }, async (args) => logged('meeting_update_todo', async () => {
    const db = open()
    const row = getAction(db, args.id)
    if (!row) { db.close(); return asError('未找到待办') }
    const fields = {}
    for (const k of ['title', 'owner', 'cat', 'due']) {
      if (args[k] !== undefined) fields[k] = args[k]
    }
    if (args.status !== undefined) {
      fields.status = args.status === 'done' ? 'done' : 'open'
      fields.closed_at = fields.status === 'done' ? Date.now() : null
    }
    if (!Object.keys(fields).length) { db.close(); return asError('没有可更新字段') }
    updateActionFields(db, args.id, fields)
    db.close()
    return asText({ ok: true, id: args.id, ...fields })
  }))

  server.registerTool('meeting_summarize', {
    title: '生成本机总结',
    description: '根据逐字稿生成本机决策记录，写入 deep_summary，不改钉钉听记。若已有总结，必须 confirm_overwrite=true，否则会提示覆盖。',
    inputSchema: z.object({
      id: z.string().min(1).describe('会议 taskUuid'),
      confirm_overwrite: z.boolean().optional().describe('已有总结时必须为 true'),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  }, async ({ id, confirm_overwrite }) => logged('meeting_summarize', async () => {
    const d = meetingDetail(id)
    if (!d) return asError('未找到会议')
    if (String(d.deepSummary || '').trim() && !confirm_overwrite) {
      return asError('本机已有总结，再生成会覆盖（含改过的内容）。确认请带 confirm_overwrite=true。钉钉听记不会改。')
    }
    const r = await summarizeTranscript({ taskUuid: id })
    if (r && r.error) return asError(r.error)
    const text = r.summary || ''
    const db = open()
    const chunkId = saveDeepSummary(db, id, text)
    db.close()
    if (chunkId) {
      try { await indexChunkIds([chunkId]) } catch { /* ignore */ }
    }
    return asText({ ok: true, id, summary: text })
  }))

  server.registerTool('meeting_pull', {
    title: '更新听记',
    description: '从钉钉拉新听记到本机，等同界面「更新」。正在拉时会返回请稍候。',
    inputSchema: z.object({
      confirm: z.boolean().optional().describe('可省略，带 true 也一样执行'),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  }, async () => logged('meeting_pull', async () => {
    if (isSyncing()) return asText({ ok: false, message: '正在同步中…请稍候', syncing: true })
    const r = await runSync()
    persistSyncResult(r)
    return asText(r)
  }))

  return server
}

export async function handleMcpHttp(req, res, { port }) {
  const server = createServer(port)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  res.on('close', () => {
    try { transport.close() } catch { /* ignore */ }
    try { if (typeof server.close === 'function') server.close() } catch { /* ignore */ }
  })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
}
