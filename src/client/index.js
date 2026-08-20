/**
 * meeting-brain-dashboard 浏览器 half。
 *
 * 驾驶舱通过 fetch 调用本机后端（默认 http://127.0.0.1:3400，可用
 * window.MEETING_BRAIN_API 覆盖）。数据仍只在本机 SQLite。
 */

/** 后端地址：默认本机 3400 端口，可在页面注入 window.MEETING_BRAIN_API 覆盖。 */
const API = () => (typeof window !== 'undefined' && window.MEETING_BRAIN_API) || 'http://127.0.0.1:3400'

async function api(path, body) {
  const url = API() + path
  const res = await fetch(url, body === undefined
    ? {}
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`后端错误 ${res.status}: ${t.slice(0, 200)}`)
  }
  return res.json()
}

/** 待办状态查询：按范围（today/yesterday/thisWeek/lastNdays:N）。 */
async function todosByRange(range) {
  return api('/api/todos-range', { range })
}

export const name = 'meeting-brain-dashboard'

/** 所需客户端服务。 */
export const inject = ['slots']

/** @type {import('@deepseek-ai/dsh-client-runtime/client').ClientContext} */
let ctxRef

/**
 * 客户端插件主体：注册「会议驾驶舱」视图 tab。
 * @param ctx 客户端根上下文
 */
export function apply(ctx) {
  ctxRef = ctx
  ctx.slots.inject('conversation.view', () =>
    ctx.slots.register({
      name: 'conversation.view',
      id: 'meeting-brain',
      order: 20,
      label: '会议驾驶舱',
    }, Dashboard),
  )
}

// ─────────────────────────── 驾驶舱组件 ───────────────────────────

const styles = (typeof document !== 'undefined' && document.createElement('style')) || null

function injectStyles(css) {
  if (!styles) return
  if (!injectStyles.done) {
    styles.textContent = css
    document.head.appendChild(styles)
    injectStyles.done = true
  }
}

