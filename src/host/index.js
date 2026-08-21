/**
 * meeting-brain-dashboard host half —— 给 DSH agent 注册会议工具。
 *
 * 让用户在 DSH 会话里直接问会议问题（不限于驾驶舱 tab）：
 *   - meeting_brain_ask：语义问答（跨会议检索 + DeepSeek 生成，含来源）
 *   - meeting_brain_todos：按时间范围查待办（今天/昨天/本周/近N天）
 *   - meeting_brain_keywords：关键词全文检索（哪些会议提到XX）
 *
 * 工具通过 HTTP 调用本机后端（localhost:3400），与驾驶舱共用同一数据源。
 * 数据仍只在本机 SQLite；问答把命中片段发往 DeepSeek 云端（用户已确认）。
 */

// DSH 工具注册必须经过 defineTool 编译（parameters DSL → JSON Schema）。
// @deepseek-ai/dsh-tools 由 DSH 运行时提供，构建时保持外部引用。
import { defineTool } from '@deepseek-ai/dsh-tools'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 后端端口范围：3400 被占用时顺延探测。 */
const BACKEND_PORTS = [3400, 3401, 3402, 3403, 3404]
const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * 定位仓库目录（server/index.js 所在处）。
 * 优先级：
 *   1. MEETING_BRAIN_REPO 环境变量（安装脚本设置，最可靠）
 *   2. 当前模块所在目录的父目录（profile 副本在 node_modules/.../lib，上一级是包目录；
 *      若用户在仓库里运行则直接命中）
 *   3. 常见安装路径：~/meeting-brain-dashboard、~/code/meeting-brain-dashboard
 */
function findRepoDir() {
  if (process.env.MEETING_BRAIN_REPO && existsSync(join(process.env.MEETING_BRAIN_REPO, 'server', 'index.js'))) {
    return process.env.MEETING_BRAIN_REPO
  }
  // 当前模块目录向上找：lib/../ 是包根；若包根下有 server/index.js 则直接是仓库
  const candidates = [
    join(__dirname, '..'),                  // profile 副本或仓库内：node_modules/xxx/lib -> 包根
    join(__dirname, '..', '..'),            // 更上层兜底
    join(os.homedir(), 'meeting-brain-dashboard'),
    join(os.homedir(), 'code', 'meeting-brain-dashboard'),
    join(os.homedir(), 'code', 'meeting-brain-dashboard', 'meeting-brain-dashboard'),
  ]
  for (const c of candidates) {
    if (existsSync(join(c, 'server', 'index.js'))) return c
  }
  return null
}

/** 后端地址：可用 MEETING_BRAIN_API 环境变量强制指定（跳过探测）。 */
const BACKEND = () => process.env.MEETING_BRAIN_API || 'http://127.0.0.1:3400'

/** 探测某端口是否为「健康的 meeting-brain 后端」。 */
async function probeBackend(port, timeoutMs = 2000) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return false
    const j = await res.json()
    return !!(j && j.ok && j.name === 'meeting-brain')
  } catch {
    return false
  }
}

/** 找到第一个健康后端端口；无则返回 null。 */
async function findHealthyBackend() {
  for (const p of BACKEND_PORTS) {
    if (await probeBackend(p)) return p
  }
  return null
}

/** 找到第一个空闲端口（从 3400 起；被非会议程序占用的视为不可用跳过）。 */
async function findFreePort() {
  for (const p of BACKEND_PORTS) {
    if (await probeBackend(p, 800)) continue // 已有健康后端，不用新起
    try {
      const res = await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(600) })
      if (res.ok) continue // 有响应但不是会议后端 → 视为占用
    } catch {
      return p // 无法连接 → 空闲
    }
  }
  return BACKEND_PORTS[0]
}

/** 启动后端进程；返回 child。 */
function startBackend(port) {
  const repoDir = findRepoDir()
  if (!repoDir) throw new Error('无法定位 meeting-brain 仓库目录（server/index.js），请设置 MEETING_BRAIN_REPO 环境变量')
  const serverPath = join(repoDir, 'server', 'index.js')
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
    stdio: 'ignore',
  })
  child.on('error', (e) => {
    console.error('[meeting-brain] 后端启动失败:', e.message)
  })
  return child
}

/** 确保后端在运行（幂等）：已健康则复用，否则启动。返回实际端口。 */
let managedChild = null
async function ensureBackend() {
  const existing = await findHealthyBackend()
  if (existing !== null) return existing
  const port = await findFreePort()
  try {
    managedChild = startBackend(port)
    return port
  } catch (e) {
    console.error('[meeting-brain] 后端启动异常:', e.message)
    return null
  }
}

/** 看门狗：周期性健康检查，后端挂了自动重启（防抖）。 */
let watchdogBusy = false
async function watchdogTick() {
  if (watchdogBusy) return
  watchdogBusy = true
  try {
    await ensureBackend()
  } finally {
    watchdogBusy = false
  }
}

/** 已探测到的后端端口（缓存，避免每次探测全部端口）。 */
let cachedPort = null

/** 获取当前可用的后端端口：缓存有效则复用，否则探测/启动。 */
async function resolvePort() {
  if (cachedPort !== null) {
    if (await probeBackend(cachedPort, 800)) return cachedPort
    cachedPort = null
  }
  const port = await ensureBackend()
  if (port !== null) cachedPort = port
  return port
}

