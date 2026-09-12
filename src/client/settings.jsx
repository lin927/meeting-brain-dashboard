import React, { useEffect, useRef, useState } from 'react'
import { api, fallbackCopy } from './api.js'
import { KB_DS, LLM_PRESETS, MEETING_TYPES, fmtDateTime, lastSyncLabel, syncProgressLabel } from './format.js'
import { ConfirmSheet } from './ui.jsx'

const GLOSSARY_TABS = [
  { id: 'people', label: '人', add: '+ 人', namePh: '正式姓名', aliasPh: '勇哥、林哥' },
  { id: 'projects', label: '项目', add: '+ 项目', namePh: '正式项目名', aliasPh: '简称、口述', codePh: '编号，可空' },
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
  const [writebackBusy, setWritebackBusy] = useState(false)
  const [classifyBusy, setClassifyBusy] = useState(false)
  const [classify, setClassify] = useState({ projectFromGlossary: true, rules: [] })
  const [confirmClassify, setConfirmClassify] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [confirmFull, setConfirmFull] = useState(false)
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncSt, setSyncSt] = useState(null)
  const waitSync = useRef(false)
  const syncStartedAt = useRef(0)
  const projectFileRef = useRef(null)
  const [importBusy, setImportBusy] = useState(false)
  const [ht, setHt] = useState({ url: '', apiKey: '' })
  const [htMsg, setHtMsg] = useState('')
  const [glossaryQuery, setGlossaryQuery] = useState('')
  useEffect(() => {
    try { sessionStorage.setItem('ma-settings-tab', tab) } catch { /* ignore */ }
  }, [tab])
  useEffect(() => {
    try { sessionStorage.setItem('ma-glossary-kind', glossaryKind) } catch { /* ignore */ }
  }, [glossaryKind])
  const apply = (r) => {
    setSt(r)
    setPeople(r.people || [])
    setProjects((r.projects || []).map((p) => ({ name: p.name || '', aliases: p.aliases || '', code: p.code || '' })))
    setTerms(r.terms || [])
    const L = r.llm || {}
    setLlm({ preset: L.preset || 'deepseek', baseUrl: L.baseUrl || '', model: L.model || '', apiKey: '' })
    const K = r.kb || {}
    setKb({
      url: K.url || '',
      apiKey: '',
      datasets: Object.assign({ mgmt: '', ops: '', project: '', dept: '' }, K.datasets || {}),
    })
    const H = r.ht || {}
    setHt({ url: H.url || '', apiKey: '' })
    const C = r.classify || {}
    setClassify({
      projectFromGlossary: C.projectFromGlossary !== false,
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
  const saveKb = () => {
    const body = { url: kb.url, datasets: kb.datasets }
    if (kb.apiKey.trim()) body.apiKey = kb.apiKey.trim()
    api('/api/settings', { kb: body }).then((r) => { apply(r); toast('已保存') }).catch((er) => toast(String(er && er.message || er)))
  }
  const saveHt = () => {
    const body = { url: ht.url }
    if (ht.apiKey.trim()) body.apiKey = ht.apiKey.trim()
    api('/api/settings', { ht: body }).then((r) => { apply(r); toast('已保存') }).catch((er) => toast(String(er && er.message || er)))
  }
  const testHt = () => {
    setTesting('ht'); setHtMsg('')
    api('/api/settings/ht-test', {}).then((r) => {
      if (!r.ok) { setHtMsg(r.error || '不通'); return }
      const bits = []
      if (r.caller) bits.push(r.caller)
      bits.push('见到 ' + (r.count || 0) + ' 个项目')
      setHtMsg('可用 · ' + bits.join(' · '))
    }).catch((er) => setHtMsg(String(er && er.message || er))).finally(() => setTesting(''))
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
      toast(enabled ? '写回钉钉已打开' : '写回钉钉已关闭')
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
  const lists = { people, projects, terms }
  const kindMeta = GLOSSARY_TABS.find((x) => x.id === glossaryKind) || GLOSSARY_TABS[0]
  const kindRows = lists[kindMeta.id] || []
  const shared = sharedAliasSet(kindRows)
  const filterQ = foldText(glossaryQuery)
  const visibleRows = kindRows.map((p, i) => ({ p, i })).filter(({ p }) => rowMatchesQuery(p, filterQ))
  const peoplePane = (
    <div className={'page-inner' + (kindMeta.id === 'projects' ? ' wide' : '')}>
      <h1>称呼</h1>
      <p className="lede">{glossaryKind === 'projects' ? '正式名用于上传和检索。可从外部系统同步你可见的项目，或导入项目清单 CSV。' : '总结时把口语、简称和听错落到正式写法。'}</p>
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
                placeholder={kindMeta.id === 'projects' ? '按名称、编号、别名筛选' : '按名称、别名筛选'}
                value={glossaryQuery}
                onChange={(ev) => setGlossaryQuery(ev.target.value)}
              />
              <span className="n">{filterQ && visibleRows.length !== kindRows.length ? ('显示 ' + visibleRows.length + ' / ' + kindRows.length) : ('共 ' + kindRows.length + ' 个')}</span>
            </div>
            <div className="glossary-list">
              <div className={'person person-head' + (kindMeta.id === 'projects' ? ' has-code' : '')}>
                <span>名称</span>
                {kindMeta.id === 'projects' ? <span>编号</span> : null}
                <span>别名</span>
                <span />
              </div>
              {visibleRows.length
                ? visibleRows.map(({ p, i }) => {
                  const dup = splitAliases(p.aliases).some((a) => shared.has(a.toLowerCase()))
                  return (
                    <div className={'person' + (kindMeta.id === 'projects' ? ' has-code' : '')} key={kindMeta.id + '-' + i}>
                      <input
                        type="text"
                        placeholder={kindMeta.namePh}
                        value={p.name}
                        onChange={(ev) => {
                          const n = kindRows.slice(); n[i] = { ...n[i], name: ev.target.value }; setKindRows(kindMeta.id, n)
                        }}
                      />
                      {kindMeta.id === 'projects'
                        ? (
                          <input
                            type="text"
                            placeholder={kindMeta.codePh}
                            value={p.code || ''}
                            onChange={(ev) => {
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
                      <button className="quiet" onClick={() => persistKind(kindMeta.id, kindRows.filter((_, j) => j !== i))}>删除</button>
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
      <p className="lede">详情里点上传时写入这里。一台 RAGFlow、四个库。项目会议进同一个库，用项目名（及可选编号）区分，不按项目拆库。</p>
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
  const extPane = (
    <div className="page-inner">
      <h1>外部系统</h1>
      <p className="lede">接公司数智系统，把你有权看的项目同步进称呼表。地址和令牌只存在本机。</p>
      <div className="block">
        <h3>公司数智系统</h3>
        <p className="lede">令牌在数智系统「个人中心 · 第三方应用接入」创建。同步会拉全部有效项目，本地别名保留。</p>
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
        {htMsg ? <p className="status">{htMsg}</p> : null}
      </div>
    </div>
  )
  const classifyPane = (
    <div className="page-inner">
      <h1>类型规则</h1>
      <p className="lede">新听记入库时，按从上到下第一条命中的规则填写类型和标签。项目会会同时填项目名。手改过的类型不覆盖。库里已有的要点「套用到未定场次」。</p>
      <div className="filters">
        <button
          className={classify.projectFromGlossary ? 'on' : ''}
          onClick={() => setClassify({ ...classify, projectFromGlossary: !classify.projectFromGlossary })}
        >词表项目</button>
      </div>
      <p className="hint">{classify.projectFromGlossary ? '标题或记录命中称呼表里的项目名/别名时，标为「项目」并打上该项目名。规则先于这一条。' : '不自动用词表项目名识别。'}</p>
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
  const syncPane = (
    <div className="page-inner">
      <h1>听记</h1>
      <p className="lede">从钉钉拉到本机，和把本机改动写回钉钉，是两件事。</p>
      <div className="block">
        <h3>写回钉钉</h3>
        <p className="lede">保存标题和「记录」（钉钉纪要）时，是否改对应听记。关闭后只改本机。待办、逐字稿、本机总结不会写回。</p>
        <div className="filters">
          <button className={writeback.enabled ? 'on' : ''} disabled={writebackBusy} onClick={() => setWriteback(true)}>打开</button>
          <button className={!writeback.enabled ? 'on' : ''} disabled={writebackBusy} onClick={() => setWriteback(false)}>关闭</button>
        </div>
      </div>
      <div className="block">
        <h3>从钉钉同步</h3>
        <p className="lede">列表上的「更新」只拉本机还没有的，最多 300 场。全量会把尚未入库的都拉完，可能要较久，但在后台跑，网页可以继续用。</p>
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
  const panes = { people: peoplePane, classify: classifyPane, llm: llmPane, kb: kbPane, ext: extPane, mcp: mcpPane, sync: syncPane, logs: logsPane }
  const glossaryCount = people.length + projects.length + terms.length
  const llmStatus = (st.llm && st.llm.model) || (st.llm && st.llm.keySet ? '已配' : '未配置')
  const kbStatus = (st.kb && st.kb.filled) ? (st.kb.filled + '/4') : '未填'
  const htStatus = (st.ht && st.ht.keySet) ? '已配' : '未配'
  const mcpStatus = mcp.enabled ? '开' : '关'
  const classifyStatus = String((classify.rules || []).length || (classify.projectFromGlossary ? '词表' : '未配'))
  const syncStatusLabel = pulling ? '同步中' : (lastSyncLabel(syncSt) ? '已同步' : '未同步')
  return (
    <div className="settings">
      <aside className="cats">
        <h2>设置</h2>
        {[['people', '称呼', String(glossaryCount)], ['classify', '类型', classifyStatus], ['llm', '模型', llmStatus], ['kb', '上传', kbStatus], ['ext', '外部系统', htStatus], ['mcp', 'MCP', mcpStatus], ['sync', '听记', syncStatusLabel], ['logs', '日志', String(logs.length || '')]].map(([id, label, n]) => (
          <div className={'cat' + (tab === id ? ' on' : '')} key={id} onClick={() => { setTab(id); setTestMsg(''); setHtMsg('') }}>
            {label + ' '}<span className="n">{n}</span>
          </div>
        ))}
      </aside>
      <div className="page">{panes[tab]}</div>
    </div>
  )
}