injectStyles(`
  .mbdg-root { padding: 16px; display: flex; flex-direction: column; gap: 14px; height: 100%; box-sizing: border-box; }
  .mbdg-h { font-size: 18px; font-weight: 600; margin: 0; }
  .mbdg-sub { color: var(--dsw-text-secondary, #888); font-size: 13px; margin: 2px 0 0; }
  .mbdg-syncbar { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--dsw-text-secondary, #888); flex-wrap: wrap; }
  .mbdg-syncbtn { padding: 4px 12px; border: 1px solid var(--dsw-border, #ddd); border-radius: 6px; background: var(--dsw-bg-elevated, #fff); cursor: pointer; font-size: 12px; color: var(--dsw-text, #333); }
  .mbdg-syncbtn:hover { border-color: #2563eb; }
  .mbdg-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
  .mbdg-card { border: 1px solid var(--dsw-border, #eee); border-radius: 10px; padding: 12px 14px; background: var(--dsw-bg-elevated, #fff); }
  .mbdg-card .v { font-size: 22px; font-weight: 700; }
  .mbdg-card .k { font-size: 12px; color: var(--dsw-text-secondary, #888); margin-top: 2px; }
  .mbdg-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
  .mbdg-tab { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--dsw-border, #ddd); cursor: pointer; font-size: 13px; background: var(--dsw-bg-elevated, #fff); color: var(--dsw-text, #333); }
  .mbdg-tab.on { background: #2563eb; color: #fff; border-color: #2563eb; }
  .mbdg-layout { display: grid; grid-template-columns: minmax(300px, 5fr) minmax(320px, 6fr); gap: 14px; flex: 1; min-height: 0; }
  .mbdg-list { overflow-y: auto; border: 1px solid var(--dsw-border, #eee); border-radius: 10px; padding: 8px; background: var(--dsw-bg-elevated, #fff); }
  .mbdg-group { margin-bottom: 4px; }
  .mbdg-group-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--dsw-text-secondary, #666); user-select: none; }
  .mbdg-group-head:hover { background: var(--dsw-bg-hover, #f5f5f5); }
  .mbdg-item { border-radius: 8px; padding: 8px 12px; margin: 2px 0 2px 8px; cursor: pointer; border: 1px solid transparent; }
  .mbdg-item:hover { background: var(--dsw-bg-hover, #f5f5f5); }
  .mbdg-item.sel { background: #eff6ff; border-color: #2563eb; }
  .mbdg-item .t { font-weight: 500; font-size: 13px; }
  .mbdg-item .meta { font-size: 11px; color: var(--dsw-text-secondary, #888); margin-top: 2px; }
  .mbdg-item .todo { font-size: 12px; color: var(--dsw-text, #444); margin-top: 3px; }
  .mbdg-detail { overflow-y: auto; border: 1px solid var(--dsw-border, #eee); border-radius: 10px; padding: 14px 16px; background: var(--dsw-bg-elevated, #fff); }
  .mbdg-search { display: flex; gap: 8px; margin-top: 10px; }
  .mbdg-input { flex: 1; padding: 8px 12px; border: 1px solid var(--dsw-border, #ddd); border-radius: 8px; font-size: 14px; background: var(--dsw-bg-elevated, #fff); color: var(--dsw-text, #333); }
  .mbdg-btn { padding: 8px 16px; border: none; border-radius: 8px; background: #2563eb; color: #fff; cursor: pointer; font-size: 14px; }
  .mbdg-ans { white-space: pre-wrap; font-size: 13px; line-height: 1.6; background: var(--dsw-bg-elevated, #fff); border: 1px solid var(--dsw-border, #eee); border-radius: 10px; padding: 14px; margin-top: 8px; }
  .mbdg-empty { color: var(--dsw-text-secondary, #999); font-size: 13px; padding: 12px; }
  .md-h1 { font-size: 17px; font-weight: 700; margin: 10px 0 6px; }
  .md-h2 { font-size: 15px; font-weight: 700; margin: 8px 0 5px; }
  .md-h3 { font-size: 14px; font-weight: 600; margin: 6px 0 4px; }
  .md-p { font-size: 13px; line-height: 1.7; margin: 4px 0; }
  .md-li { font-size: 13px; line-height: 1.6; margin: 2px 0 2px 18px; }
  .md-b { font-weight: 600; }
  .md-quote { border-left: 3px solid var(--dsw-border, #ddd); padding-left: 10px; color: var(--dsw-text-secondary, #666); margin: 6px 0; font-size: 13px; }
  .md-code { background: var(--dsw-bg-hover, #f2f2f2); border-radius: 4px; padding: 1px 5px; font-family: monospace; font-size: 12px; }
  .md-todo { font-size: 13px; padding: 4px 0; }
  .mbdg-mini-btn { margin-top: 6px; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--dsw-border, #ddd); background: var(--dsw-bg-elevated, #fff); cursor: pointer; font-size: 12px; color: var(--dsw-text, #333); }
  .mbdg-mini-btn:hover { border-color: #2563eb; }
  .mbdg-mini-btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }
  .mbdg-tx { margin-top: 8px; border: 1px solid var(--dsw-border, #eee); border-radius: 8px; padding: 10px 12px; background: var(--dsw-bg-hover, #f7f7f7); max-height: 320px; overflow-y: auto; font-size: 12px; line-height: 1.7; white-space: pre-wrap; }
  .mbdg-deep { margin-top: 10px; border: 1px solid var(--dsw-border, #eee); border-radius: 8px; padding: 12px; background: var(--dsw-bg-elevated, #fff); font-size: 13px; }
`)

