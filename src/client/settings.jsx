import React, { useEffect, useRef, useState } from 'react'
import { api, fallbackCopy } from './api.js'
import { LLM_PRESETS, MEETING_TYPES, fmtDateTime, lastSyncLabel, syncProgressLabel } from './format.js'
import { ConfirmSheet } from './ui.jsx'

const GLOSSARY_TABS = [
  { id: 'people', label: '人', add: '+ 人', namePh: '正式姓名', aliasPh: '勇哥、林哥' },
  { id: 'projects', label: '项目', add: '+ 项目', namePh: '正式项目名', aliasPh: '简称、口述', codePh: '编号，可空' },
  { id: 'departments', label: '部门', add: '+ 部门', namePh: '部门名称', aliasPh: '简称、口述', codePh: '部门编号' },
  { id: 'terms', label: '用语', add: '+ 用语', namePh: '标准写法', aliasPh: '听错、近音' },
]

function splitAliases(v) {
  return String(v || '').split(/[、，,;；/|]+/).map((s) => s.trim()).filter(Boolean)
}

function newClassifyRule() {
  return { id: 'r-' + Date.now().toString(36), type: '项目', title: '', people: '', record: '', tags: '' }
}

function sharedAliasSet(rows) {
  const map = new Map()
  for (const r of rows || []) {
    const name = String(r.name || '').trim().toLowerCase()
    for (const a of splitAliases(r.aliases)) {
      const k = a.toLowerCase()
      if (!map.has(k)) map.set(k, new Set())
      if (name) map.get(k).add(name)
    }
  }
  const shared = new Set()
  for (const [k, names] of map) {
    if (names.size > 1) shared.add(k)
  }
  return shared
}

function foldText(s) {
  return String(s || '').trim().toLowerCase()
}

function deptRank(p) {
  if (p && p.primary) return [0, 0]
  if (p && p.pin != null) return [1, p.pin]
  if (p && p.member) return [2, 0]
  return [3, 0]
}

function reindexPins(rows) {
  const pins = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.code && r.pin != null && !r.primary)
    .sort((a, b) => a.r.pin - b.r.pin || a.i - b.i)
  const pinAt = new Map(pins.map(({ i }, n) => [i, n]))
  return rows.map((r, i) => {
    if (pinAt.has(i)) return { ...r, pin: pinAt.get(i) }
    return r.pin == null ? r : { ...r, pin: null }
  })
}

function rowMatchesQuery(row, q) {
  if (!q) return true
  const hay = [row && row.name, row && row.code, row && row.aliases].map(foldText).join(' ')
  if (!hay.trim()) return true
  return hay.includes(q)
}

