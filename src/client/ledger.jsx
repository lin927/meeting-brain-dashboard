import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api, qs } from './api.js'
import { TODO_PAGE, fmtDateTime, originLabel } from './format.js'
import { ConfirmSheet, InlineComposer, SheetFrame, useDebounced } from './ui.jsx'

function AddTodoSheet(props) {
  const cats = props.cats || ['其他']
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')
  const [cat, setCat] = useState(cats[0] || '其他')
  const [meetingId, setMeetingId] = useState(props.defaultMeetingId || '')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [meetings, setMeetings] = useState([])
  const qDebounced = useDebounced(q, 220)
  const titleRef = useRef(null)
  useEffect(() => { if (titleRef.current) titleRef.current.focus() }, [])
  useEffect(() => {
    api('/api/meetings' + qs({ q: qDebounced, limit: 40 })).then((r) => {
      const items = (r && r.items) || []
      setMeetings(items)
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
  if (meetingId && !options.some((m) => m.taskUuid === meetingId)) {
    const cur = meetings.find((m) => m.taskUuid === meetingId)
    if (cur) options.unshift(cur)
  }
  const submit = () => {
    if (busy) return
    if (!title.trim()) { props.toast('先写待办事项'); return }
    if (!meetingId) { props.toast('选出所属会议'); return }
    setBusy(true)
    api('/api/todos', {
      title: title.trim(), meetingId, owner: owner.trim(), cat, origin: '手工',
    }).then((r) => {
      props.toast('已添加')
      props.onCreated(r.id)
    }).catch((err) => props.toast(String(err && err.message || err))).finally(() => setBusy(false))
  }
  return (
    <SheetFrame title="登记待办" lede="挂到本机一场会议上。不会写到钉钉。" onClose={props.onClose}>
      <div className="field">
        <span>事项</span>
        <input
          ref={titleRef}
          type="text"
          placeholder="要做的事"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          onKeyDown={(ev) => { if (ev.key === 'Enter') submit() }}
        />
      </div>
      <div className="field">
        <span>责任人</span>
        <input type="text" placeholder="可空" value={owner} onChange={(ev) => setOwner(ev.target.value)} />
      </div>
      <div className="field">
        <span>归类</span>
        <select value={cat} onChange={(ev) => setCat(ev.target.value)}>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <span>所属会议</span>
        <input type="text" placeholder="过滤会议标题" value={q} onChange={(ev) => setQ(ev.target.value)} style={{ marginBottom: 6 }} />
        <select value={meetingId} onChange={(ev) => setMeetingId(ev.target.value)}>
          <option value="">{meetings.length ? '选择会议' : '没有会议'}</option>
          {options.map((m) => <option key={m.taskUuid} value={m.taskUuid}>{m.title}</option>)}
        </select>
      </div>
      <div className="sheet-actions">
        <button className="primary" onClick={submit} disabled={busy}>{busy ? '添加中' : '添加'}</button>
        <button className="quiet" onClick={props.onClose}>取消</button>
      </div>
    </SheetFrame>
  )
}

export function LedgerPage(props) {
  const { selected, setSelected, toast, goMeet } = props
  const [items, setItems] = useState(null)
  const [meta, setMeta] = useState({ total: 0, open: 0, cats: ['项目', '部门', '公司', '其他'], catCounts: {}, nextCursor: null, filteredTotal: 0, selected: null })
  const [err, setErr] = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [stFilter, setStFilter] = useState('open')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showAdd, setShowAdd] = useState(false)
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
      status: stFilter,
      cat: catFilter === 'all' ? '' : catFilter,
      cursor: opts.cursor || '',
      limit: TODO_PAGE,
    })).then((r) => {
      if (id !== reqId.current) return
      const next = r.items || []
      setErr(null)
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
  }, [stFilter, catFilter])

  useEffect(() => { if (props.active) load() }, [load, props.active])
  useEffect(() => {
    if (!selected || !items) return undefined
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
  }, [selected, items])

  if (err) return <div className="pane"><p className="empty">{err}</p></div>
  if (!items) return <div className="pane"><p className="empty">加载中…</p></div>

  const cats = meta.cats
  const current = items.find((x) => x.id === selected) || meta.selected || items[0]
  const remain = Math.max(0, (meta.filteredTotal || 0) - items.length)
  const patch = (body, msg) => {
    api('/api/todos', body, 'PATCH').then(() => { if (msg) toast(msg); setEditing(false); load() }).catch((er) => toast(String(er && er.message || er)))
  }
  const addCat = (name) => {
    const n = String(name || '').trim()
    if (!n) { setAddingCat(false); return }
    api('/api/todo-cats', { name: n }).then(() => { setAddingCat(false); load() }).catch((er) => toast(String(er && er.message || er)))
  }
  const doDeleteTodo = () => {
    if (!current || delBusy) return
    setDelBusy(true)
    api('/api/todos/delete', { id: current.id }).then(() => {
      toast('已删除'); setSelected(0); setConfirmDel(false); load()
    }).catch((er) => toast(String(er && er.message || er))).finally(() => setDelBusy(false))
  }

  let detail = <p className="empty">选一条待办</p>
  if (current) {
    if (editing) {
      detail = (
        <div className="formcol">
          <input type="text" value={form.title} onChange={(ev) => setForm({ ...form, title: ev.target.value })} />
          <input type="text" value={form.owner} onChange={(ev) => setForm({ ...form, owner: ev.target.value })} />
          <select value={form.cat} onChange={(ev) => setForm({ ...form, cat: ev.target.value })}>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" placeholder="时限，可空" value={form.due} onChange={(ev) => setForm({ ...form, due: ev.target.value })} />
          <div>
            <button className="primary" onClick={() => patch({ id: current.id, ...form }, '已保存')}>保存</button>
            <button className="quiet" onClick={() => setEditing(false)}>取消</button>
          </div>
        </div>
      )
    } else {
      detail = (
        <div>
          <div className="doc-head">
            <h2 className="detail-h">{current.title}</h2>
            <div className="tools">
              <button className="quiet" onClick={() => { setForm({ title: current.title, owner: current.owner, cat: current.cat, due: current.due || '' }); setEditing(true) }}>编辑</button>
              {current.status === 'open'
                ? <button className="sync-pill" onClick={() => patch({ id: current.id, status: 'done' }, '已关闭')}>关闭</button>
                : <button className="quiet" onClick={() => patch({ id: current.id, status: 'open' }, '已打开')}>打开</button>}
            </div>
          </div>
          <p className="meta-line">{[current.owner, current.cat, current.due].filter(Boolean).join(' · ')}</p>
          <div className="origin">
            <div><span className="k">来源</span>　{originLabel(current.origin)}{current.created ? ' · ' + fmtDateTime(current.created) : ''}</div>
            <div><span className="k">会议</span>　<button className="linkish" onClick={() => goMeet(current.meetingId)}>{current.meeting}</button></div>
          </div>
          <button className="quiet danger" onClick={() => setConfirmDel(true)}>删除</button>
        </div>
      )
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
          <button className="quiet" onClick={() => setShowAdd(true)}>+ 待办</button>
        </div>
        <div className="filters">
          <button className={stFilter === 'open' ? 'on' : ''} onClick={() => setStFilter('open')}>未关闭</button>
          <button className={stFilter === 'done' ? 'on' : ''} onClick={() => setStFilter('done')}>已关闭</button>
          <button className={stFilter === 'all' ? 'on' : ''} onClick={() => setStFilter('all')}>全部</button>
        </div>
        {items.length
          ? items.map((x) => (
            <div
              className={'row' + (current && x.id === current.id ? ' sel' : '') + (x.status === 'done' ? ' closed' : '')}
              key={x.id}
              onClick={() => { setSelected(x.id); setEditing(false) }}
            >
              <div className={'dot ' + x.status} />
              <div>
                <div className="title">{x.title}</div>
                <div className="src">{x.meeting}</div>
              </div>
              <div className="who">{x.owner}</div>
            </div>
          ))
          : <p className="empty">没有待办</p>}
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
      <div className="pane">{detail}</div>
      {showAdd
        ? (
          <AddTodoSheet
            cats={cats}
            toast={toast}
            defaultMeetingId={(current && current.meetingId) || ''}
            onClose={() => setShowAdd(false)}
            onCreated={(id) => { setShowAdd(false); setSelected(id); setStFilter('open'); load() }}
          />
        )
        : null}
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