function fmtTime(ms) { if (!ms) return ''; return new Date(ms).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function fmtDate(ms) { if (!ms) return ''; return new Date(ms).toLocaleDateString('zh-CN') }
function monthKey(ms) { const d = new Date(ms); return d.getFullYear() + '-' + (d.getMonth() + 1) }
function monthLabel(ms) { const d = new Date(ms); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' }

function GroupedList(props) {
  const items = props.items
  const renderItem = props.renderItem
  const defaultOpenFirst = props.defaultOpenFirst || 2
  const [open, setOpen] = React.useState({})
  const groups = []
  const map = new Map()
  for (const it of items) {
    const k = monthKey(it.time)
    if (!map.has(k)) { const g = { key: k, label: monthLabel(it.time), items: [] }; map.set(k, g); groups.push(g) }
    map.get(k).items.push(it)
  }
  React.useEffect(() => {
    if (Object.keys(open).length > 0) return
    const o = {}
    groups.slice(0, defaultOpenFirst).forEach((g) => { o[g.key] = true })
    setOpen(o)
  }, [items.length])
  const toggle = (k) => setOpen((p) => { const n = Object.assign({}, p); n[k] = !n[k]; return n })
  return React.createElement('div', null, groups.map((g) => React.createElement('div', { className: 'mbdg-group', key: g.key },
    React.createElement('div', { className: 'mbdg-group-head', onClick: () => toggle(g.key) },
      React.createElement('span', null, g.label + ' · ' + g.items.length + '场' + (open[g.key] ? '' : ' ▸'))),
    open[g.key] ? g.items.map(renderItem) : null)))
}

function renderInline(text, key, linkMap, onMeetingClick) {
  const out = []
  const parts = String(text).split(/\*\*(.+?)\*\*/g)
  parts.forEach((p, i) => {
    if (i % 2 === 1) { out.push(React.createElement('strong', { className: 'md-b', key: key + '-b' + i }, p)); return }
    if (!p) return
    const segs = p.split(/(\[[^\]]+\])/g)
    segs.forEach((seg, j) => {
      if (!seg) return
      const m = seg.match(/^\[(.+)\]$/)
      if (m && linkMap && linkMap[m[1]] !== undefined) {
        out.push(React.createElement('span', { key: key + '-l' + i + '-' + j, style: { color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }, onClick: () => onMeetingClick && onMeetingClick(linkMap[m[1]]) }, m[1]))
      } else {
        out.push(seg)
      }
    })
  })
  return out
}

function Md(props) {
  const text = props.text
  const linkMap = props.linkMap
  const onMeetingClick = props.onMeetingClick
  if (!text) return React.createElement('div', null)
  const lines = String(text).split('\n')
  const blocks = []
  let i = 0
  const ri = (txt, k) => renderInline(txt, k, linkMap, onMeetingClick)
  while (i < lines.length) {
    const line = lines[i]
    const t = line.trim()
    if (t.startsWith('#')) {
      const m = t.match(/^(#{1,3})\s+(.*)/)
      if (m) {
        const cls = m[1].length === 1 ? 'md-h1' : m[1].length === 2 ? 'md-h2' : 'md-h3'
        blocks.push(React.createElement('div', { className: cls, key: 'b' + blocks.length }, ri(m[2], 'b' + blocks.length)))
        i++; continue
      }
    }
    if (t.startsWith('>')) {
      blocks.push(React.createElement('div', { className: 'md-quote', key: 'q' + blocks.length }, ri(t.replace(/^>\s?/, ''), 'q' + blocks.length)))
      i++; continue
    }
    if (/^[-*]\s/.test(t) || /^\d+\.\s/.test(t)) {
      blocks.push(React.createElement('div', { className: 'md-li', key: 'l' + blocks.length }, ri(t.replace(/^[-*]\s/, '• ').replace(/^\d+\.\s/, ''), 'l' + blocks.length)))
      i++; continue
    }
    if (/^```/.test(t)) {
      i++
      const code = []
      while (i < lines.length && !/^```/.test(lines[i].trim())) { code.push(lines[i]); i++ }
      i++
      blocks.push(React.createElement('pre', { className: 'md-code', key: 'c' + blocks.length, style: { whiteSpace: 'pre-wrap', padding: 8 } }, code.join('\n')))
      continue
    }
    if (t === '') { i++; continue }
    if (/^!\[.*\]\(.*\)$/.test(t)) { i++; continue }
    blocks.push(React.createElement('div', { className: 'md-p', key: 'p' + blocks.length }, ri(line, 'p' + blocks.length)))
    i++
  }
  return React.createElement('div', null, blocks)
}

function MeetingDetail(props) {
  const uuid = props.uuid
  const [d, setD] = React.useState(null)
  const [err, setErr] = React.useState(null)
  const [sub, setSub] = React.useState('record')
  const [showTx, setShowTx] = React.useState(false)
  const [deep, setDeep] = React.useState(null)
  const [deeping, setDeeping] = React.useState(false)
  React.useEffect(() => {
    setD(null); setErr(null); setSub('record'); setShowTx(false); setDeep(null)
    api('/api/detail?id=' + encodeURIComponent(uuid)).then((r) => r && r.error ? setErr(r.error) : setD(r)).catch((e) => setErr(String(e && e.message || e)))
  }, [uuid])
  const doDeep = () => {
    if (deeping || deep) return
    setDeeping(true); setDeep('生成中…')
    api('/api/summarize', { id: uuid }).then((r) => {
      if (r && r.error) setDeep('失败: ' + r.error)
      else setDeep(r && r.summary || '无结果')
    }).catch((e) => setDeep('失败: ' + String(e && e.message || e))).finally(() => setDeeping(false))
  }
  if (err) return React.createElement('div', { className: 'mbdg-empty' }, '加载失败: ' + err)
  if (!d) return React.createElement('div', { className: 'mbdg-empty' }, '加载中…')
  const tx = d.transcript || []
  const txLen = tx.filter((t) => { const clean = String(t).replace(/【[^】]*】/g, '').trim(); return clean.length >= 4 }).length
  const subTab = (id, label) => React.createElement('div', { className: 'mbdg-tab' + (sub === id ? ' on' : ''), onClick: () => setSub(id) }, label)
  return React.createElement('div', null,
    React.createElement('div', { className: 'md-h1' }, d.title),
    d.startTime ? React.createElement('div', { className: 'md-p' }, '时间: ' + fmtTime(d.startTime)) : null,
    d.attendees ? React.createElement('div', { className: 'md-p' }, '参会人: ' + d.attendees) : null,
    d.keywords && d.keywords.length ? React.createElement('div', { className: 'md-p' }, '关键词: ' + d.keywords.join(', ')) : null,
    React.createElement('div', { className: 'mbdg-tabs', style: { margin: '10px 0' } },
      subTab('record', '会议记录'),
      subTab('transcript', '逐字稿' + (txLen > 0 ? ' (' + txLen + ')' : '')),
      subTab('deep', 'AI 深度总结')),
    sub === 'record'
      ? React.createElement('div', null,
          d.actions && d.actions.length ? React.createElement('div', null, React.createElement('div', { className: 'md-h2' }, '待办 (' + d.actions.length + ')'), d.actions.map((a, i) => React.createElement('div', { className: 'md-todo', key: i }, '• ' + a.title + (a.status === 'open' ? '（未完成）' : '')))) : null,
          d.summary ? React.createElement('div', null, React.createElement('div', { className: 'md-h2' }, '会议记录'), React.createElement(Md, { text: d.summary })) : null)
      : null,
    sub === 'transcript'
      ? React.createElement('div', null,
          txLen > 0
            ? React.createElement('button', { className: 'mbdg-mini-btn', onClick: () => setShowTx(!showTx) }, (showTx ? '收起' : '查看') + '逐字稿（' + txLen + ' 段）')
            : React.createElement('div', { className: 'md-p', style: { color: 'var(--dsw-text-secondary,#999)' } }, '该会议暂无逐字稿（可能未同步，或为语音通话类）'),
          showTx ? React.createElement('div', { className: 'mbdg-tx' }, tx.join('\n')) : null)
      : null,
    sub === 'deep'
      ? React.createElement('div', null,
          React.createElement('button', { className: 'mbdg-mini-btn primary', onClick: doDeep, disabled: deeping || !!deep }, deeping ? '生成中…' : (deep ? '重新生成' : '基于逐字稿生成')),
          deep ? React.createElement('div', { className: 'mbdg-deep' }, React.createElement(Md, { text: deep })) : null)
      : null)
}

function TodoBoard(props) {
  const data = props.data
  if (!data) return React.createElement('div', { className: 'mbdg-empty' }, '加载中…')
  const dup = data.duplicates || []
  const byMeeting = data.byMeeting || []
  return React.createElement('div', null,
    React.createElement('div', { className: 'mbdg-cards' },
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v' }, String(data.total || 0)), React.createElement('div', { className: 'k' }, '待办总数')),
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v' }, String(data.open || 0)), React.createElement('div', { className: 'k' }, '未完成')),
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v', style: data.overdue > 0 ? { color: '#dc2626' } : {} }, String(data.overdue || 0)), React.createElement('div', { className: 'k' }, '疑似逾期')),
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v', style: dup.length > 0 ? { color: '#d97706' } : {} }, String(dup.length)), React.createElement('div', { className: 'k' }, '重复组'))),
    dup.length > 0 ? React.createElement('div', null, React.createElement('div', { className: 'md-h2' }, '重复待办识别 (' + dup.length + ' 组)'), dup.map((g, gi) => React.createElement('div', { key: gi, style: { border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', marginBottom: 8, background: '#fffbeb' } }, g.map((t, ti) => React.createElement('div', { className: 'md-p', key: ti }, '• ' + t.title + '  [' + t.meetingTitle + ']'))))) : null,
    React.createElement('div', { className: 'md-h2' }, '全部会议待办'),
    React.createElement(GroupedList, {
      items: byMeeting.filter((m) => m.todos.length > 0),
      defaultOpenFirst: 1,
      renderItem: (m, mi) => React.createElement('div', { key: mi, style: { border: '1px solid var(--dsw-border,#eee)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, marginLeft: 8 } },
        React.createElement('div', { className: 'md-p', style: { fontWeight: 600 } }, m.meetingTitle + (m.meetingTime ? ' (' + fmtDate(m.meetingTime) + ')' : '')),
        m.todos.map((t, ti) => React.createElement('div', { className: 'md-todo', key: ti }, '• ' + t.title + (t.stale ? ' ⚠逾期' : ''))))
    }))
}

function Dashboard() {
  const STORE = 'mbdg-state'
  const [tab, setTab] = React.useState('week')
  const [selected, setSelected] = React.useState(null)
  const [overview, setOverview] = React.useState(null)
  const [allM, setAllM] = React.useState(null)
  const [todos, setTodos] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [query, setQuery] = React.useState('')
  const [answer, setAnswer] = React.useState('')
  const [searchHits, setSearchHits] = React.useState([])
  const [asking, setAsking] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const [sync, setSync] = React.useState(null)
  const [syncing, setSyncing] = React.useState(false)
  React.useEffect(() => { try { const saved = sessionStorage.getItem(STORE); if (saved) { const s = JSON.parse(saved); if (s.tab) setTab(s.tab); if (s.selected) setSelected(s.selected) } } catch (e) {} }, [])
  React.useEffect(() => { try { sessionStorage.setItem(STORE, JSON.stringify({ tab, selected })) } catch (e) {} }, [tab, selected])
  const loadAll = React.useCallback(() => {
    api('/api/overview').then((r) => r && r.error ? setError(r.error) : setOverview(r)).catch((e) => setError('后端未启动？' + String(e && e.message || e)))
    api('/api/meetings').then((r) => { if (!(r && r.error)) setAllM(r) }).catch(() => {})
    api('/api/todos').then((r) => { if (!(r && r.error)) setTodos(r) }).catch(() => {})
  }, [])
  React.useEffect(() => { loadAll() }, [])
  const doSync = () => {
    if (syncing) return
    setSyncing(true)
    api('/api/sync', {}).then((r) => { setSync(r); loadAll() }).catch((e) => setSync({ message: '同步失败: ' + String(e && e.message || e) })).finally(() => setSyncing(false))
  }
  const doAsk = () => {
    if (!query.trim() || asking) return
    setAsking(true); setAnswer('检索中…')
    api('/api/ask', { query: query.trim() }).then((r) => {
      if (r && r.error) { setAnswer('错误: ' + r.error); setSearchHits([]) }
      else { setAnswer(r && r.answer || ''); setSearchHits((r && r.hits) || []); setTab('search') }
    }).catch((e) => { setAnswer('错误: ' + String(e && e.message || e)); setSearchHits([]) }).finally(() => setAsking(false))
  }
  if (error) return React.createElement('div', { className: 'mbdg-empty' }, '加载失败: ' + error)
  if (!overview) return React.createElement('div', { className: 'mbdg-empty' }, '加载中…')
  const stats = overview.stats || {}
  const thisWeek = overview.thisWeek || []
  const allMeetings = allM || []
  const kw = filter.trim().toLowerCase()
  const filtered = kw ? allMeetings.filter((m) => String(m.title).toLowerCase().includes(kw)) : allMeetings
  const weekFiltered = kw ? thisWeek.filter((m) => String(m.title).toLowerCase().includes(kw)) : thisWeek
  const renderMeetingItem = (g, i) => {
    const uuid = g.taskUuid || (g.taskUuids && g.taskUuids[0]) || null
    const title = g.title || ''
    const time = g.time
    const actions = g.actions || []
    const actCount = actions.length || (g.actionCount || 0)
    return React.createElement('div', { className: 'mbdg-item' + (selected === uuid ? ' sel' : ''), key: (g.key || '') + '-' + i, onClick: () => uuid && setSelected(uuid) },
      React.createElement('div', { className: 't' }, title),
      React.createElement('div', { className: 'meta' }, fmtTime(time) + (actCount ? (' · 待办' + actCount) : '')),
      actions.length === 0 ? null : actions.slice(0, 2).map((a, j) => React.createElement('div', { className: 'todo', key: j }, '• ' + a.title)))
  }
  return React.createElement('div', { className: 'mbdg-root' },
    React.createElement('div', null,
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        React.createElement('div', null,
          React.createElement('h2', { className: 'mbdg-h' }, '会议驾驶舱'),
          React.createElement('p', { className: 'mbdg-sub' }, overview.week ? ('本周窗口 ' + overview.week.label) : '')),
        React.createElement('div', { className: 'mbdg-syncbar' },
          React.createElement('span', null, '后端: ' + API() + ' · 本地数据'),
          React.createElement('button', { className: 'mbdg-syncbtn', onClick: doSync, disabled: syncing }, syncing ? '同步中…' : '立即同步'))),
      sync && sync.message ? React.createElement('div', { className: 'mbdg-sub', style: { marginTop: 4 } }, sync.message) : null),
    React.createElement('div', { className: 'mbdg-cards' },
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v' }, String(stats.meetings || 0)), React.createElement('div', { className: 'k' }, '累计会议')),
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v' }, String(thisWeek.length)), React.createElement('div', { className: 'k' }, '本周会议')),
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v' }, String(stats.actions || 0)), React.createElement('div', { className: 'k' }, '待办总数')),
      React.createElement('div', { className: 'mbdg-card' }, React.createElement('div', { className: 'v' }, String(stats.openActions || 0)), React.createElement('div', { className: 'k' }, '未完成待办'))),
    React.createElement('div', { className: 'mbdg-search' },
      React.createElement('input', { className: 'mbdg-input', placeholder: '问一个问题，如：孟底沟项目有什么待办？', value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') doAsk() } }),
      React.createElement('button', { className: 'mbdg-btn', onClick: doAsk, disabled: asking }, asking ? '检索中…' : '检索')),
    React.createElement('div', { className: 'mbdg-tabs' },
      answer ? React.createElement('div', { className: 'mbdg-tab' + (tab === 'search' ? ' on' : ''), onClick: () => setTab('search') }, '检索结果') : null,
      React.createElement('div', { className: 'mbdg-tab' + (tab === 'week' ? ' on' : ''), onClick: () => setTab('week') }, '本周'),
      React.createElement('div', { className: 'mbdg-tab' + (tab === 'all' ? ' on' : ''), onClick: () => setTab('all') }, '全部会议 (' + allMeetings.length + ')'),
      React.createElement('div', { className: 'mbdg-tab' + (tab === 'todos' ? ' on' : ''), onClick: () => setTab('todos') }, '待办闭环')),
    tab === 'todos'
      ? React.createElement(TodoBoard, { data: todos })
      : React.createElement('div', { className: 'mbdg-layout' },
          tab === 'search'
            ? React.createElement('div', { className: 'mbdg-list', style: { padding: 12 } },
                React.createElement('div', { className: 'mbdg-ans', style: { marginTop: 0 } },
                  React.createElement(Md, { text: answer, linkMap: searchHits.reduce((m, h) => { if (h.title) m[h.title] = h.taskUuid; return m }, {}), onMeetingClick: (uuid) => uuid && setSelected(uuid) })))
            : React.createElement('div', { className: 'mbdg-list' },
                tab === 'all'
                  ? React.createElement('div', null,
                      React.createElement('div', { className: 'mbdg-search', style: { marginTop: 0, marginBottom: 8 } },
                        React.createElement('input', { className: 'mbdg-input', placeholder: '按标题过滤会议…', value: filter, onChange: (e) => setFilter(e.target.value) })),
                      filtered.length === 0 ? React.createElement('div', { className: 'mbdg-empty' }, '无匹配会议')
                        : React.createElement(GroupedList, { items: filtered, defaultOpenFirst: 2, renderItem: renderMeetingItem }))
                  : (weekFiltered.length === 0 ? React.createElement('div', { className: 'mbdg-empty' }, '本周暂无会议')
                    : React.createElement(GroupedList, { items: weekFiltered, defaultOpenFirst: 1, renderItem: renderMeetingItem }))),
          React.createElement('div', { className: 'mbdg-detail' },
            selected ? React.createElement(MeetingDetail, { uuid: selected }) : React.createElement('div', { className: 'mbdg-empty' }, '点击左侧会议查看详情'))))
}
