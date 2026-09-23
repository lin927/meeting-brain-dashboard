import React, { useEffect, useRef, useState } from 'react'
import { srcMark } from './format.js'

const e = React.createElement

export function CheckMark(props) {
  const on = !!props.on
  return (
    <button
      type="button"
      className={'check' + (on ? ' on' : '')}
      aria-pressed={on}
      aria-label={on ? '恢复' : '完成'}
      onClick={(ev) => {
        ev.stopPropagation()
        if (props.onClick) props.onClick(ev)
      }}
    />
  )
}

export function SourceMark(props) {
  const mark = srcMark(props.source, props.provider)
  if (!mark.label) return null
  return <span className={'src-mark src-' + mark.id}>{mark.label}</span>
}

export function TitleInput(props) {
  const skipCommit = useRef(false)
  const inner = useRef(null)
  const setRef = (el) => {
    inner.current = el
    if (typeof props.inputRef === 'function') props.inputRef(el)
    else if (props.inputRef) props.inputRef.current = el
  }
  const grow = () => {
    const el = inner.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }
  useEffect(() => { grow() }, [props.value])
  return (
    <textarea
      ref={setRef}
      rows={1}
      className={'title-input' + (props.className ? ' ' + props.className : '')}
      value={props.value}
      placeholder={props.placeholder || ''}
      autoFocus={!!props.autoFocus}
      onFocus={() => { if (props.onFocus) props.onFocus() }}
      onChange={(ev) => {
        props.onChange(ev.target.value)
        requestAnimationFrame(grow)
      }}
      onBlur={() => {
        if (skipCommit.current) { skipCommit.current = false; return }
        if (props.onCommit) props.onCommit()
      }}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault()
          if (props.onEnter) props.onEnter()
          else ev.currentTarget.blur()
        }
        if (ev.key === 'Escape') {
          ev.preventDefault()
          skipCommit.current = true
          if (props.onCancel) props.onCancel()
          ev.currentTarget.blur()
        }
      }}
    />
  )
}

export function TodoRowTitle(props) {
  const [draft, setDraft] = useState(props.title)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setDraft(props.title)
  }, [props.title])
  return (
    <TitleInput
      className={'title-input-row' + (props.className ? ' ' + props.className : '')}
      value={draft}
      onFocus={() => {
        focused.current = true
        if (props.onFocus) props.onFocus()
      }}
      onChange={setDraft}
      onCommit={() => {
        focused.current = false
        const next = draft.trim()
        if (!next) {
          setDraft(props.title)
          if (props.toast) props.toast('先写待办事项')
          return
        }
        if (next !== props.title) props.onSave(next)
      }}
      onCancel={() => {
        focused.current = false
        setDraft(props.title)
      }}
    />
  )
}

