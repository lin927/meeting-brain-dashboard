export const NAV = [['meet', '会议'], ['ledger', '待办'], ['settings', '设置']]
export const MEETING_TYPES = ['个人', '公司管理', '公司运营', '项目', '部门']
export const PUBLISH_TYPES = MEETING_TYPES.filter((t) => t !== '个人')
export const KB_DS = [
  { key: 'mgmt', label: '公司管理会议' },
  { key: 'ops', label: '公司运营会议' },
  { key: 'project', label: '项目会议' },
  { key: 'dept', label: '部门会议' },
]
export const LLM_PRESETS = [
  { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { id: 'ollama', label: '本机 Ollama', baseUrl: 'http://127.0.0.1:11434/v1', model: 'qwen2.5:7b' },
  { id: 'custom', label: '自定义', baseUrl: '', model: '' },
]
export const MEET_PAGE = 60
export const TODO_PAGE = 80

function pad(n) { return String(n).padStart(2, '0') }

export function ymd(ms = Date.now()) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fmtShort(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fmtDateTime(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function monthKey(ms) {
  const d = new Date(ms || 0)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1)
}

export function monthLabel(ms) {
  const d = new Date(ms || 0)
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月'
}

export function typeLabel(t) {
  if (!t) return '未定类型'
  return t
}

export function uploadBtnLabel(type) {
  if (!type || type === '个人') return ''
  return '上传到' + type
}

export function companyMark(m) {
  if (m.visibility !== 'company') return ''
  const t = m.type || m.scope
  return t && t !== '个人' ? '已到' + t : '已上传'
}

export function srcLabel(s) {
  if (s === 'import') return '导入'
  if (s === 'shared') return '分享'
  return '听记'
}

export function originLabel(o) {
  return { 听记: '钉钉听记', 总结: '会后总结', 手工: '手工' }[o] || o || '听记'
}

export function lastSyncLabel(st) {
  if (!st || !st.last) return ''
  const t = st.last.at ? fmtShort(st.last.at) : ''
  const msg = String(st.last.message || '').trim()
  return [t, msg].filter(Boolean).join(' · ')
}

export function syncProgressLabel(st) {
  const p = st && st.progress
  if (!p) return ''
  if (p.phase === 'list') return '正在列出听记…'
  if (p.phase === 'index') return '正在建立索引…'
  if (p.phase === 'pull' && p.total) {
    const n = (p.current || 0) + '/' + p.total
    const title = String(p.title || '').trim()
    return title ? ('已拉 ' + n + ' · ' + title) : ('已拉 ' + n)
  }
  return '同步中…'
}

export function lastSyncTitle(st) {
  if (!st || !st.last) return ''
  const t = st.last.at ? fmtDateTime(st.last.at) : ''
  const msg = String(st.last.message || '').trim()
  return [t, msg].filter(Boolean).join(' · ')
}

export function groupMonths(list) {
  const months = []
  const map = new Map()
  list.forEach((x) => {
    const k = monthKey(x.time)
    if (!map.has(k)) {
      const g = { key: k, label: monthLabel(x.time), items: [] }
      map.set(k, g)
      months.push(g)
    }
    map.get(k).items.push(x)
  })
  return months
}
