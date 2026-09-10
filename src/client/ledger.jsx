import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api, qs } from './api.js'
import { TODO_PAGE, fmtDateTime, originLabel } from './format.js'
import { CheckMark, ConfirmSheet, InlineComposer, TitleInput, TodoRowTitle, useDebounced } from './ui.jsx'

function CatPills(props) {
  return (
    <div className="cat-pills">
      {(props.cats || []).map((c) => (
        <button type="button" key={c} className={props.value === c ? 'on' : ''} onClick={() => props.onChange(c)}>{c}</button>
      ))}
    </div>
  )
}

function MeetingPicker(props) {
  const [q, setQ] = useState('')
  const [meetings, setMeetings] = useState([])
  const qDebounced = useDebounced(q, 220)
  useEffect(() => {
    api('/api/meetings' + qs({ q: qDebounced, limit: 40 })).then((r) => {
      setMeetings((r && r.items) || [])
    }).catch(() => {})
  }, [qDebounced])
  useEffect(() => {
    const id = props.defaultMeetingId
    if (!id) return undefined
    api('/api/meetings' + qs({ id, limit: 1 })).then((r) => {
      const one = r && r.items && r.items[0]
      if (!one) return
      setMeetings((prev) => prev.some((m) => m.taskUuid === one.taskUuid) ? prev : [one].concat(prev))
    }).catch(() => {})
  }, [props.defaultMeetingId])
  const options = meetings.slice()
  if (props.value && !options.some((m) => m.taskUuid === props.value)) {
    const cur = meetings.find((m) => m.taskUuid === props.value)
    if (cur) options.unshift(cur)
  }
  return (
    <div className="field">
      <span>所属会议</span>
      <input type="text" placeholder="过滤会议标题" value={q} onChange={(ev) => setQ(ev.target.value)} style={{ marginBottom: 6 }} />
      <select value={props.value} onChange={(ev) => props.onChange(ev.target.value)}>
        <option value="">{meetings.length ? '选择会议' : '没有会议'}</option>
        {options.map((m) => <option key={m.taskUuid} value={m.taskUuid}>{m.title}</option>)}
      </select>
    </div>
  )
}

function TodoInspector(props) {
  const cats = props.cats || ['其他']
  const item = props.item
  const composing = props.composing
  const titleRef = useRef(null)
  const [title, setTitle] = useState(composing ? '' : (item && item.title) || '')
  const [owner, setOwner] = useState(composing ? '' : (item && item.owner) || '')
  const [cat, setCat] = useState(composing ? (cats.includes('其他') ? '其他' : (cats[0] || '其他')) : ((item && item.cat) || '其他'))
  const [due, setDue] = useState(composing ? '' : (item && item.due) || '')
  const [meetingId, setMeetingId] = useState(props.defaultMeetingId || '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (composing && titleRef.current) titleRef.current.focus()
  }, [composing])

  const saveField = (fields) => {
    if (composing || !item) return
    props.onPatch(item.id, fields)
  }
  const submitNew = () => {
    if (busy) return
    if (!title.trim()) { props.toast('先写待办事项'); return }
    if (!meetingId) { props.toast('选出所属会议'); return }
    setBusy(true)
    api('/api/todos', {
      title: title.trim(), meetingId, owner: owner.trim(), cat, due: due.trim(), origin: '手工',
    }).then((r) => {
      props.toast('已添加')
      props.onCreated(r.item || { id: r.id })
    }).catch((err) => props.toast(String(err && err.message || err))).finally(() => setBusy(false))
  }

  return (
    <div className="formcol">
      {composing
        ? (
          <TitleInput
            inputRef={titleRef}
            value={title}
            placeholder="新待办"
            autoFocus
            onChange={setTitle}
            onCommit={() => {}}
            onCancel={() => setTitle('')}
            onEnter={submitNew}
          />
        )
        : null}
      <div className="field">
        <span>责任人</span>
        <input
          type="text"
          placeholder="可空"
          value={owner}
          onChange={(ev) => setOwner(ev.target.value)}
          onBlur={() => { if (!composing && owner.trim() !== (item.owner || '')) saveField({ owner: owner.trim() }) }}
          onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); composing ? submitNew() : ev.currentTarget.blur() } }}
        />
      </div>
      <div className="field">
        <span>归类</span>
        <CatPills
          cats={cats}
          value={cat}
          onChange={(c) => {
            setCat(c)
            if (!composing) saveField({ cat: c })
          }}
        />
      </div>
      <div className="field">
        <span>时限</span>
        <input
          type="text"
          placeholder="可空"
          value={due}
          onChange={(ev) => setDue(ev.target.value)}
          onBlur={() => { if (!composing && due.trim() !== (item.due || '')) saveField({ due: due.trim() }) }}
          onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); composing ? submitNew() : ev.currentTarget.blur() } }}
        />
      </div>
      {composing
        ? <MeetingPicker value={meetingId} onChange={setMeetingId} defaultMeetingId={props.defaultMeetingId} />
        : (
          <div className="origin">
            <div><span className="k">来源</span>　{originLabel(item.origin)}{item.created ? ' · ' + fmtDateTime(item.created) : ''}</div>
            <div><span className="k">会议</span>　<button className="linkish" onClick={() => props.goMeet(item.meetingId)}>{item.meeting}</button></div>
          </div>
        )}
      {composing
        ? (
          <div>
            <button className="primary" onClick={submitNew} disabled={busy}>{busy ? '添加中' : '添加'}</button>
            <button className="quiet" onClick={props.onCancel}>取消</button>
          </div>
        )
        : <button className="quiet danger" onClick={props.onDelete}>删除</button>}
    </div>
  )
}