export function useEscape(onClose) {
  useEffect(() => {
    if (!onClose) return undefined
    const onKey = (ev) => { if (ev.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

export function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function SheetFrame(props) {
  useEscape(props.onClose)
  return (
    <div className="veil" onClick={props.onClose}>
      <div className={'sheet' + (props.narrow ? ' narrow' : '')} onClick={(ev) => ev.stopPropagation()}>
        {props.title ? <h2>{props.title}</h2> : null}
        {props.lede ? <p className="lede">{props.lede}</p> : null}
        {props.children}
      </div>
    </div>
  )
}

export function ConfirmSheet(props) {
  const cancelRef = useRef(null)
  useEffect(() => { if (cancelRef.current) cancelRef.current.focus() }, [])
  return (
    <SheetFrame title={props.title} lede={props.lede} onClose={props.onClose} narrow>
      <div className="sheet-actions">
        <button
          className={props.danger ? 'primary danger' : 'primary'}
          onClick={props.onConfirm}
          disabled={props.busy}
        >
          {props.busy ? (props.busyLabel || '处理中') : (props.confirmLabel || '确定')}
        </button>
        {props.altLabel
          ? <button className="quiet" onClick={props.onAlt} disabled={props.busy}>{props.altLabel}</button>
          : null}
        <button className="quiet" ref={cancelRef} onClick={props.onClose} disabled={props.busy}>取消</button>
      </div>
    </SheetFrame>
  )
}

export function InlineComposer(props) {
  const [val, setVal] = useState('')
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.focus() }, [])
  const submit = () => {
    const t = val.trim()
    if (!t) return
    props.onSubmit(t)
  }
  return (
    <span className="inline-add" style={props.style || null}>
      <input
        ref={ref}
        type="text"
        className={props.compact ? 'compact' : undefined}
        placeholder={props.placeholder || ''}
        value={val}
        onChange={(ev) => setVal(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') { ev.preventDefault(); submit() }
          if (ev.key === 'Escape') { ev.preventDefault(); props.onCancel() }
        }}
      />
      <button className="primary" type="button" onClick={submit}>{props.submitLabel || '添加'}</button>
      <button className="quiet" type="button" onClick={props.onCancel}>取消</button>
    </span>
  )
}

function renderInline(text, key, linkMap, onMeetingClick) {
  const out = []
  const parts = String(text).split(/\*\*(.+?)\*\*/g)
  parts.forEach((p, i) => {
    if (i % 2 === 1) { out.push(e('strong', { className: 'md-b', key: key + '-b' + i }, p)); return }
    if (!p) return
    const segs = p.split(/(\[[^\]]+\])/g)
    segs.forEach((seg, j) => {
      if (!seg) return
      const m = seg.match(/^\[(.+)\]$/)
      if (m && linkMap && linkMap[m[1]] !== undefined) {
        out.push(e('span', { key: key + '-l' + i + '-' + j, className: 'linkish', onClick: () => onMeetingClick && onMeetingClick(linkMap[m[1]]) }, m[1]))
      } else {
        out.push(seg)
      }
    })
  })
  return out
}

export function Md(props) {
  const text = props.text
  const linkMap = props.linkMap
  const onMeetingClick = props.onMeetingClick
  if (!text) return e('div', null)
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
        blocks.push(e('div', { className: cls, key: 'b' + blocks.length }, ri(m[2], 'b' + blocks.length)))
        i++; continue
      }
    }
    if (t.startsWith('>')) {
      blocks.push(e('div', { className: 'md-quote', key: 'q' + blocks.length }, ri(t.replace(/^>\s?/, ''), 'q' + blocks.length)))
      i++; continue
    }
    if (t.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++ }
      const splitRow = (r) => {
        const parts = r.split('|')
        if (parts[0] === '') parts.shift()
        if (parts[parts.length - 1] === '') parts.pop()
        return parts.map((c) => c.trim())
      }
      const isSep = (r) => splitRow(r).every((c) => /^:?-{2,}:?$/.test(c))
      const parsed = rows.filter((r) => !isSep(r)).map(splitRow)
      if (parsed.length > 0) {
        const keyBase = 'tbl' + blocks.length
        const head = parsed[0]
        const body = parsed.slice(1)
        blocks.push(e('table', { className: 'mbdg-table', key: keyBase },
          e('thead', null, e('tr', null, head.map((c, ci) => e('th', { key: ci }, ri(c, keyBase + '-h' + ci))))),
          e('tbody', null, body.map((row, riRow) => e('tr', { key: riRow }, row.map((c, ci) => e('td', { key: ci }, ri(c, keyBase + '-' + riRow + '-' + ci))))))))
      }
      continue
    }
    if (/^[-*]\s/.test(t) || /^\d+\.\s/.test(t)) {
      blocks.push(e('div', { className: 'md-li', key: 'l' + blocks.length }, ri(t.replace(/^[-*]\s/, '• ').replace(/^\d+\.\s/, ''), 'l' + blocks.length)))
      i++; continue
    }
    if (/^```/.test(t)) {
      i++
      const code = []
      while (i < lines.length && !/^```/.test(lines[i].trim())) { code.push(lines[i]); i++ }
      i++
      blocks.push(e('pre', { className: 'md-code', key: 'c' + blocks.length, style: { whiteSpace: 'pre-wrap', padding: 8 } }, code.join('\n')))
      continue
    }
    if (t === '') { i++; continue }
    if (/^!\[.*\]\(.*\)$/.test(t)) { i++; continue }
    blocks.push(e('div', { className: 'md-p', key: 'p' + blocks.length }, ri(line, 'p' + blocks.length)))
    i++
  }
  return e('div', null, blocks)
}
