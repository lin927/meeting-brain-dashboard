import React from 'react'
import { api, fallbackCopy } from './api.js'
import { MEETING_TYPES, companyMark, fmtDateTime, srcLabel, typeLabel, ymd } from './format.js'
import { ConfirmSheet, InlineComposer, Md, SheetFrame } from './ui.jsx'

const e = React.createElement

export function MeetingDetail(props) {
  const uuid = props.uuid
  const meetTag = props.meetTag
  const onTag = props.onTag
  const onChanged = props.onChanged
  const onDeleted = props.onDeleted
  const onJumpTodo = props.onJumpTodo
  const toast = props.toast
  const [d, setD] = React.useState(null)
  const [err, setErr] = React.useState(null)
  const [sub, setSub] = React.useState('record')
  const [deep, setDeep] = React.useState('')
  const [deeping, setDeeping] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [editingDeep, setEditingDeep] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [attendees, setAttendees] = React.useState('')
  const [summary, setSummary] = React.useState('')
  const [scope, setScope] = React.useState('')
  const [tags, setTags] = React.useState([])
  const [saving, setSaving] = React.useState(false)
  const [savingDeep, setSavingDeep] = React.useState(false)
  const [addingTag, setAddingTag] = React.useState(false)
  const [addingTodo, setAddingTodo] = React.useState(false)
  const [todoTitle, setTodoTitle] = React.useState('')
  const [todoOwner, setTodoOwner] = React.useState('')
  const [todoBusy, setTodoBusy] = React.useState(false)
  const [confirmDel, setConfirmDel] = React.useState(false)
  const [delBusy, setDelBusy] = React.useState(false)
  const [confirmDeep, setConfirmDeep] = React.useState(false)
  const [confirmSharedTitle, setConfirmSharedTitle] = React.useState(false)
  const load = React.useCallback(() => {
    setD(null); setErr(null); setSub('record'); setDeep(''); setEditing(false); setEditingDeep(false)
    setAddingTag(false); setAddingTodo(false); setConfirmDel(false); setConfirmDeep(false); setConfirmSharedTitle(false)
    api('/api/detail?id=' + encodeURIComponent(uuid)).then((r) => {
      if (r && r.error) setErr(r.error)
      else {
        setD(r)
        setTitle(r.title || '')
        setAttendees(r.attendees || '')
        setSummary(r.summary || '')
        setDeep(r.deepSummary || '')
        setScope(r.type || r.scope || '')
        setTags(r.tags || [])
      }
    }).catch((e) => setErr(String(e && e.message || e)))
  }, [uuid])
  React.useEffect(() => { load() }, [load])
  const doDeep = () => {
    if (deeping) return
    if (String(deep || '').trim()) { setConfirmDeep(true); return }
    runDeep()
  }
  const runDeep = () => {
    if (deeping) return
    setConfirmDeep(false)
    setDeeping(true); setCopied(false)
    api('/api/summarize', { id: uuid }).then((r) => {
      if (r && r.error) { toast('生成失败: ' + r.error); return }
      const text = r && r.summary || ''
      setDeep(text)
      setEditingDeep(false)
      setD((prev) => prev ? { ...prev, deepSummary: text } : prev)
      toast('总结已保存到本机')
    }).catch((err) => toast('生成失败: ' + String(err && err.message || err))).finally(() => setDeeping(false))
  }
  const copyDeep = (text) => {
    const w = (typeof window !== 'undefined') ? window : globalThis
    const plain = String(text || '')
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1500) }
    if (w.navigator && w.navigator.clipboard && w.navigator.clipboard.writeText) {
      w.navigator.clipboard.writeText(plain).then(done).catch(() => { fallbackCopy(w, plain); done() })
    } else {
      fallbackCopy(w, plain); done()
    }
  }
  const saveDeep = () => {
    if (savingDeep) return
    setSavingDeep(true)
    api('/api/meeting', { id: uuid, deepSummary: deep }, 'PATCH').then((r) => {
      setD(r)
      setDeep(r && r.deepSummary != null ? r.deepSummary : deep)
      setEditingDeep(false)
      toast('总结已保存到本机')
      if (onChanged) onChanged()
    }).catch((err) => toast(String(err && err.message || err))).finally(() => setSavingDeep(false))
  }
  const saveEdit = (opts) => {
    if (saving) return
    const titleChanged = String(title) !== String((d && d.title) || '')
    const shared = d && d.source === 'shared'
    if (titleChanged && shared && !(opts && opts.sharedTitleDecided)) {
      setConfirmSharedTitle(true)
      return
    }
    setConfirmSharedTitle(false)
    setSaving(true)
    const body = { id: uuid, title, attendees, summary, type: scope, tags }
    if (opts && opts.skipDingTalk) body.skipDingTalk = true
    api('/api/meeting', body, 'PATCH').then((r) => {
      setD(r); setEditing(false)
      if (r && r.dingTalkTitle && r.dingTalkTitle.message) toast(r.dingTalkTitle.message)
      else if (scope === '个人' && d && d.visibility === 'company') toast('已保存，个人会议已退出公司库')
      else toast('已保存')
      if (onChanged) onChanged()
    }).catch((err) => setErr(String(err && err.message || err))).finally(() => setSaving(false))
  }
  const togglePublish = () => {
    if (!d) return
    const t = d.type || d.scope
    if (t === '个人') { toast('个人会议不同步到公司'); return }
    if (!t) { toast('先选类型再同步到公司'); return }
    const next = d.visibility === 'company' ? 'private' : 'company'
    api('/api/publish', { id: uuid, visibility: next }).then((r) => {
      toast(r.message || (next === 'company' ? '已同步到公司' : '已取消同步'))
      load()
      if (onChanged) onChanged()
    }).catch((err) => toast(String(err && err.message || err)))
  }
  const addTag = (name) => {
    const t = String(name || '').trim()
    if (!t || tags.includes(t)) { setAddingTag(false); return }
    setTags(tags.concat([t]))
    setAddingTag(false)
  }
  const removeLocal = () => setConfirmDel(true)
  const doRemove = () => {
    if (delBusy) return
    setDelBusy(true)
    api('/api/meeting/delete', { id: uuid }).then(() => {
      toast('已从本机移除')
      if (onDeleted) onDeleted(uuid)
    }).catch((err) => { toast(String(err && err.message || err)); setDelBusy(false); setConfirmDel(false) })
  }
  const submitMeetTodo = () => {
    const title = todoTitle.trim()
    if (!title || todoBusy) return
    setTodoBusy(true)
    api('/api/todos', { title, meetingId: uuid, owner: todoOwner.trim(), origin: '手工' }).then(() => {
      toast('已添加')
      setAddingTodo(false); setTodoTitle(''); setTodoOwner('')
      api('/api/detail?id=' + encodeURIComponent(uuid)).then((r) => { if (r && !r.error) setD(r) })
      if (onChanged) onChanged()
    }).catch((err) => toast(String(err && err.message || err))).finally(() => setTodoBusy(false))
  }
  if (err) return e('p', { className: 'empty' }, '加载失败: ' + err)
  if (!d) return e('p', { className: 'empty' }, '加载中…')
  const tx = d.transcript || []
  const txText = tx.join('\n')
  const synced = d.visibility === 'company'
  const meetType = d.type || d.scope || ''
  const personal = meetType === '个人'
  const canPub = meetType && !personal
  const tools = editing
    ? [
        e('button', { className: 'primary', key: 's', onClick: saveEdit, disabled: saving }, saving ? '保存中' : '保存'),
        e('button', { className: 'quiet', key: 'c', onClick: () => setEditing(false) }, '取消'),
      ]
    : [
        e('button', { className: 'quiet', key: 'e', onClick: () => { setEditing(true); setSub('record') } }, '编辑'),
        e('button', { className: 'quiet danger', key: 'del', onClick: removeLocal }, '删除'),
        personal
          ? e('span', { className: 'meta', key: 'p', style: { margin: '0 0 0 8px' } }, '个人不同步')
          : (!canPub
              ? e('span', { className: 'meta', key: 'need', style: { margin: '0 0 0 8px' } }, '先选类型')
              : e('button', { className: 'sync-pill' + (synced ? ' on' : ''), key: 'pub', onClick: togglePublish }, synced ? companyMark(d) || '已到公司' : '同步到公司')),
      ]
  const tagRow = editing
    ? e('div', null,
        e('div', { className: 'tags', style: { marginTop: 10 } },
          tags.map((t) => e('button', { type: 'button', className: 'tag on', key: t, onClick: () => setTags(tags.filter((x) => x !== t)) }, t, e('span', { className: 'x' }, '×'))),
          addingTag
            ? e(InlineComposer, {
                key: 'tag-in', compact: true, placeholder: '标签', submitLabel: '添加',
                onSubmit: addTag, onCancel: () => setAddingTag(false),
              })
            : e('button', { type: 'button', className: 'quiet', key: 'add', onClick: () => setAddingTag(true) }, '+ 标签')),
        e('div', { className: 'field', style: { marginTop: 10, maxWidth: 220 } },
          e('span', null, '类型'),
          e('select', { value: scope, onChange: (ev) => setScope(ev.target.value) },
            e('option', { value: '' }, '未定类型'),
            MEETING_TYPES.map((s) => e('option', { key: s, value: s }, s)))))
    : e('div', { className: 'tags' },
        e('span', { className: 'tag', style: { cursor: 'default' } }, typeLabel(meetType)),
        (d.tags || []).map((t) => e('button', {
          type: 'button', className: 'tag' + (meetTag === t ? ' active' : ''), key: t,
          onClick: () => onTag && onTag(t),
        }, t)))
  return e('div', null,
    e('div', { className: 'doc-head' },
      e('div', { style: { minWidth: 0, flex: 1 } },
        editing
          ? e(React.Fragment, null,
              e('input', { type: 'text', value: title, onChange: (ev) => setTitle(ev.target.value) }),
              e('input', { type: 'text', style: { marginTop: 8 }, value: attendees, onChange: (ev) => setAttendees(ev.target.value), placeholder: '参会人' }))
          : e(React.Fragment, null,
              e('h2', { className: 'detail-h' }, d.title),
              e('p', { className: 'meta-line' },
                [fmtDateTime(d.startTime), d.attendees, srcLabel(d.source), synced ? companyMark(d) : '', personal ? '个人不同步' : ''].filter(Boolean).join(' · '))),
        tagRow),
      e('div', { className: 'tools' }, tools)),
    e('div', { className: 'tabs' },
      e('button', { className: 'tab' + (sub === 'record' ? ' on' : ''), onClick: () => setSub('record') }, '记录'),
      e('button', { className: 'tab' + (sub === 'transcript' ? ' on' : ''), onClick: () => setSub('transcript') }, '逐字稿'),
      e('button', { className: 'tab' + (sub === 'deep' ? ' on' : ''), onClick: () => setSub('deep') }, '总结')),
    sub === 'record'
      ? (editing
          ? e('textarea', { id: 'e-sum', value: summary, onChange: (ev) => setSummary(ev.target.value) })
          : (d.summary ? e(Md, { text: d.summary }) : e('p', { className: 'hint' }, '还没有记录。')))
      : null,
    sub === 'transcript' ? e('div', { className: 'tx' }, txText || '没有逐字稿') : null,
    sub === 'deep'
      ? e('div', { className: 'deep-pane' },
          deeping
            ? e('p', { className: 'hint' }, '生成中…')
            : (editingDeep
                ? e('textarea', { id: 'e-deep', value: deep, onChange: (ev) => setDeep(ev.target.value) })
                : (deep
                    ? e(Md, { text: deep })
                    : e('div', { className: 'deep-empty' },
                        e('p', { className: 'hint' }, '还没有总结。根据逐字稿生成本机决策记录。')))),
          e('div', { className: 'deep-actions' },
            editingDeep
              ? [
                  e('button', { className: 'primary', key: 'ds', onClick: saveDeep, disabled: savingDeep || deeping }, savingDeep ? '保存中' : '保存总结'),
                  e('button', { className: 'quiet', key: 'dc', onClick: () => { setDeep(d.deepSummary || ''); setEditingDeep(false) } }, '取消'),
                ]
              : [
                  e('button', {
                    className: deep ? 'sync-pill' : 'primary',
                    key: 'gen',
                    onClick: doDeep,
                    disabled: deeping,
                    style: { marginLeft: 0 },
                  }, deeping ? '生成中' : (deep ? '重新生成' : '生成总结')),
                  deep && !deeping ? e('button', { className: 'quiet', key: 'ed', onClick: () => { setEditing(false); setEditingDeep(true) } }, '编辑') : null,
                  deep && !deeping ? e('button', { className: 'quiet', key: 'cp', onClick: () => copyDeep(deep) }, copied ? '已复制' : '复制') : null,
                ]))
      : null,
    e('div', { className: 'todo-strip' },
      e('h3', null, '待办'),
      (d.actions || []).length
        ? d.actions.map((t) => e('div', { className: 'todo-mini', key: t.id || t.title },
            e('span', null, t.title + (t.status === 'done' ? '（已关闭）' : '')),
            t.id ? e('button', { className: 'linkish', onClick: () => onJumpTodo && onJumpTodo(t.id) }, '待办') : null))
        : e('p', { className: 'hint' }, '本场没有待办'),
      addingTodo
        ? e('div', { className: 'inline-add', key: 'todo-in' },
            e('input', {
              type: 'text', placeholder: '待办事项', value: todoTitle,
              onChange: (ev) => setTodoTitle(ev.target.value),
              onKeyDown: (ev) => {
                if (ev.key === 'Enter') { ev.preventDefault(); submitMeetTodo() }
                if (ev.key === 'Escape') { ev.preventDefault(); setAddingTodo(false) }
              },
              autoFocus: true,
            }),
            e('input', {
              type: 'text', className: 'compact', placeholder: '责任人，可空', value: todoOwner,
              onChange: (ev) => setTodoOwner(ev.target.value),
              onKeyDown: (ev) => {
                if (ev.key === 'Enter') { ev.preventDefault(); submitMeetTodo() }
                if (ev.key === 'Escape') { ev.preventDefault(); setAddingTodo(false) }
              },
            }),
            e('button', { className: 'primary', type: 'button', disabled: todoBusy, onClick: submitMeetTodo }, todoBusy ? '添加中' : '添加'),
            e('button', { className: 'quiet', type: 'button', onClick: () => setAddingTodo(false) }, '取消'))
        : e('button', { className: 'quiet', onClick: () => { setAddingTodo(true); setTodoTitle(''); setTodoOwner('') } }, '+ 待办')),
    confirmDel ? e(ConfirmSheet, {
      title: '从本机移除',
      lede: '只删本机列表里的这场会。钉钉听记还在。本场记录、逐字稿、总结和待办都会从本机去掉，以后更新也不会再拉回来。',
      confirmLabel: '删除',
      danger: true,
      busy: delBusy,
      onConfirm: doRemove,
      onClose: () => { if (!delBusy) setConfirmDel(false) },
    }) : null,
    confirmDeep ? e(ConfirmSheet, {
      title: '重新生成总结',
      lede: '会覆盖本机已保存的总结，包括你改过的内容。钉钉听记不会改。',
      confirmLabel: '重新生成',
      onConfirm: runDeep,
      onClose: () => setConfirmDeep(false),
    }) : null,
    confirmSharedTitle ? e(ConfirmSheet, {
      title: '改分享场次的标题',
      lede: '这场会是别人分享的。同步到钉钉会改听记上的标题（你若有编辑权）。也可以只改本机列表。',
      confirmLabel: '同步到钉钉',
      altLabel: '只改本机',
      busy: saving,
      onConfirm: () => saveEdit({ sharedTitleDecided: true }),
      onAlt: () => saveEdit({ sharedTitleDecided: true, skipDingTalk: true }),
      onClose: () => setConfirmSharedTitle(false),
    }) : null)
}