export function SettingsPage(props) {
  const toast = props.toast
  const [tab, setTab] = useState(() => {
    try { return sessionStorage.getItem('ma-settings-tab') || 'people' } catch { return 'people' }
  })
  const [st, setSt] = useState(null)
  const [err, setErr] = useState(null)
  const [people, setPeople] = useState([])
  const [projects, setProjects] = useState([])
  const [departments, setDepartments] = useState([])
  const [terms, setTerms] = useState([])
  const [glossaryKind, setGlossaryKind] = useState(() => {
    try { return sessionStorage.getItem('ma-glossary-kind') || 'people' } catch { return 'people' }
  })
  const [llm, setLlm] = useState({ preset: 'deepseek', baseUrl: '', model: '', apiKey: '' })
  const [testing, setTesting] = useState('')
  const [testMsg, setTestMsg] = useState('')
  const [logs, setLogs] = useState([])
  const [mcpBusy, setMcpBusy] = useState(false)
  const [writebackBusy, setWritebackBusy] = useState(false)
  const [classifyBusy, setClassifyBusy] = useState(false)
  const [classify, setClassify] = useState({ projectFromGlossary: true, deptFromGlossary: true, rules: [] })
  const [confirmClassify, setConfirmClassify] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [confirmFull, setConfirmFull] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncSt, setSyncSt] = useState(null)
  const waitSync = useRef(false)
  const syncStartedAt = useRef(0)
  const projectFileRef = useRef(null)
  const zipFileRef = useRef(null)
  const [importBusy, setImportBusy] = useState(false)
  const [ht, setHt] = useState({ url: '', apiKey: '' })
  const [htMsg, setHtMsg] = useState('')
  const [glossaryQuery, setGlossaryQuery] = useState('')
  const appUp = props.appUp
  const [verBusy, setVerBusy] = useState(false)
  const [verErr, setVerErr] = useState('')
  useEffect(() => {
    try { sessionStorage.setItem('ma-settings-tab', tab) } catch { /* ignore */ }
  }, [tab])
  useEffect(() => {
    try { sessionStorage.setItem('ma-glossary-kind', glossaryKind) } catch { /* ignore */ }
  }, [glossaryKind])
  useEffect(() => {
    if (tab !== 'ver' || appUp || !props.onCheckUpdate) return undefined
    setVerBusy(true)
    setVerErr('')
    props.onCheckUpdate(false).catch((er) => setVerErr(String(er && er.message || er))).finally(() => setVerBusy(false))
  }, [tab])
  const checkVersion = (fresh) => {
    if (verBusy || !props.onCheckUpdate) return
    setVerBusy(true)
    setVerErr('')
    props.onCheckUpdate(fresh).then((r) => {
      toast((r && r.message) || (fresh ? '已检查' : ''))
    }).catch((er) => {
      const msg = String(er && er.message || er)
      setVerErr(msg)
      toast(msg)
    }).finally(() => setVerBusy(false))
  }
  const apply = (r) => {
    setSt(r)
    setPeople(r.people || [])
    setProjects((r.projects || []).map((p) => ({ name: p.name || '', aliases: p.aliases || '', code: p.code || '', synced: !!p.synced })))
    setDepartments((r.departments || []).map((p) => ({
      name: p.name || '',
      aliases: p.aliases || '',
      code: p.code || '',
      synced: !!p.synced,
      primary: !!p.primary,
      pin: Number.isInteger(p.pin) ? p.pin : null,
      member: !!p.member,
    })))
    setTerms(r.terms || [])
    const L = r.llm || {}
    setLlm({ preset: L.preset || 'deepseek', baseUrl: L.baseUrl || '', model: L.model || '', apiKey: '' })
    const H = r.ht || {}
    setHt({ url: H.url || '', apiKey: '' })
    const C = r.classify || {}
    setClassify({
      projectFromGlossary: C.projectFromGlossary !== false,
      deptFromGlossary: C.deptFromGlossary !== false,
      rules: Array.isArray(C.rules) ? C.rules : [],
    })
  }
  useEffect(() => {
    api('/api/settings').then(apply).catch((er) => setErr(String(er && er.message || er)))
    api('/api/logs?limit=200').then((r) => setLogs(r.items || [])).catch(() => {})
    api('/api/sync-status').then(setSyncSt).catch(() => {})
  }, [])
  useEffect(() => {
    if (tab !== 'logs' && tab !== 'sync' && !syncBusy) return undefined
    const load = () => {
      if (tab === 'logs') api('/api/logs?limit=200').then((r) => setLogs(r.items || [])).catch(() => {})
      api('/api/sync-status?meta=1').then((r) => {
        setSyncSt((prev) => ({
          ...(r || {}),
          sources: (r && r.sources && Object.keys(r.sources).length) ? r.sources : ((prev && prev.sources) || {}),
          dws: (r && r.dws) || (prev && prev.dws),
        }))
        if (!waitSync.current || !r || r.syncing) return
        const lastAt = (r.last && r.last.at) || 0
        if (lastAt < syncStartedAt.current) return
        waitSync.current = false
        setSyncBusy(false)
        if (r.last && r.last.message) toast(r.last.message)
      }).catch(() => {})
    }
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [tab, syncBusy, toast])
  const setKindRows = (kind, next) => {
    if (kind === 'people') setPeople(next)
    else if (kind === 'projects') setProjects(next)
    else if (kind === 'departments') setDepartments(next)
    else setTerms(next)
  }
  const persistKind = (kind, next) => {
    setKindRows(kind, next)
    return api('/api/settings', { [kind]: next }).then((r) => {
      setSt(r)
      setKindRows(kind, r[kind] || [])
      return r
    }).catch((er) => {
      toast(String(er && er.message || er)); throw er
    })
  }
  const importProjectCsv = (file) => {
    if (!file || importBusy) return
    setImportBusy(true)
    const reader = new FileReader()
    reader.onload = () => {
      api('/api/settings/projects-import', { csv: String(reader.result || '') }).then((r) => {
        apply(r)
        const im = r.import || {}
        const parts = []
        if (im.added) parts.push('新增 ' + im.added)
        if (im.updated) parts.push('更新 ' + im.updated)
        if (im.skipped) parts.push('跳过 ' + im.skipped)
        toast(parts.length ? ('已导入 · ' + parts.join('，')) : '没有新项目')
      }).catch((er) => toast(String(er && er.message || er))).finally(() => setImportBusy(false))
    }
    reader.onerror = () => { toast('读不了这个文件'); setImportBusy(false) }
    reader.readAsText(file, 'UTF-8')
  }
  const doFullSync = () => {
    if (syncBusy) return
    setSyncBusy(true)
    setConfirmFull(false)
    waitSync.current = true
    syncStartedAt.current = Date.now()
    api('/api/sync', { full: true }).then((r) => {
      toast(r.message || '开始全量同步')
      setSyncSt((prev) => ({ ...(prev || {}), syncing: true }))
    }).catch((er) => {
      waitSync.current = false
      toast(String(er && er.message || er))
      setSyncBusy(false)
    })
  }
  const saveLlm = () => {
    const body = { preset: llm.preset, baseUrl: llm.baseUrl, model: llm.model }
    if (llm.apiKey.trim()) body.apiKey = llm.apiKey.trim()
    api('/api/settings', { llm: body }).then((r) => { apply(r); toast('已保存') }).catch((er) => toast(String(er && er.message || er)))
  }
  const saveHt = () => {
    const body = { url: ht.url }
    if (ht.apiKey.trim()) body.apiKey = ht.apiKey.trim()
    api('/api/settings', { ht: body }).then((r) => {
      apply(r)
      toast('已保存')
      try { window.dispatchEvent(new Event('ma-identity')) } catch { /* ignore */ }
    }).catch((er) => toast(String(er && er.message || er)))
  }
  const testHt = () => {
    setTesting('ht'); setHtMsg('')
    Promise.all([
      api('/api/settings/ht-test', {}),
      api('/api/identity').catch((er) => ({ error: String(er && er.message || er) })),
    ]).then(([r, id]) => {
      if (!r.ok) { setHtMsg(r.error || '不通'); return }
      const bits = []
      if (id && id.name) bits.push(id.name)
      else if (r.caller) bits.push(r.caller)
      bits.push('见到 ' + (r.count || 0) + ' 个项目')
      if (id && id.error) bits.push(id.error)
      setHtMsg('可用 · ' + bits.join(' · '))
      if (id && id.name) {
        try { window.dispatchEvent(new Event('ma-identity')) } catch { /* ignore */ }
      }
    }).catch((er) => setHtMsg(String(er && er.message || er))).finally(() => setTesting(''))
  }
  const saveDeptOrder = (next) => {
    setDepartments(next)
    const primary = next.find((r) => r.primary && r.code)
    const pinnedIds = next
      .filter((r) => r.code && r.pin != null && !r.primary)
      .sort((a, b) => a.pin - b.pin)
      .map((r) => r.code)
    api('/api/settings', {
      departmentPrefs: {
        primaryId: primary ? primary.code : '',
        primaryTouched: true,
        pinnedIds,
      },
    }).then(apply).catch((er) => toast(String(er && er.message || er)))
  }
  const togglePrimary = (i) => {
    const row = departments[i]
    if (!row || !String(row.code || '').trim()) { toast('先填写部门编号'); return }
    const on = !row.primary
    const next = departments.map((r, j) => {
      if (j === i) return { ...r, primary: on, pin: on ? null : r.pin }
      if (on && r.primary) return { ...r, primary: false }
      return r
    })
    saveDeptOrder(reindexPins(next))
  }
  const togglePin = (i) => {
    const row = departments[i]
    if (!row || !String(row.code || '').trim() || row.primary) return
    const next = departments.slice()
    if (row.pin != null) next[i] = { ...row, pin: null }
    else {
      const max = departments.reduce((m, r) => (r.pin != null ? Math.max(m, r.pin) : m), -1)
      next[i] = { ...row, pin: max + 1 }
    }
    saveDeptOrder(reindexPins(next))
  }
  const movePin = (i, dir) => {
    const pins = departments
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => r.pin != null && !r.primary)
      .sort((a, b) => a.r.pin - b.r.pin)
    const pos = pins.findIndex(({ idx }) => idx === i)
    const swap = pos + dir
    if (pos < 0 || swap < 0 || swap >= pins.length) return
    const next = departments.slice()
    const a = pins[pos]
    const b = pins[swap]
    next[a.idx] = { ...a.r, pin: b.r.pin }
    next[b.idx] = { ...b.r, pin: a.r.pin }
    saveDeptOrder(reindexPins(next))
  }
  const syncDepartments = () => {
    setTesting('dept-sync'); setHtMsg('')
    api('/api/settings/departments-sync', {}).then((r) => {
      apply(r)
      const im = r.import || {}
      const who = r.name ? (r.name + ' · ') : ''
      const parts = []
      if (im.matched != null) parts.push('部门 ' + im.matched)
      if (im.added) parts.push('新增 ' + im.added)
      if (im.updated) parts.push('更新 ' + im.updated)
      if (im.skipped) parts.push('未变 ' + im.skipped)
      const text = who + (parts.length ? ('已同步 · ' + parts.join('，')) : '没有新部门')
      setHtMsg(text)
      toast(text)
      try { window.dispatchEvent(new Event('ma-identity')) } catch { /* ignore */ }
    }).catch((er) => {
      const msg = String(er && er.message || er)
      setHtMsg(msg)
      toast(msg)
    }).finally(() => setTesting(''))
  }
  const syncHtProjects = () => {
    setTesting('ht-sync'); setHtMsg('')
    api('/api/settings/projects-sync', {}).then((r) => {
      apply(r)
      const im = r.import || {}
      const parts = []
      if (im.matched != null) parts.push('命中 ' + im.matched)
      if (im.added) parts.push('新增 ' + im.added)
      if (im.updated) parts.push('更新 ' + im.updated)
      if (im.skipped) parts.push('跳过 ' + im.skipped)
      const text = parts.length ? ('已同步 · ' + parts.join('，')) : '没有新项目'
      setHtMsg(text)
      toast(text)
    }).catch((er) => setHtMsg(String(er && er.message || er))).finally(() => setTesting(''))
  }
  const setRule = (i, patch) => {
    const n = classify.rules.slice()
    n[i] = { ...n[i], ...patch }
    setClassify({ ...classify, rules: n })
  }
  const saveClassify = () => {
    api('/api/settings', { classify }).then((r) => { apply(r); toast('已保存') }).catch((er) => toast(String(er && er.message || er)))
  }
  const runClassifyAll = () => {
    if (classifyBusy) return
    setClassifyBusy(true)
    api('/api/classify', { all: true }).then((r) => {
      setConfirmClassify(false)
      toast(r.updated ? ('已填写 ' + r.updated + ' 场') : '没有场次被规则命中')
    }).catch((er) => toast(String(er && er.message || er))).finally(() => setClassifyBusy(false))
  }
  const setWriteback = (enabled) => {
    if (writebackBusy) return
    setWritebackBusy(true)
    api('/api/settings', { writeback: { enabled } }).then((r) => {
      apply(r)
      toast(enabled ? '写回已打开' : '写回已关闭')
    }).catch((er) => toast(String(er && er.message || er))).finally(() => setWritebackBusy(false))
  }
  const setMcp = (body) => {
    if (mcpBusy) return
    setMcpBusy(true)
    api('/api/settings', { mcp: body }).then((r) => {
      apply(r)
      toast(body.rotateToken ? '已换密钥' : (body.enabled ? 'MCP 已打开' : 'MCP 已关闭'))
    }).catch((er) => toast(String(er && er.message || er))).finally(() => setMcpBusy(false))
  }
  const copyMcp = (text) => {
    const w = typeof window !== 'undefined' ? window : globalThis
    const done = () => toast('已复制，贴到智能体的 MCP 配置里')
    if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(w, text); done() })
    } else {
      fallbackCopy(w, text); done()
    }
  }
  const pickPreset = (id) => {
    const p = LLM_PRESETS.find((x) => x.id === id)
    setLlm({
      ...llm,
      preset: id,
      baseUrl: p.baseUrl || llm.baseUrl,
      model: id === 'custom' ? llm.model : (p.model || llm.model),
    })
  }
  if (err) return <div className="page"><p className="empty">{err}</p></div>
  if (!st) return <div className="page"><p className="empty">加载中…</p></div>
  const llmHint = st.llm && st.llm.envLocked
    ? '当前由环境变量覆盖设置页。'
    : (st.llm && st.llm.source === 'dsh' ? '密钥仍来自本机 DSH 凭据，保存后改用设置。' : '')
  const lists = { people, projects, departments, terms }
  const kindMeta = GLOSSARY_TABS.find((x) => x.id === glossaryKind) || GLOSSARY_TABS[0]
  const hasCode = kindMeta.id === 'projects' || kindMeta.id === 'departments'
  const kindRows = lists[kindMeta.id] || []
  const shared = sharedAliasSet(kindRows)
  const filterQ = foldText(glossaryQuery)
  const visibleRows = kindRows.map((p, i) => ({ p, i })).filter(({ p }) => rowMatchesQuery(p, filterQ))
  const shownRows = kindMeta.id === 'departments'
    ? visibleRows.slice().sort((a, b) => {
      const ra = deptRank(a.p)
      const rb = deptRank(b.p)
      if (ra[0] !== rb[0]) return ra[0] - rb[0]
      if (ra[1] !== rb[1]) return ra[1] - rb[1]
      return String(a.p.name || '').localeCompare(String(b.p.name || ''), 'zh')
    })
    : visibleRows
  const pinnedSpots = departments
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => r.pin != null && !r.primary)
    .sort((a, b) => a.r.pin - b.r.pin)
  const peoplePane = (
    <div className={'page-inner' + (hasCode ? ' wide' : '')}>
      <h1>称呼</h1>
      <p className="lede">{glossaryKind === 'projects' ? '正式名用于上传和检索。可从外部系统同步你可见的项目，或导入项目清单 CSV。同步来的名称和编号不能改，别名可以改。' : (glossaryKind === 'departments' ? '部门名称和编号用于归类。主部门排第一，常用部门按你的顺序排在后面。同步来的名称和编号不能改，别名可以改。' : '总结时把口语、简称和听错落到正式写法。')}</p>
      <div className="filters">
        {GLOSSARY_TABS.map((x) => (
          <button
            key={x.id}
            className={glossaryKind === x.id ? 'on' : ''}
            onClick={() => {
              setGlossaryKind(x.id)
              setGlossaryQuery('')
            }}
          >{x.label}</button>
        ))}
      </div>
      {kindRows.length
        ? (
          <>
            <div className="glossary-toolbar">
              <input
                type="text"
                placeholder={hasCode ? '按名称、编号、别名筛选' : '按名称、别名筛选'}
                value={glossaryQuery}
                onChange={(ev) => setGlossaryQuery(ev.target.value)}
              />
              <span className="n">{filterQ && visibleRows.length !== kindRows.length ? ('显示 ' + visibleRows.length + ' / ' + kindRows.length) : ('共 ' + kindRows.length + ' 个')}</span>
            </div>
            <div className="glossary-list">
              <div className={'person person-head' + (hasCode ? ' has-code' : '') + (kindMeta.id === 'departments' ? ' has-dept' : '')}>
                <span>名称</span>
                {hasCode ? <span>编号</span> : null}
                <span>别名</span>
                {kindMeta.id === 'departments' ? <span>排序</span> : null}
                <span />
              </div>
              {shownRows.length
                ? shownRows.map(({ p, i }) => {
                  const dup = splitAliases(p.aliases).some((a) => shared.has(a.toLowerCase()))
                  const pinPos = pinnedSpots.findIndex(({ idx }) => idx === i)
                  const locked = !!p.synced && (kindMeta.id === 'projects' || kindMeta.id === 'departments')
                  return (
                    <div className={'person' + (hasCode ? ' has-code' : '') + (kindMeta.id === 'departments' ? ' has-dept' : '')} key={kindMeta.id + '-' + i}>
                      <input
                        type="text"
                        placeholder={kindMeta.namePh}
                        value={p.name}
                        readOnly={locked}
                        title={locked ? '来自外部系统，不能改' : undefined}
                        onChange={(ev) => {
                          if (locked) return
                          const n = kindRows.slice(); n[i] = { ...n[i], name: ev.target.value }; setKindRows(kindMeta.id, n)
                        }}
                      />
                      {hasCode
                        ? (
                          <input
                            type="text"
                            placeholder={kindMeta.codePh}
                            value={p.code || ''}
                            readOnly={locked}
                            title={locked ? '来自外部系统，不能改' : undefined}
                            onChange={(ev) => {
                              if (locked) return
                              const n = kindRows.slice(); n[i] = { ...n[i], code: ev.target.value }; setKindRows(kindMeta.id, n)
                            }}
                          />
                        )
                        : null}
                      <div className="alias-cell">
                        <input
                          type="text"
                          placeholder={kindMeta.aliasPh}
                          value={p.aliases}
                          onChange={(ev) => {
                            const n = kindRows.slice(); n[i] = { ...n[i], aliases: ev.target.value }; setKindRows(kindMeta.id, n)
                          }}
                        />
                        {dup ? <span className="dup">不唯一</span> : null}
                      </div>
                      {kindMeta.id === 'departments'
                        ? (
                          <div className="dept-rank">
                            <button type="button" className={p.primary ? 'on' : ''} disabled={!p.code} onClick={() => togglePrimary(i)}>主</button>
                            <button type="button" className={p.pin != null ? 'on' : ''} disabled={!p.code || p.primary} onClick={() => togglePin(i)}>常用</button>
                            <button type="button" disabled={pinPos <= 0} onClick={() => movePin(i, -1)}>上移</button>
                            <button type="button" disabled={pinPos < 0 || pinPos === pinnedSpots.length - 1} onClick={() => movePin(i, 1)}>下移</button>
                          </div>
                        )
                        : null}
                      {locked
                        ? null
                        : <button className="quiet" onClick={() => persistKind(kindMeta.id, kindRows.filter((_, j) => j !== i))}>删除</button>}
                    </div>
                  )
                })
                : <p className="empty">没有匹配「{glossaryQuery.trim()}」</p>}
            </div>
          </>
        )
        : <p className="empty">还没有。加一行即可。</p>}
      <button
        className="quiet"
        onClick={() => {
          setGlossaryQuery('')
          setKindRows(kindMeta.id, kindRows.concat([{ name: '', aliases: '', code: '' }]))
        }}
      >{kindMeta.add}</button>
      <button className="primary" style={{ marginLeft: 8 }} onClick={() => persistKind(kindMeta.id, kindRows).then(() => toast('已保存')).catch(() => {})}>保存</button>
      {kindMeta.id === 'projects'
        ? (
          <div className="block" style={{ marginTop: 28 }}>
            <h3>导入清单</h3>
            <p className="lede">CSV 需有「项目编号」「项目名称」列。已有项目按编号或名称合并，本地别名保留。</p>
            <input
              ref={projectFileRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(ev) => {
                const f = ev.target.files && ev.target.files[0]
                ev.target.value = ''
                if (f) importProjectCsv(f)
              }}
            />
            <button className="quiet" disabled={importBusy} onClick={() => projectFileRef.current && projectFileRef.current.click()}>{importBusy ? '导入中…' : '导入清单'}</button>
            <a className="quiet" href="/项目清单模板.csv" download="项目清单模板.csv">下载模板</a>
          </div>
        )
        : null}
      {kindMeta.id === 'departments'
        ? (
          <div className="block" style={{ marginTop: 28 }}>
            <h3>从外部系统同步</h3>
            <p className="lede">读取当前令牌可写入的业务部门。已有部门按编号或名称合并，别名、主部门和常用顺序都保留。还没设过主部门时，用身份接口里的主部门。令牌需勾选「读取本人身份与业务部门」。</p>
            <button className="quiet" disabled={testing === 'dept-sync'} onClick={syncDepartments}>{testing === 'dept-sync' ? '同步中…' : '同步部门'}</button>
            {htMsg && tab === 'people' && glossaryKind === 'departments' ? <p className="status">{htMsg}</p> : null}
          </div>
        )
        : null}
      <p className="status" style={{ marginTop: 28 }}>总结用默认提炼规则。</p>
    </div>
  )
  const llmPane = (
    <div className="page-inner">
      <h1>大模型</h1>
      <p className="lede">问会议、生成总结时用。相关片段会发到这里。</p>
      {llmHint ? <p className="hint">{llmHint}</p> : null}
      <div className="filters">
        {LLM_PRESETS.map((p) => (
          <button key={p.id} className={llm.preset === p.id ? 'on' : ''} onClick={() => pickPreset(p.id)}>{p.label}</button>
        ))}
      </div>
      <div className="field"><span>地址</span><input type="text" placeholder="接口地址" value={llm.baseUrl} onChange={(ev) => setLlm({ ...llm, baseUrl: ev.target.value })} /></div>
      <div className="field"><span>模型名</span><input type="text" placeholder="如 deepseek-chat" value={llm.model} onChange={(ev) => setLlm({ ...llm, model: ev.target.value })} /></div>
      <div className="field">
        <span>密钥</span>
        <input
          type="password"
          placeholder={st.llm && st.llm.keySet ? '已保存' : '公司或个人提供'}
          value={llm.apiKey}
          onChange={(ev) => setLlm({ ...llm, apiKey: ev.target.value })}
        />
      </div>
      <button className="primary" onClick={saveLlm}>保存</button>
      <button className="quiet" disabled={testing === 'llm'} onClick={() => {
        setTesting('llm'); setTestMsg('')
        api('/api/settings/llm-test', {}).then((r) => {
          setTestMsg(r.ok ? ('可用 · ' + (r.model || '') + (r.reply ? ' · ' + r.reply : '')) : (r.error || '不通'))
        }).catch((er) => setTestMsg(String(er && er.message || er))).finally(() => setTesting(''))
      }}>{testing === 'llm' ? '在测…' : '测一下'}</button>
      {testMsg && tab === 'llm' ? <p className="status">{testMsg}</p> : null}
    </div>
  )
  const kbPane = (
    <div className="page-inner">
      <h1>上传</h1>
      <p className="lede">详情里点上传，会用「外部系统」里的公司数智系统令牌，把总结交给瀚小智知识库网关。不再直连 RAGFlow，也不填 Dataset ID。</p>
      <p className="hint">公司管理 → company-management；公司运营 → company-operations；项目 → project（必须有项目编号）；部门 → department-management（必须有部门编号）。个人会不上传。</p>
      <p className="hint">点上传即确认归档。测一下会区分可归档和仅可读；没有归档权限的库传不上去。</p>
      {st && st.kb && st.kb.configured
        ? <p className="hint">已接上外部系统令牌。</p>
        : <p className="hint">先到「外部系统」填地址和令牌。</p>}
      <button className="quiet" disabled={testing === 'kb'} onClick={() => {
        setTesting('kb'); setTestMsg('')
        api('/api/settings/kb-test', {}).then((r) => {
          setTestMsg(r.ok ? ('可用 · ' + (r.detail || r.knowledgeBaseCode || '知识库网关')) : (r.error || '不通'))
        }).catch((er) => setTestMsg(String(er && er.message || er))).finally(() => setTesting(''))
      }}>{testing === 'kb' ? '在测…' : '测一下'}</button>
      {testMsg && tab === 'kb' ? <p className="status">{testMsg}</p> : null}
    </div>
  )
  const extPane = (
    <div className="page-inner">
      <h1>外部系统</h1>
      <p className="lede">接公司数智系统：同步你有权看的项目和可写入的部门，并把会议归档到知识库网关。地址和令牌只存在本机。配好令牌后，顶栏右侧会显示这个令牌对应的姓名。</p>
      <div className="block">
        <h3>公司数智系统</h3>
        <p className="lede">令牌在数智系统「个人中心 · 第三方应用接入」创建。同步项目会拉全部有效项目。同步部门需要令牌勾选「读取本人身份与业务部门」。本地别名都保留。</p>
        {st.ht && st.ht.envLocked ? <p className="hint">当前由环境变量覆盖设置页。</p> : null}
        <div className="field"><span>地址</span><input type="text" placeholder="数智系统地址，问同事要" value={ht.url} onChange={(ev) => setHt({ ...ht, url: ev.target.value })} /></div>
        <div className="field">
          <span>令牌</span>
          <input
            type="password"
            placeholder={st.ht && st.ht.keySet ? '已保存' : 'htdc_pat_…'}
            value={ht.apiKey}
            onChange={(ev) => setHt({ ...ht, apiKey: ev.target.value })}
          />
        </div>
        <button className="primary" onClick={saveHt}>保存</button>
        <button className="quiet" disabled={testing === 'ht'} onClick={testHt}>{testing === 'ht' ? '在测…' : '测一下'}</button>
        <button className="quiet" disabled={testing === 'ht-sync'} onClick={syncHtProjects}>{testing === 'ht-sync' ? '同步中…' : '同步项目'}</button>
        <button className="quiet" disabled={testing === 'dept-sync'} onClick={syncDepartments}>{testing === 'dept-sync' ? '同步中…' : '同步部门'}</button>
        {htMsg ? <p className="status">{htMsg}</p> : null}
      </div>
    </div>
  )
  const classifyPane = (
    <div className="page-inner">
      <h1>类型规则</h1>
      <p className="lede">新听记入库时，按从上到下第一条命中的规则填写类型和标签。项目会会同时填项目名和编号，部门会会同时填部门名和编号。手改过的类型不覆盖。库里已有的要点「套用到未定场次」。</p>
      <div className="filters">
        <button
          className={classify.projectFromGlossary ? 'on' : ''}
          onClick={() => setClassify({ ...classify, projectFromGlossary: !classify.projectFromGlossary })}
        >词表项目</button>
        <button
          className={classify.deptFromGlossary ? 'on' : ''}
          onClick={() => setClassify({ ...classify, deptFromGlossary: !classify.deptFromGlossary })}
        >词表部门</button>
      </div>
      <p className="hint">{(classify.projectFromGlossary ? '标题或记录命中称呼表里的项目名时，标为「项目」并写上编号。' : '不自动用词表项目名识别。') + (classify.deptFromGlossary ? '没有命中项目时，再按部门名标为「部门」并写上部门编号。' : '不自动用词表部门名识别。') + '规则先于词表。'}</p>
      {(classify.rules || []).map((rule, i) => (
        <div className="rule" key={rule.id || i}>
          <div className="rule-head">
            <span className="n">{i + 1}</span>
            <div className="cat-pills">
              {MEETING_TYPES.map((s) => (
                <button key={s} type="button" className={rule.type === s ? 'on' : ''} onClick={() => setRule(i, { type: s })}>{s}</button>
              ))}
            </div>
            <button className="quiet" disabled={i === 0} onClick={() => {
              const n = classify.rules.slice()
              const t = n[i - 1]; n[i - 1] = n[i]; n[i] = t
              setClassify({ ...classify, rules: n })
            }}>上移</button>
            <button className="quiet" disabled={i === classify.rules.length - 1} onClick={() => {
              const n = classify.rules.slice()
              const t = n[i + 1]; n[i + 1] = n[i]; n[i] = t
              setClassify({ ...classify, rules: n })
            }}>下移</button>
            <button className="quiet" onClick={() => setClassify({ ...classify, rules: classify.rules.filter((_, j) => j !== i) })}>删除</button>
          </div>
          <div className="field"><span>标题含（任一）</span><input type="text" placeholder="周会、管理会" value={rule.title || ''} onChange={(ev) => setRule(i, { title: ev.target.value })} /></div>
          <div className="field"><span>参会人都要有</span><input type="text" placeholder="郑勇、徐林；可用别名" value={rule.people || ''} onChange={(ev) => setRule(i, { people: ev.target.value })} /></div>
          <div className="field"><span>记录含（任一）</span><input type="text" placeholder="纪要里的词" value={rule.record || ''} onChange={(ev) => setRule(i, { record: ev.target.value })} /></div>
          <div className="field"><span>并打标签</span><input type="text" placeholder="项目名或部门，可空" value={rule.tags || ''} onChange={(ev) => setRule(i, { tags: ev.target.value })} /></div>
        </div>
      ))}
      <button className="quiet" onClick={() => setClassify({ ...classify, rules: classify.rules.concat([newClassifyRule()]) })}>+ 规则</button>
      <button className="primary" style={{ marginLeft: 8 }} onClick={saveClassify}>保存</button>
      <button className="quiet" disabled={classifyBusy} onClick={() => setConfirmClassify(true)}>套用规则</button>
      {confirmClassify
        ? (
          <ConfirmSheet
            title="按规则填写类型"
            lede="只改未定的，以及以前由规则填过的。你手选过类型的场次不动。"
            confirmLabel="套用"
            busy={classifyBusy}
            onConfirm={runClassifyAll}
            onClose={() => { if (!classifyBusy) setConfirmClassify(false) }}
          />
        )
        : null}
    </div>
  )
  const mcp = st.mcp || {}
  const mcpPane = (
    <div className="page-inner">
      <h1>MCP</h1>
      <p className="lede">打开后，本机智能体可用会议问答、列表、待办和更新听记。只监听 127.0.0.1。</p>
      <div className="filters">
        <button className={mcp.enabled ? 'on' : ''} disabled={mcpBusy} onClick={() => setMcp({ enabled: true })}>打开</button>
        <button className={!mcp.enabled ? 'on' : ''} disabled={mcpBusy} onClick={() => setMcp({ enabled: false })}>关闭</button>
      </div>
      {mcp.enabled && mcp.snippet
        ? (
          <div>
            <p className="hint">复制下面这一段，贴进智能体的 MCP 配置。</p>
            <pre className="mcp-snip">{mcp.snippet}</pre>
            <button className="primary" onClick={() => copyMcp(mcp.snippet)}>复制</button>
            <button className="quiet" onClick={() => setConfirmRotate(true)}>换密钥</button>
          </div>
        )
        : <p className="hint">先打开，再复制配置。</p>}
      {confirmRotate
        ? (
          <ConfirmSheet
            title="换 MCP 密钥"
            lede="已经配过的智能体要重新贴一段配置。旧密钥立刻失效。"
            confirmLabel="换密钥"
            onConfirm={() => { setConfirmRotate(false); setMcp({ rotateToken: true }) }}
            onClose={() => setConfirmRotate(false)}
          />
        )
        : null}
    </div>
  )
  const pulling = syncBusy || !!(syncSt && syncSt.syncing)
  const writeback = st.writeback || { enabled: true }
  const sourceMap = (syncSt && syncSt.sources) || {}
  const sourceCards = [
    { id: 'dingtalk', label: '钉钉', hint: '扫码登录后拉 AI 听记。可写回标题和记录。', install: 'npm 会随安装脚本装 dws' },
    { id: 'feishu', label: '飞书', hint: '要过两页：先创建应用，再授权妙记。可写回标题和总结。', install: 'npm install -g @larksuite/cli' },
    { id: 'tencent', label: '腾讯会议', hint: '扫码登录后拉录制智能纪要和元宝纪要。只读，不写回。', install: 'npm install -g @tencentcloud/tmeet' },
  ]
  const loginSource = (id) => {
    api('/api/sources/login', { provider: id }).then((r) => {
      toast((r && r.message) || '请完成授权')
    }).catch((er) => toast(String(er && er.message || er)))
  }
  const syncPane = (
    <div className="page-inner">
      <h1>来源</h1>
      <p className="lede">钉钉、飞书、腾讯谁登录了就拉谁。写回只作用于支持改标题/纪要的来源。</p>
      {sourceCards.map((card) => {
        const s = sourceMap[card.id] || {}
        return (
          <div className="block" key={card.id}>
            <h3>{card.label}</h3>
            <p className="lede">{card.hint}</p>
            <p className="status">{
              s.authenticated
                ? ('已登录' + (s.user ? (' · ' + s.user) : ''))
                : (s.error || '未登录')
            }</p>
            {s.authenticated
              ? null
              : <button className="quiet" onClick={() => loginSource(card.id)}>登录</button>}
            {!s.authenticated && /未安装/.test(s.error || '')
              ? <p className="lede">{card.install}</p>
              : null}
          </div>
        )
      })}
      <div className="block">
        <h3>写回来源</h3>
        <p className="lede">打开后，保存标题和「记录」时会尽量写回钉钉或飞书。腾讯会议和导入场次只改本机。待办、逐字稿、本机总结不会写回。</p>
        <div className="filters">
          <button className={writeback.enabled ? 'on' : ''} disabled={writebackBusy} onClick={() => setWriteback(true)}>打开</button>
          <button className={!writeback.enabled ? 'on' : ''} disabled={writebackBusy} onClick={() => setWriteback(false)}>关闭</button>
        </div>
      </div>
      <div className="block">
        <h3>同步</h3>
        <p className="lede">列表「更新」只拉本机还没有的，每个来源最多 300 场。全量会把尚未入库的都拉完，未登录的来源会跳过。</p>
        <p className="status">{
          pulling
            ? (syncProgressLabel(syncSt) || '同步中…页面可继续用')
            : (lastSyncLabel(syncSt) ? ('上次：' + lastSyncLabel(syncSt)) : '还没同步过')
        }</p>
        <button className="primary" disabled={pulling} onClick={() => setConfirmFull(true)}>{pulling ? '同步中…' : '全量同步'}</button>
      {confirmFull
        ? (
          <ConfirmSheet
            title="全量同步"
            lede="从已登录的钉钉、飞书、腾讯把本机还没有的会议都拉下来。已在本机的不覆盖你改过的记录和逐字稿；本机删过的不会再回来。未登录的来源会跳过。"
            confirmLabel="开始全量"
            busy={pulling}
            onConfirm={doFullSync}
            onClose={() => { if (!pulling) setConfirmFull(false) }}
          />
        )
        : null}
      </div>
    </div>
  )
  const verPane = (
    <div className="page-inner">
      <h1>版本</h1>
      <p className="lede">{
        appUp && appUp.channel === 'zip'
          ? '安装包会定期向 GitHub 查最新版，有更新时顶栏出现「有更新」。点更新会下载安装包并重启。听记在本机，不会被覆盖。若仓库是私有的或只发了钉盘，用下面「选用安装包」。'
          : '开发者可从 GitHub 拉最新代码并重启。听记、称呼和密钥在本机，不会被覆盖。有未提交改动时不会自动拉。'
      }</p>
      <div className="field"><span>当前版本</span><input type="text" readOnly value={(appUp && appUp.current) || (verBusy ? '检查中…' : '—')} /></div>
      {!(appUp && appUp.channel === 'zip')
        ? <div className="field"><span>分支</span><input type="text" readOnly value={(appUp && appUp.branch) || '—'} /></div>
        : null}
      {appUp && appUp.available && appUp.latest
        ? <div className="field"><span>远程版本</span><input type="text" readOnly value={appUp.latest} /></div>
        : null}
      {appUp && appUp.subject
        ? <div className="field"><span>最新说明</span><input type="text" readOnly value={appUp.subject} /></div>
        : null}
      <p className="status">{
        verErr
          ? verErr
          : (verBusy
            ? '正在检查…'
            : ((appUp && appUp.message) || '还没检查过')
              + (appUp && appUp.checkedAt ? (' · ' + fmtDateTime(appUp.checkedAt)) : ''))
      }</p>
      {verErr ? <p className="hint">拉完代码后必须重启本机服务，只刷新网页不够。Mac：仓库里执行 bash scripts/restart.sh。Windows：双击 scripts\restart.bat（不要直接双击 .ps1）。</p> : null}
      {appUp && appUp.dirty ? <p className="hint">本机代码有未提交改动，即使有新版本也不会自动覆盖。</p> : null}
      <button className="primary" disabled={verBusy || props.updBusy} onClick={() => checkVersion(true)}>{verBusy ? '检查中…' : '检查更新'}</button>
      {appUp && appUp.available
        ? (
          <button
            className="quiet"
            disabled={props.updBusy || !appUp.canApply}
            onClick={() => props.onRequestApply && props.onRequestApply()}
          >{props.updBusy ? '更新中…' : '更新'}</button>
        )
        : null}
      <input
        ref={zipFileRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(e) => {
          const f = e.target.files && e.target.files[0]
          e.target.value = ''
          if (f && props.onApplyZip) props.onApplyZip(f)
        }}
      />
      <button
        className="quiet"
        disabled={props.updBusy}
        onClick={() => zipFileRef.current && zipFileRef.current.click()}
      >{props.updBusy ? '更新中…' : '选用安装包'}</button>
    </div>
  )
  const logsPane = (
    <div className="page-inner log-pane">
      <h1>运行日志</h1>
      <p className="lede">本机服务、听记更新和 MCP 调用都记在这里。最新在上。</p>
      {logs.length
        ? (
          <div className="log-list">
            {logs.map((x, i) => (
              <div className={'log-row' + (x.level === 'error' ? ' err' : '')} key={x.at + '-' + i}>
                <span className="when">{fmtDateTime(x.at)}</span>
                <span className="src">{x.source}</span>
                <span className="txt">{x.text}</span>
              </div>
            ))}
          </div>
        )
        : <p className="empty">还没有日志。</p>}
    </div>
  )
  const panes = { people: peoplePane, classify: classifyPane, llm: llmPane, kb: kbPane, ext: extPane, mcp: mcpPane, sync: syncPane, ver: verPane, logs: logsPane }
  const glossaryCount = people.length + projects.length + departments.length + terms.length
  const llmStatus = (st.llm && st.llm.model) || (st.llm && st.llm.keySet ? '已配' : '未配置')
  const kbStatus = (st.kb && st.kb.configured) ? '已接' : '未配'
  const htStatus = (st.ht && st.ht.keySet) ? '已配' : '未配'
  const mcpStatus = mcp.enabled ? '开' : '关'
  const classifyStatus = String((classify.rules || []).length || ((classify.projectFromGlossary || classify.deptFromGlossary) ? '词表' : '未配'))
  const syncStatusLabel = pulling ? '同步中' : (lastSyncLabel(syncSt) ? '已同步' : '未同步')
  return (
    <div className="settings">
      <aside className="cats">
        <h2>设置</h2>
        {[['people', '称呼', String(glossaryCount)], ['classify', '类型', classifyStatus], ['llm', '模型', llmStatus], ['kb', '上传', kbStatus], ['ext', '外部系统', htStatus], ['mcp', 'MCP', mcpStatus], ['sync', '来源', syncStatusLabel], ['ver', '版本', (appUp && appUp.available) ? '有更新' : ((appUp && appUp.current) || '—')], ['logs', '日志', String(logs.length || '')]].map(([id, label, n]) => (
          <div className={'cat' + (tab === id ? ' on' : '')} key={id} onClick={() => { setTab(id); setTestMsg(''); setHtMsg('') }}>
            {label + ' '}<span className="n">{n}</span>
          </div>
        ))}
      </aside>
      <div className="page">{panes[tab]}</div>
    </div>
  )
}