async function callBackend(path, body) {
  const port = await resolvePort()
  if (port === null) throw new Error('meeting-brain 后端不可用（无法启动）')
  const url = `http://127.0.0.1:${port}${path}`
  const res = await fetch(url, body === undefined
    ? {}
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { /* 非 JSON */ }
  if (!res.ok) {
    throw new Error(`meeting-brain 后端错误 ${res.status}: ${(data && data.error) || text.slice(0, 200)}`)
  }
  return data
}

/** 按时间范围查待办：today / yesterday / thisWeek / lastNdays:N */
async function todos(range) {
  const r = await callBackend('/api/todos-range', { range })
  return r
}

export const name = 'meeting-brain-tools'

/** 所需服务：tools 注册表 + timer（30s 后端看门狗 interval）。 */
export const inject = ['tools', 'timer']

/** 工具插件主体：注册会议问答与待办工具。 */
export function apply(ctx) {
  const tools = ctx.tools

  // 必须用 defineTool 编译（把 parameters DSL → 完整 JSON Schema 再注册），
  // 直接 register 原始对象会把 DSL 原样透传给模型 API（无顶层 type:object），
  // DeepSeek 会拒绝: Invalid schema for function ... got 'type: null'。
  const def = (o) => tools.register(defineTool(o))

  def({
    name: 'meeting_brain_ask',
    description:
      '跨会议语义问答：在本地会议库里检索与问题相关的听记/摘要/待办，并结合 DeepSeek 生成带来源的答案。'
      + '适合问「孟底沟项目有什么待办？」「上周会议讨论了什么？」「XX决策是怎么定的？」这类跨会议的自然语言问题。',
    parameters: {
      query: {
        type: 'string',
        required: true,
        description: '要问的问题，自然语言，如：孟底沟项目有什么待办？',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          answer: { type: 'string', description: '生成的答案（含 [会议标题] 来源引用）' },
          hits: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.answer || '(无结果)' }],
    },
    async execute(args) {
      const query = String(args.query || '').trim()
      if (!query) throw new Error('缺少 query')
      const r = await callBackend('/api/ask', { query })
      return { answer: r.answer || '', hits: r.hits || [] }
    },
  })

  def({
    name: 'meeting_brain_todos',
    description:
      '按时间范围查询会议待办（今天/昨天/本周/近N天）。'
      + '适合问「今天有什么待办？」「本周的待办有哪些？」「近7天有哪些待办？」。'
      + '返回按会议分组的待办列表。',
    parameters: {
      range: {
        type: 'string',
        required: true,
        enum: ['today', 'yesterday', 'thisWeek', 'last7days', 'last30days'],
        description: '时间范围：today=今天, yesterday=昨天, thisWeek=本周, last7days=近7天, last30days=近30天',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          summary: { type: 'string', description: '可读的待办汇总' },
          meetings: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.summary || '(无结果)' }],
    },
    async execute(args) {
      const range = String(args.range || '')
      if (!range) throw new Error('缺少 range')
      // 兼容 lastNdays:N 与枚举值（last7days → lastNdays:7）
      let r = await callBackend('/api/todos-range', { range })
      if (r && r.error) throw new Error(r.error)
      // 拼一个可读 summary 供 render
      const label = r.label || range
      const lines = [`${label}：${r.count || 0} 项待办`]
      for (const m of r.meetings || []) {
        const acts = m.actions || []
        if (acts.length === 0) continue
        lines.push(`· ${m.title}（${acts.length}项）：`)
        acts.forEach((a) => lines.push(`    - ${a.title}${a.status === 'open' ? '（未完成）' : ''}`))
      }
      return { summary: lines.join('\n'), meetings: r.meetings || [] }
    },
  })

  def({
    name: 'meeting_brain_keywords',
    description:
      '关键词全文检索：找出明确包含指定词的会议（标题/摘要/逐字稿中直接出现该词）。'
      + '适合「哪些会议提到了XX」「哪些会议讨论过XX」这类问题——结果一字不漏（按字面匹配），'
      + '区别于语义检索（语义相近但不含原词）。',
    parameters: {
      keyword: {
        type: 'string',
        required: true,
        description: '要检索的关键词，如：第一性原理',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          summary: { type: 'string', description: '按会议列出的检索结果' },
          meetings: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      render: (_args, value) => [{ type: 'text', text: value.summary || '(无结果)' }],
    },
    async execute(args) {
      const keyword = String(args.keyword || '').trim()
      if (!keyword) throw new Error('缺少 keyword')
      const r = await callBackend('/api/search-keywords?keyword=' + encodeURIComponent(keyword))
      if (r && r.error) throw new Error(r.error)
      const lines = [`关键词「${r.keyword}」命中 ${r.count} 场会议：`]
      for (const m of r.meetings || []) {
        const where = m.matchedIn === 'title' ? '标题' : m.matchedIn === 'summary' ? '摘要' : '逐字稿'
        const d = m.time ? new Date(m.time).toLocaleDateString('zh-CN') : ''
        lines.push(`· ${m.title}（${d}，命中${where}）`)
      }
      return { summary: lines.join('\n'), meetings: r.meetings || [] }
    },
  })

  // ---- 后端托管：DSH 启动时确保后端在跑，周期看门狗，DSH 退出时回收 ----
  // 首次启动即探测/拉起（DSH 重启后自动恢复后端，无需手动 node server/index.js）
  ensureBackend().catch((e) => console.error('[meeting-brain] 初始后端启动失败:', e.message))
  // 看门狗：每 30 秒健康检查，后端挂了自动重启（不依赖 DSH 重启）
  const watchdog = ctx.interval(() => {
    watchdogTick().catch((e) => console.error('[meeting-brain] 看门狗异常:', e.message))
  }, 30 * 1000)
  // DSH 退出/插件卸载时，回收自己拉起的后端进程
  ctx.on('dispose', () => {
    if (managedChild && managedChild.exitCode === null) {
      try { managedChild.kill() } catch { /* 已退出 */ }
    }
    managedChild = null
  })
  // 看门狗定时器随 ctx.interval 自动清理，无需手动 dispose
  void watchdog
}