export function ImportSheet(props) {
  const [title, setTitle] = React.useState('')
  const [date, setDate] = React.useState(() => ymd())
  const [body, setBody] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const submit = (ev) => {
    ev.stopPropagation()
    if (busy) return
    if (!body.trim()) { props.toast('先贴正文'); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { props.toast('选个会议日期'); return }
    setBusy(true)
    api('/api/import', { title, body, date }).then((r) => {
      props.toast('已导入')
      props.onImported(r.id)
    }).catch((err) => props.toast(String(err && err.message || err))).finally(() => setBusy(false))
  }
  return e(SheetFrame, { title: '导入', lede: '不是钉钉听记的纪要，贴进来成为一场会议。以后飞书等来源会和钉钉一样走「更新」。', onClose: props.onClose },
      e('textarea', { className: 'paste', placeholder: '粘贴纪要或转写', value: body, onChange: (ev) => setBody(ev.target.value) }),
      e('div', { className: 'field-row' },
        e('div', { className: 'field' }, e('span', null, '标题'), e('input', { type: 'text', placeholder: '这场会叫什么', value: title, onChange: (ev) => setTitle(ev.target.value) })),
        e('div', { className: 'field' }, e('span', null, '会议日期'), e('input', { type: 'date', value: date, onChange: (ev) => setDate(ev.target.value) }))),
      e('div', { className: 'sheet-actions' },
        e('button', { className: 'primary', onClick: submit, disabled: busy }, busy ? '导入中' : '导入'),
        e('button', { className: 'quiet', onClick: (ev) => { ev.stopPropagation(); props.onClose() } }, '取消')))
}