export function LedgerPage(props) {
  const { selected, setSelected, toast, goMeet } = props
  const [items, setItems] = useState(null)
  const [meta, setMeta] = useState({ total: 0, open: 0, cats: ['项目', '部门', '公司', '其他'], catCounts: {}, nextCursor: null, filteredTotal: 0, selected: null })
  const [err, setErr] = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [stFilter, setStFilter] = useState('open')
  const [todoQuery, setTodoQuery] = useState('')
  const qDebounced = useDebounced(todoQuery, 280)
  const [composing, setComposing] = useState(false)
  const [composeKey, setComposeKey] = useState(0)
  const [addingCat, setAddingCat] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [delBusy, setDelBusy] = useState(false)
  const [moreBusy, setMoreBusy] = useState(false)
  const reqId = useRef(0)

  const load = useCallback((opts = {}) => {
    const id = ++reqId.current
    const append = !!opts.append
    if (append) setMoreBusy(true)
    return api('/api/todos' + qs({
      q: qDebounced,
      status: stFilter,
      cat: catFilter === 'all' ? '' : catFilter,
      cursor: opts.cursor || '',
      limit: TODO_PAGE,
    })).then((r) => {
      if (id !== reqId.current) return
      const next = r.items || []
      setErr(null)
      if (!append) setComposing(false)
      setMeta((prev) => ({
        total: r.total || 0,
        open: r.open || 0,
        cats: r.cats || ['项目', '部门', '公司', '其他'],
        catCounts: r.catCounts || {},
        nextCursor: r.nextCursor || null,
        filteredTotal: r.filteredTotal || 0,
        selected: append ? prev.selected : null,
      }))
      setItems((prev) => {
        if (!append) return next
        const seen = new Set((prev || []).map((x) => x.id))
        return (prev || []).concat(next.filter((x) => !seen.has(x.id)))
      })
    }).catch((er) => {
      if (id !== reqId.current) return
      if (!append) setErr(String(er && er.message || er))
      else toast(String(er && er.message || er))
    }).finally(() => { if (append) setMoreBusy(false) })
  }, [stFilter, catFilter, qDebounced])

  useEffect(() => { if (props.active) load() }, [load, props.active])
  useEffect(() => {
    if (!selected || !items || composing) return undefined
    if (items.some((x) => x.id === selected)) return undefined
    let alive = true
    api('/api/todos' + qs({ id: selected, status: 'all', limit: 1 })).then((r) => {
      if (!alive || !r.selected) return
      setMeta((m) => ({ ...m, selected: r.selected }))
      setItems((prev) => {
        if (!prev || prev.some((x) => x.id === r.selected.id)) return prev
        return [r.selected].concat(prev)
      })
    }).catch(() => {})
    return () => { alive = false }
  }, [selected, items, composing])

  if (err) return <div className="pane"><p className="empty">{err}</p></div>
  if (!items) return <div className="pane"><p className="empty">加载中…</p></div>

  const cats = meta.cats
  const listed = items.find((x) => x.id === selected) || meta.selected || items[0]
  const current = composing ? null : listed
  const remain = Math.max(0, (meta.filteredTotal || 0) - items.length)
  const patchLocal = (id, fields) => {
    setItems((prev) => (prev || []).map((x) => x.id === id ? { ...x, ...fields } : x))
    setMeta((m) => (m.selected && m.selected.id === id ? { ...m, selected: { ...m.selected, ...fields } } : m))
  }
  const onPatch = (id, fields) => {
    const prev = (items || []).find((x) => x.id === id) || meta.selected
    patchLocal(id, fields)
    api('/api/todos', { id, ...fields }, 'PATCH').catch((er) => {
      if (prev) patchLocal(id, prev)
      toast(String(er && er.message || er))
    })
  }
  const toggleStatus = (x, ev) => {
    if (ev) ev.stopPropagation()
    const next = x.status === 'done' ? 'open' : 'done'
    const prevStatus = x.status
    patchLocal(x.id, { status: next })
    setMeta((m) => ({ ...m, open: Math.max(0, m.open + (next === 'open' ? 1 : -1)) }))
    if (composing) { setComposing(false); setSelected(x.id) }
    api('/api/todos', { id: x.id, status: next }, 'PATCH').catch((er) => {
      patchLocal(x.id, { status: prevStatus })
      setMeta((m) => ({ ...m, open: Math.max(0, m.open + (prevStatus === 'open' ? 1 : -1)) }))
      toast(String(er && er.message || er))
    })
  }
  const addCat = (name) => {
    const n = String(name || '').trim()
    if (!n) { setAddingCat(false); return }
    api('/api/todo-cats', { name: n }).then(() => {
      setAddingCat(false)
      setMeta((m) => ({ ...m, cats: m.cats.includes(n) ? m.cats : m.cats.concat(n), catCounts: { ...m.catCounts, [n]: m.catCounts[n] || 0 } }))
    }).catch((er) => toast(String(er && er.message || er)))
  }
  const doDeleteTodo = () => {
    if (!current || delBusy) return
    setDelBusy(true)
    const id = current.id
    const wasOpen = current.status === 'open'
    api('/api/todos/delete', { id }).then(() => {
      toast('已删除')
      setConfirmDel(false)
      setSelected(0)
      setItems((prev) => (prev || []).filter((x) => x.id !== id))
      setMeta((m) => ({
        ...m,
        selected: null,
        total: Math.max(0, m.total - 1),
        open: Math.max(0, m.open - (wasOpen ? 1 : 0)),
        filteredTotal: Math.max(0, m.filteredTotal - 1),
      }))
    }).catch((er) => toast(String(er && er.message || er))).finally(() => setDelBusy(false))
  }
  const startCompose = () => {
    setComposing(true)
    setComposeKey((n) => n + 1)
  }
  const onCreated = (item) => {
    setComposing(false)
    if (item && item.id) {
      setSelected(item.id)
      if (item.title) {
        setItems((prev) => {
          const list = prev || []
          if (list.some((x) => x.id === item.id)) return list
          return [item].concat(list)
        })
        setMeta((m) => ({ ...m, total: m.total + 1, open: m.open + 1, filteredTotal: m.filteredTotal + 1 }))
      }
    }
  }

  return (
    <div className="ledger">
      <aside className="cats">
        <h2>归类</h2>
        <div className={'cat' + (catFilter === 'all' ? ' on' : '')} onClick={() => setCatFilter('all')}>
          全部 <span className="n">{meta.total}</span>
        </div>
        {cats.map((c) => (
          <div className={'cat' + (catFilter === c ? ' on' : '')} key={c} onClick={() => setCatFilter(c)}>
            {c + ' '}<span className="n">{meta.catCounts[c] || 0}</span>
          </div>
        ))}
        {addingCat
          ? (
            <InlineComposer
              placeholder="归类名称"
              submitLabel="添加"
              compact
              onSubmit={addCat}
              onCancel={() => setAddingCat(false)}
            />
          )
          : <button className="quiet" style={{ marginTop: 12 }} onClick={() => setAddingCat(true)}>+ 归类</button>}
      </aside>
      <div className="pane">
        <div className="doc-head">
          <div>
            <h1>待办</h1>
            <p className="lede">{meta.open + ' 项未关闭'}</p>
          </div>
          <button className="quiet" onClick={startCompose}>+ 待办</button>
        </div>
        <div className="filters">
          <button className={stFilter === 'open' ? 'on' : ''} onClick={() => setStFilter('open')}>未关闭</button>
          <button className={stFilter === 'done' ? 'on' : ''} onClick={() => setStFilter('done')}>已关闭</button>
          <button className={stFilter === 'all' ? 'on' : ''} onClick={() => setStFilter('all')}>全部</button>
        </div>
        <input
          type="text"
          placeholder="过滤事项、责任人或会议"
          value={todoQuery}
          onChange={(ev) => setTodoQuery(ev.target.value)}
          style={{ marginBottom: 8 }}
        />
        {items.length
          ? items.map((x) => (
            <div
              className={'row' + (!composing && current && x.id === current.id ? ' sel' : '') + (x.status === 'done' ? ' closed' : '')}
              key={x.id}
              onClick={() => { setComposing(false); setSelected(x.id) }}
            >
              <CheckMark on={x.status === 'done'} onClick={(ev) => toggleStatus(x, ev)} />
              <div>
                <TodoRowTitle
                  title={x.title}
                  toast={toast}
                  onFocus={() => { setComposing(false); setSelected(x.id) }}
                  onSave={(title) => onPatch(x.id, { title })}
                />
                <div className="src">{x.meeting}</div>
              </div>
              <div className="who">{x.owner}</div>
            </div>
          ))
          : <p className="empty">{qDebounced ? '没有匹配的待办' : '没有待办'}</p>}
        {meta.nextCursor
          ? (
            <div className="more-row">
              <button className="quiet" disabled={moreBusy} onClick={() => load({ append: true, cursor: meta.nextCursor })}>
                {moreBusy ? '加载中' : ('后面还有 ' + remain + ' 条')}
              </button>
            </div>
          )
          : null}
      </div>
      <div className="pane">
        {composing
          ? (
            <TodoInspector
              key={'new-' + composeKey}
              composing
              cats={cats}
              toast={toast}
              defaultMeetingId={(listed && listed.meetingId) || ''}
              onCreated={onCreated}
              onCancel={() => setComposing(false)}
            />
          )
          : (current
              ? (
                <TodoInspector
                  key={current.id}
                  item={current}
                  cats={cats}
                  toast={toast}
                  goMeet={goMeet}
                  onPatch={onPatch}
                  onDelete={() => setConfirmDel(true)}
                />
              )
              : <p className="empty">选一条待办</p>)}
      </div>
      {confirmDel && current
        ? (
          <ConfirmSheet
            title="删除待办"
            lede={'从本机台账去掉「' + current.title + '」。钉钉里的待办不会动。'}
            confirmLabel="删除"
            danger
            busy={delBusy}
            onConfirm={doDeleteTodo}
            onClose={() => { if (!delBusy) setConfirmDel(false) }}
          />
        )
        : null}
    </div>
  )
}
