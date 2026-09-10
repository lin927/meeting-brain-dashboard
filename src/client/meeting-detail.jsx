import React from 'react'
import { api, fallbackCopy } from './api.js'
import { MEETING_TYPES, companyMark, fmtDateTime, srcLabel, typeLabel, uploadBtnLabel, ymd } from './format.js'
import { ConfirmSheet, InlineComposer, Md, SheetFrame, CheckMark, TitleInput, TodoRowTitle } from './ui.jsx'

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
  const [editingBody, setEditingBody] = React.useState(null)
  const [title, setTitle] = React.useState('')
  const [attendees, setAttendees] = React.useState('')
  const [summary, setSummary] = React.useState('')
  const [txDraft, setTxDraft] = React.useState('')
  const [scope, setScope] = React.useState('')
  const [tags, setTags] = React.useState([])
  const [saving, setSaving] = React.useState(false)
  const [savingBody, setSavingBody] = React.useState(false)
  const [addingTag, setAddingTag] = React.useState(false)
  const [addingTodo, setAddingTodo] = React.useState(false)
  const [todoTitle, setTodoTitle] = React.useState('')
  const [todoOwner, setTodoOwner] = React.useState('')
  const [todoBusy, setTodoBusy] = React.useState(false)
  const [confirmDel, setConfirmDel] = React.useState(false)
  const [delBusy, setDelBusy] = React.useState(false)
  const [confirmDeep, setConfirmDeep] = React.useState(false)
  const [confirmSharedTitle, setConfirmSharedTitle] = React.useState(false)
  const [confirmRetract, setConfirmRetract] = React.useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = React.useState(false)
  const [pubRemote, setPubRemote] = React.useState(null)
  const [pubOperator, setPubOperator] = React.useState('')
  const [pubBusy, setPubBusy] = React.useState(false)
  const titleOnlyRef = React.useRef(false)
  const load = React.useCallback(() => {
    setD(null); setErr(null); setSub('record'); setDeep(''); setEditing(false); setEditingBody(null)
    setAddingTag(false); setAddingTodo(false); setConfirmDel(false); setConfirmDeep(false); setConfirmSharedTitle(false); setConfirmRetract(false); setConfirmOverwrite(false); setPubRemote(null)
    api('/api/detail?id=' + encodeURIComponent(uuid)).then((r) => {
      if (r && r.error) setErr(r.error)
      else {
        setD(r)
        setTitle(r.title || '')
        setAttendees(r.attendees || '')
        setSummary(r.summary || '')
        setTxDraft((r.transcript || []).join('\n'))
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
      setEditingBody(null)
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
    if (savingBody) return
    setSavingBody(true)
    api('/api/meeting', { id: uuid, deepSummary: deep }, 'PATCH').then((r) => {
      setD(r)
      setDeep(r && r.deepSummary != null ? r.deepSummary : deep)
      setEditingBody(null)
      toast('已保存到本机')
      if (onChanged) onChanged()
    }).catch((err) => toast(String(err && err.message || err))).finally(() => setSavingBody(false))
  }
  const cancelBody = () => {
    setSummary((d && d.summary) || '')
    setTxDraft(((d && d.transcript) || []).join('\n'))
    setDeep((d && d.deepSummary) || '')
    setEditingBody(null)
  }
  const startBodyEdit = () => {
    setEditing(false)
    setTitle((d && d.title) || '')
    setAttendees((d && d.attendees) || '')
    setScope((d && (d.type || d.scope)) || '')
    setTags((d && d.tags) || [])
    setSummary((d && d.summary) || '')
    setTxDraft(((d && d.transcript) || []).join('\n'))
    setDeep((d && d.deepSummary) || '')
    setEditingBody(sub)
  }
  const saveBody = () => {
    if (savingBody || deeping) return
    if (editingBody === 'deep') { saveDeep(); return }
    setSavingBody(true)
    const body = { id: uuid }
    if (editingBody === 'record') body.summary = summary
    if (editingBody === 'transcript') body.transcript = txDraft
    api('/api/meeting', body, 'PATCH').then((r) => {
      setD(r)
      setSummary((r && r.summary) || '')
      setTxDraft(((r && r.transcript) || []).join('\n'))
      setEditingBody(null)
      toast('已保存到本机')
      if (onChanged) onChanged()
    }).catch((err) => toast(String(err && err.message || err))).finally(() => setSavingBody(false))
  }
  const goSub = (id) => {
    if (editingBody) cancelBody()
    setSub(id)
  }
  const commitTitle = (opts) => {
    if (saving) return
    const next = String(title || '').trim()
    const prev = String((d && d.title) || '')
    if (!next) { setTitle(prev); toast('先写标题'); return }
    if (next === prev) return
    const shared = d && d.source === 'shared'
    if (shared && !(opts && opts.sharedTitleDecided)) {
      titleOnlyRef.current = true
      setConfirmSharedTitle(true)
      return
    }
    setConfirmSharedTitle(false)
    setSaving(true)
    const body = { id: uuid, title: next }
    if (opts && opts.skipDingTalk) body.skipDingTalk = true
    api('/api/meeting', body, 'PATCH').then((r) => {
      setD(r)
      setTitle((r && r.title) || next)
      if (r && r.dingTalkTitle && r.dingTalkTitle.message) toast(r.dingTalkTitle.message)
      if (onChanged) onChanged()
    }).catch((err) => toast(String(err && err.message || err))).finally(() => setSaving(false))
  }
  const saveEdit = (opts) => {
    if (saving) return
    const titleChanged = String(title).trim() !== String((d && d.title) || '')
    const shared = d && d.source === 'shared'
    if (titleChanged && shared && !(opts && opts.sharedTitleDecided)) {
      titleOnlyRef.current = false
      setConfirmSharedTitle(true)
      return
    }
    setConfirmSharedTitle(false)
    setSaving(true)
    const body = { id: uuid, title: String(title || '').trim() || d.title, attendees, type: scope, tags }
    if (opts && opts.skipDingTalk) body.skipDingTalk = true
    api('/api/meeting', body, 'PATCH').then((r) => {
      setD(r); setEditing(false)
      if (r && r.title) setTitle(r.title)
      if (r && r.dingTalkTitle && r.dingTalkTitle.message) toast(r.dingTalkTitle.message)
      else if (scope === '个人' && d && d.visibility === 'company') toast('已保存，个人会议已取消上传')
      else toast('已保存')
      if (onChanged) onChanged()
    }).catch((err) => setErr(String(err && err.message || err))).finally(() => setSaving(false))
  }
  const doPublish = (visibility, extra) => {
    if (!d || pubBusy) return
    const t = d.type || d.scope
    setPubBusy(true)
    api('/api/publish', { id: uuid, visibility, ...(extra || {}) }).then((r) => {
      if (r && r.needsOverwrite) {
        setPubRemote(r.existing || null)
        setPubOperator(r.operator || '')
        setConfirmOverwrite(true)
        return
      }
      setConfirmRetract(false)
      setConfirmOverwrite(false)
      toast(r.message || (visibility === 'company' ? (uploadBtnLabel(t) || '已上传') : '已取消上传'))
      load()
      if (onChanged) onChanged()
    }).catch((err) => toast(String(err && err.message || err))).finally(() => setPubBusy(false))
  }
  const togglePublish = () => {
    if (!d || pubBusy) return
    const t = d.type || d.scope
    if (t === '个人') { toast('个人会议不上传'); return }
    if (!t) { toast('先选类型再上传'); return }
    if (d.visibility === 'company') {
      setPubBusy(true)
      api('/api/publish/status?id=' + encodeURIComponent(uuid)).then((st) => {
        setPubRemote(st.remote || null)
        setPubOperator(st.operator || '')
        setConfirmRetract(true)
      }).catch((err) => toast(String(err && err.message || err))).finally(() => setPubBusy(false))
      return
    }
    doPublish('company')
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
  const toggleMeetTodo = (t) => {
    if (!t.id) return
    const next = t.status === 'done' ? 'open' : 'done'
    setD((prev) => prev ? {
      ...prev,
      actions: (prev.actions || []).map((a) => a.id === t.id ? { ...a, status: next } : a),
    } : prev)
    api('/api/todos', { id: t.id, status: next }, 'PATCH').catch((err) => {
      setD((prev) => prev ? {
        ...prev,
        actions: (prev.actions || []).map((a) => a.id === t.id ? { ...a, status: t.status } : a),
      } : prev)
      toast(String(err && err.message || err))
    })
  }
  const saveMeetTodoTitle = (t, next) => {
    if (!t.id) return
    const prevTitle = t.title
    setD((p) => p ? {
      ...p,
      actions: (p.actions || []).map((a) => a.id === t.id ? { ...a, title: next } : a),
    } : p)
    api('/api/todos', { id: t.id, title: next }, 'PATCH').catch((err) => {
      setD((p) => p ? {
        ...p,
        actions: (p.actions || []).map((a) => a.id === t.id ? { ...a, title: prevTitle } : a),
      } : p)
      toast(String(err && err.message || err))
    })
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
        e('button', { className: 'quiet', key: 'c', onClick: () => {
          setTitle((d && d.title) || '')
          setAttendees((d && d.attendees) || '')
          setScope((d && (d.type || d.scope)) || '')
          setTags((d && d.tags) || [])
          setEditing(false)
        } }, '取消'),
      ]
    : [
        e('button', { className: 'quiet', key: 'e', onClick: () => { cancelBody(); setEditing(true) } }, '编辑'),
        e('button', { className: 'quiet danger', key: 'del', onClick: removeLocal }, '删除'),
        personal
          ? e('span', { className: 'meta', key: 'p', style: { margin: '0 0 0 8px' } }, '个人不上传')
          : (!canPub
              ? e('span', { className: 'meta', key: 'need', style: { margin: '0 0 0 8px' } }, '先选类型')
              : e('button', {
                  className: 'sync-pill' + (synced ? ' on' : ''),
                  key: 'pub',
                  disabled: pubBusy,
                  onClick: togglePublish,
                }, pubBusy
                  ? ((confirmRetract || confirmOverwrite)
                    ? (synced ? '撤回中…' : '上传中…')
                    : (synced ? '查询中…' : '上传中…'))
                  : (synced ? companyMark(d) || '已上传' : (uploadBtnLabel(meetType) || '上传')))),
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
        e('div', { className: 'field', style: { marginTop: 10 } },
          e('span', null, '类型'),
          e('div', { className: 'cat-pills' },
            e('button', {
              type: 'button', key: 'none', className: !scope ? 'on' : '',
              onClick: () => setScope(''),
            }, '未定'),
            MEETING_TYPES.map((s) => e('button', {
              type: 'button', key: s, className: scope === s ? 'on' : '',
              onClick: () => setScope(s),
            }, s)))))
    : e('div', { className: 'tags' },
        e('span', { className: 'tag', style: { cursor: 'default' } }, typeLabel(meetType)),
        (d.tags || []).map((t) => e('button', {
          type: 'button', className: 'tag' + (meetTag === t ? ' active' : ''), key: t,
          onClick: () => onTag && onTag(t),
        }, t)))
  const tabActions = (() => {
    if (editingBody) {
      return [
        e('button', { className: 'primary', key: 's', onClick: saveBody, disabled: savingBody || deeping }, savingBody ? '保存中' : '保存'),
        e('button', { className: 'quiet', key: 'c', onClick: cancelBody, disabled: savingBody }, '取消'),
      ]
    }
    const items = [e('button', { className: 'sync-pill', key: 'e', onClick: startBodyEdit, disabled: deeping }, '编辑')]
    if (sub === 'deep' && deep) {
      items.unshift(e('button', {
        className: 'sync-pill', key: 'gen', onClick: doDeep, disabled: deeping,
      }, deeping ? '生成中' : '重新生成'))
      items.push(e('button', { className: 'quiet', key: 'cp', onClick: () => copyDeep(deep), disabled: deeping }, copied ? '已复制' : '复制'))
    }
    return items
  })()
  const bodyHint = editingBody === 'transcript'
    ? '行首【姓名】尽量保留，生成总结还靠它。'
    : (editingBody
      ? '只保存在本机，不写回钉钉。'
      : (sub === 'record' && d.summaryEdited
        ? '本机改过，听记再拉也不会盖掉。'
        : (sub === 'transcript' && d.transcriptEdited
          ? '本机改过，听记再拉也不会盖掉。'
          : '')))
  return e('div', null,
    e('div', { className: 'doc-head' },
      e('div', { style: { minWidth: 0, flex: 1 } },
        e(TitleInput, {
          value: title,
          placeholder: '会议标题',
          onChange: setTitle,
          onCommit: commitTitle,
          onCancel: () => setTitle((d && d.title) || ''),
        }),
        editing
          ? e('input', { type: 'text', style: { marginTop: 8 }, value: attendees, onChange: (ev) => setAttendees(ev.target.value), placeholder: '参会人' })
          : e('p', { className: 'meta-line' },
            [fmtDateTime(d.startTime), d.attendees, srcLabel(d.source), synced ? companyMark(d) : '', personal ? '个人不上传' : ''].filter(Boolean).join(' · ')),
        tagRow),
      e('div', { className: 'tools' }, tools)),
    e('div', { className: 'tabs' },
      e('button', { className: 'tab' + (sub === 'record' ? ' on' : ''), onClick: () => goSub('record') }, '记录'),
      e('button', { className: 'tab' + (sub === 'transcript' ? ' on' : ''), onClick: () => goSub('transcript') }, '逐字稿'),
      e('button', { className: 'tab' + (sub === 'deep' ? ' on' : ''), onClick: () => goSub('deep') }, '总结'),
      e('div', { className: 'tabs-actions' }, tabActions)),
    sub === 'record'
      ? e('div', { className: 'body-pane' },
          editingBody === 'record'
            ? e('textarea', { className: 'body-edit', value: summary, onChange: (ev) => setSummary(ev.target.value) })
            : (d.summary ? e(Md, { text: d.summary }) : e('p', { className: 'hint' }, '还没有记录。')),
          bodyHint ? e('p', { className: 'hint body-hint' }, bodyHint) : null)
      : null,
    sub === 'transcript'
      ? e('div', { className: 'body-pane' },
          editingBody === 'transcript'
            ? e('textarea', { className: 'body-edit tx-edit', value: txDraft, onChange: (ev) => setTxDraft(ev.target.value) })
            : e('div', { className: 'tx' }, txText || '没有逐字稿'),
          bodyHint ? e('p', { className: 'hint body-hint' }, bodyHint) : null)
      : null,
    sub === 'deep'
      ? e('div', { className: 'body-pane' },
          deeping
            ? e('p', { className: 'hint' }, '生成中…')
            : (editingBody === 'deep'
                ? e('textarea', { className: 'body-edit', value: deep, onChange: (ev) => setDeep(ev.target.value) })
                : (deep
                    ? e(Md, { text: deep })
                    : e('div', { className: 'deep-empty' },
                        e('p', { className: 'hint' }, '还没有总结。根据逐字稿生成本机决策记录。'),
                        e('button', { className: 'primary', onClick: doDeep, disabled: deeping }, '生成总结')))),
          bodyHint ? e('p', { className: 'hint body-hint' }, bodyHint) : null)
      : null,
    e('div', { className: 'todo-strip' },
      e('h3', null, '待办'),
      (d.actions || []).length
        ? d.actions.map((t) => e('div', { className: 'todo-mini' + (t.status === 'done' ? ' closed' : ''), key: t.id || t.title },
            t.id
              ? e(CheckMark, {
                  on: t.status === 'done',
                  onClick: (ev) => {
                    ev.stopPropagation()
                    toggleMeetTodo(t)
                  },
                })
              : e('span', { className: 'check', style: { visibility: 'hidden' } }),
            t.id
              ? e(TodoRowTitle, { title: t.title, toast, onSave: (next) => saveMeetTodoTitle(t, next) })
              : e('span', { className: 'todo-mini-title' }, t.title),
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
    confirmRetract ? e(ConfirmSheet, {
      title: '撤回公司知识库',
      lede: (() => {
        const who = pubRemote && pubRemote.uploadedBy
        const other = who && pubOperator && who !== pubOperator
        if (other) return '这篇是' + who + '上传的。撤回会从「' + (meetType || '对应') + '」知识库删掉现在这一份。本机记录、总结和待办都还在。'
        return '会从「' + (meetType || '对应') + '」知识库删掉这场会那一篇。本机记录、总结和待办都还在。'
      })(),
      confirmLabel: '撤回',
      danger: true,
      busy: pubBusy,
      onConfirm: () => doPublish('private'),
      onClose: () => { if (!pubBusy) setConfirmRetract(false) },
    }) : null,
    confirmOverwrite ? e(ConfirmSheet, {
      title: '覆盖已有文档',
      lede: (() => {
        const who = pubRemote && pubRemote.uploadedBy
        const when = pubRemote && pubRemote.uploadedAt ? fmtDateTime(Date.parse(pubRemote.uploadedAt)) : ''
        const whoWhen = [who, when].filter(Boolean).join(' · ')
        if (whoWhen) return '知识库里已有这篇（' + whoWhen + '）。覆盖会换成你这份总结和待办。'
        return '知识库里已有这篇。覆盖会换成你这份总结和待办。'
      })(),
      confirmLabel: '覆盖',
      danger: true,
      busy: pubBusy,
      onConfirm: () => doPublish('company', { overwrite: true }),
      onClose: () => { if (!pubBusy) setConfirmOverwrite(false) },
    }) : null,
    confirmSharedTitle ? e(ConfirmSheet, {
      title: '改分享场次的标题',
      lede: '这场会是别人分享的。同步到钉钉会改听记上的标题（你若有编辑权）。也可以只改本机列表。',
      confirmLabel: '同步到钉钉',
      altLabel: '只改本机',
      busy: saving,
      onConfirm: () => titleOnlyRef.current
        ? commitTitle({ sharedTitleDecided: true })
        : saveEdit({ sharedTitleDecided: true }),
      onAlt: () => titleOnlyRef.current
        ? commitTitle({ sharedTitleDecided: true, skipDingTalk: true })
        : saveEdit({ sharedTitleDecided: true, skipDingTalk: true }),
      onClose: () => {
        if (saving) return
        setTitle((d && d.title) || '')
        setConfirmSharedTitle(false)
      },
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

