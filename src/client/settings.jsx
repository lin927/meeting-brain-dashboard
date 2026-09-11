import React, { useEffect, useRef, useState } from 'react'
import { api, fallbackCopy } from './api.js'
import { KB_DS, LLM_PRESETS, fmtDateTime, lastSyncLabel, syncProgressLabel } from './format.js'
import { ConfirmSheet } from './ui.jsx'

const GLOSSARY_TABS = [
  { id: 'people', label: '人', add: '+ 人', namePh: '正式姓名', aliasPh: '勇哥、林哥' },
  { id: 'projects', label: '项目', add: '+ 项目', namePh: '正式项目名', aliasPh: '简称、口述' },
  { id: 'terms', label: '用语', add: '+ 用语', namePh: '标准写法', aliasPh: '听错、近音' },
]

function splitAliases(v) {
  return String(v || '').split(/[、，,;；/|]+/).map((s) => s.trim()).filter(Boolean)
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

export function SettingsPage(props) {
  const toast = props.toast
  const [tab, setTab] = useState(() => {
    try { return sessionStorage.getItem('ma-settings-tab') || 'people' } catch { return 'people' }
  })
  const [st, setSt] = useState(null)
  const [err, setErr] = useState(null)
  const [people, setPeople] = useState([])
  const [projects, setProjects] = useState([])
  const [terms, setTerms] = useState([])
  const [glossaryKind, setGlossaryKind] = useState(() => {
    try { return sessionStorage.getItem('ma-glossary-kind') || 'people' } catch { return 'people' }
  })
  const [llm, setLlm] = useState({ preset: 'deepseek', baseUrl: '', model: '', apiKey: '' })
  const [kb, setKb] = useState({ url: '', apiKey: '', datasets: { mgmt: '', ops: '', project: '', dept: '' } })
  const [testing, setTesting] = useState('')
  const [testMsg, setTestMsg] = useState('')
  const [logs, setLogs] = useState([])
  const [mcpBusy, setMcpBusy] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [confirmFull, setConfirmFull] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncSt, setSyncSt] = useState(null)
  const waitSync = useRef(false)
  const syncStartedAt = useRef(0)
  useEffect(() => {
    try { sessionStorage.setItem('ma-settings-tab', tab) } catch { /* ignore */ }
  }, [tab])
  useEffect(() => {
    try { sessionStorage.setItem('ma-glossary-kind', glossaryKind) } catch { /* ignore */ }
  }, [glossaryKind])
  const apply = (r) => {
    setSt(r)
    setPeople(r.people || [])
    setProjects(r.projects || [])
    setTerms(r.terms || [])
    const L = r.llm || {}
    setLlm({ preset: L.preset || 'deepseek', baseUrl: L.baseUrl || '', model: L.model || '', apiKey: '' })
    const K = r.kb || {}
    setKb({
      url: K.url || '',
      apiKey: '',
      datasets: Object.assign({ mgmt: '', ops: '', project: '', dept: '' }, K.datasets || {}),
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
        setSyncSt(r)
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
  const saveKb = () => {
    const body = { url: kb.url, datasets: kb.datasets }
    if (kb.apiKey.trim()) body.apiKey = kb.apiKey.trim()
    api('/api/settings', { kb: body }).then((r) => { apply(r); toast('已保存') }).catch((er) => toast(String(er && er.message || er)))
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
  const lists = { people, projects, terms }
  const kindMeta = GLOSSARY_TABS.find((x) => x.id === glossaryKind) || GLOSSARY_TABS[0]
  const kindRows = lists[kindMeta.id] || []
  const shared = sharedAliasSet(kindRows)
  const peoplePane = (
    <div className="page-inner">
      <h1>称呼</h1>
      <p className="lede">总结时把口语、简称和听错落到正式写法。</p>
      <div className="filters">
        {GLOSSARY_TABS.map((x) => (
          <button key={x.id} className={glossaryKind === x.id ? 'on' : ''} onClick={() => setGlossaryKind(x.id)}>{x.label}</button>
        ))}
      </div>
      {kindRows.length
        ? kindRows.map((p, i) => {
          const dup = splitAliases(p.aliases).some((a) => shared.has(a.toLowerCase()))
          return (
            <div className="person" key={kindMeta.id + '-' + i}>
              <input
                type="text"
                placeholder={kindMeta.namePh}
                value={p.name}
                onChange={(ev) => {
                  const n = kindRows.slice(); n[i] = { ...n[i], name: ev.target.value }; setKindRows(kindMeta.id, n)
                }}
              />
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
              <button className="quiet" onClick={() => persistKind(kindMeta.id, kindRows.filter((_, j) => j !== i))}>删除</button>
            </div>
          )
        })
        : <p className="empty">还没有。加一行即可。</p>}
      <button className="quiet" onClick={() => setKindRows(kindMeta.id, kindRows.concat([{ name: '', aliases: '' }]))}>{kindMeta.add}</button>
      <button className="primary" style={{ marginLeft: 8 }} onClick={() => persistKind(kindMeta.id, kindRows).then(() => toast('已保存')).catch(() => {})}>保存</button>
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
      <h1>公司知识库</h1>
      <p className="lede">一台 RAGFlow、四个库。项目会议、部门会议各进一个库，不同项目或部门用标签区分。</p>
      <div className="field"><span>地址</span><input type="text" placeholder="RAGFlow 地址" value={kb.url} onChange={(ev) => setKb({ ...kb, url: ev.target.value })} /></div>
      <div className="field">
        <span>密钥</span>
        <input
          type="password"
          placeholder={st.kb && st.kb.keySet ? '已保存' : '公司提供'}
          value={kb.apiKey}
          onChange={(ev) => setKb({ ...kb, apiKey: ev.target.value })}
        />
      </div>
      {KB_DS.map((d) => (
        <div className="field" key={d.key}>
          <span>{d.label + ' · dataset id'}</span>
          <input
            type="text"
            placeholder="RAGFlow 数据集 ID"
            value={kb.datasets[d.key] || ''}
            onChange={(ev) => setKb({ ...kb, datasets: { ...kb.datasets, [d.key]: ev.target.value } })}
          />
        </div>
      ))}
      <button className="primary" onClick={saveKb}>保存</button>
      <button className="quiet" disabled={testing === 'kb'} onClick={() => {
        setTesting('kb'); setTestMsg('')
        api('/api/settings/kb-test', {}).then((r) => {
          setTestMsg(r.ok ? ('可用 · 见到 ' + r.count + ' 个库') : (r.error || '不通'))
        }).catch((er) => setTestMsg(String(er && er.message || er))).finally(() => setTesting(''))
      }}>{testing === 'kb' ? '在测…' : '测一下'}</button>
      {testMsg && tab === 'kb' ? <p className="status">{testMsg}</p> : null}
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
  const syncPane = (
    <div className="page-inner">
      <h1>听记</h1>
      <p className="lede">列表上的「更新」只拉本机还没有的，最多 300 场。全量会把钉钉列表里尚未入库的都拉完，可能要较久，但在后台跑，网页可以继续用。</p>
      <p className="status">{
        pulling
          ? (syncProgressLabel(syncSt) || '同步中…页面可继续用')
          : (lastSyncLabel(syncSt) ? ('上次：' + lastSyncLabel(syncSt)) : '还没同步过')
      }</p>
      <button className="primary" disabled={pulling} onClick={() => setConfirmFull(true)}>{pulling ? '同步中…' : '全量同步'}</button>
      {confirmFull
        ? (
          <ConfirmSheet
            title="全量同步听记"
            lede="从钉钉把本机还没有的听记都拉下来。已在本机的不覆盖你改过的记录和逐字稿；本机删过的不会再回来。钉钉未登录会失败。"
            confirmLabel="开始全量"
            busy={pulling}
            onConfirm={doFullSync}
            onClose={() => { if (!pulling) setConfirmFull(false) }}
          />
        )
        : null}
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
  const panes = { people: peoplePane, llm: llmPane, kb: kbPane, mcp: mcpPane, sync: syncPane, logs: logsPane }
  const glossaryCount = people.length + projects.length + terms.length
  const llmStatus = (st.llm && st.llm.model) || (st.llm && st.llm.keySet ? '已配' : '未配置')
  const kbStatus = (st.kb && st.kb.filled) ? (st.kb.filled + '/4') : '未填'
  const mcpStatus = mcp.enabled ? '开' : '关'
  const syncStatusLabel = pulling ? '同步中' : (lastSyncLabel(syncSt) ? '已同步' : '未同步')
  return (
    <div className="settings">
      <aside className="cats">
        <h2>设置</h2>
        {[['people', '称呼', String(glossaryCount)], ['llm', '模型', llmStatus], ['kb', '公司', kbStatus], ['mcp', 'MCP', mcpStatus], ['sync', '听记', syncStatusLabel], ['logs', '日志', String(logs.length || '')]].map(([id, label, n]) => (
          <div className={'cat' + (tab === id ? ' on' : '')} key={id} onClick={() => { setTab(id); setTestMsg('') }}>
            {label + ' '}<span className="n">{n}</span>
          </div>
        ))}
      </aside>
      <div className="page">{panes[tab]}</div>
    </div>
  )
}
