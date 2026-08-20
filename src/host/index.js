/**
 * meeting-brain-dashboard host half —— 给 DSH agent 注册会议工具。
 *
 * 让用户在 DSH 会话里直接问会议问题（不限于驾驶舱 tab）：
 *   - meeting_brain_ask：语义问答（跨会议检索 + DeepSeek 生成，含来源）
 *   - meeting_brain_todos：按时间范围查待办（今天/昨天/本周/近N天）
 *
 * 工具通过 HTTP 调用本机后端（localhost:3400），与驾驶舱共用同一数据源。
 * 数据仍只在本机 SQLite；问答把命中片段发往 DeepSeek 云端（用户已确认）。
 */

/** 后端地址：默认本机 3400，可用 MEETING_BRAIN_API 环境变量覆盖。 */
const BACKEND = () => process.env.MEETING_BRAIN_API || 'http://127.0.0.1:3400'

async function callBackend(path, body) {
  const url = BACKEND() + path
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

/** 所需服务：tools 注册表。 */
export const inject = ['tools']

/** 工具插件主体：注册会议问答与待办工具。 */
export function apply(ctx) {
  const tools = ctx.tools

  tools.register({
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
        required: ['answer'],
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

  tools.register({
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
        required: ['summary'],
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

  tools.register({
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
        required: ['summary'],
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
}
