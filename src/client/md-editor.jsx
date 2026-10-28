import React, { useEffect, useRef, useState } from 'react'
import { EditorSelection, Prec } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import { search, SearchQuery, setSearchQuery, getSearchQuery, findNext, findPrevious, replaceNext, replaceAll, openSearchPanel, closeSearchPanel } from '@codemirror/search'
import { tags } from '@lezer/highlight'
import { Md } from './ui.jsx'

const PREFIX_RE = /^(#{1,3}\s+|>\s+|[-*]\s+|\d+\.\s+)/

function modLabel() {
  if (typeof navigator === 'undefined') return 'Ctrl+'
  return /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘' : 'Ctrl+'
}

function stripMdPrefix(text) {
  return String(text || '').replace(PREFIX_RE, '')
}

function lineKind(text) {
  if (/^###\s+/.test(text)) return 'h3'
  if (/^##\s+/.test(text)) return 'h2'
  if (/^#\s+/.test(text)) return 'h1'
  if (/^>\s?/.test(text)) return 'quote'
  if (/^[-*]\s+/.test(text)) return 'ul'
  if (/^\d+\.\s+/.test(text)) return 'ol'
  return ''
}

function headingLevel(text) {
  const m = String(text || '').match(/^(#{1,3})\s+/)
  return m ? m[1].length : 0
}

function hasWrap(state, from, to, before, after = before) {
  const inner = state.sliceDoc(from, to)
  if (inner.startsWith(before) && inner.endsWith(after) && inner.length >= before.length + after.length) return true
  if (from >= before.length && to + after.length <= state.doc.length) {
    const outer = state.sliceDoc(from - before.length, to + after.length)
    if (outer.startsWith(before) && outer.endsWith(after)) return true
  }
  return false
}

function readMarks(view) {
  if (!view) return { bold: false, italic: false, h: 0, ul: false, ol: false, quote: false }
  const sel = view.state.selection.main
  const line = view.state.doc.lineAt(sel.from)
  const kind = lineKind(line.text)
  const bold = hasWrap(view.state, sel.from, sel.to, '**')
  return {
    bold,
    italic: !bold && hasWrap(view.state, sel.from, sel.to, '*'),
    h: headingLevel(line.text),
    ul: kind === 'ul',
    ol: kind === 'ol',
    quote: kind === 'quote',
  }
}

function wrapInline(view, before, after = before) {
  const sel = view.state.selection.main
  const from = sel.from
  const to = sel.to
  const text = view.state.sliceDoc(from, to)
  const beforeLen = before.length
  const afterLen = after.length
  if (text.startsWith(before) && text.endsWith(after) && text.length >= beforeLen + afterLen) {
    const inner = text.slice(beforeLen, text.length - afterLen)
    view.dispatch({
      changes: { from, to, insert: inner },
      selection: { anchor: from, head: from + inner.length },
    })
    view.focus()
    return
  }
  const outerFrom = from - beforeLen
  const outerTo = to + afterLen
  if (outerFrom >= 0 && outerTo <= view.state.doc.length) {
    const outer = view.state.sliceDoc(outerFrom, outerTo)
    if (outer === before + text + after) {
      view.dispatch({
        changes: { from: outerFrom, to: outerTo, insert: text },
        selection: { anchor: outerFrom, head: outerFrom + text.length },
      })
      view.focus()
      return
    }
  }
  view.dispatch({
    changes: { from, to, insert: before + text + after },
    selection: text
      ? { anchor: from + beforeLen, head: from + beforeLen + text.length }
      : { anchor: from + beforeLen },
  })
  view.focus()
}

function applyLineTransform(view, fn) {
  const { state } = view
  const sel = state.selection.main
  const fromLine = state.doc.lineAt(sel.from)
  const toLine = state.doc.lineAt(sel.to)
  const changes = []
  let delta = 0
  for (let n = fromLine.number; n <= toLine.number; n++) {
    const line = state.doc.line(n)
    const next = fn(line.text, n - fromLine.number)
    if (next !== line.text) {
      changes.push({ from: line.from, to: line.to, insert: next })
      delta += next.length - line.text.length
    }
  }
  if (!changes.length) {
    view.focus()
    return
  }
  view.dispatch({
    changes,
    selection: EditorSelection.range(fromLine.from, toLine.to + delta),
    scrollIntoView: true,
  })
  view.focus()
}

function cycleHeading(view) {
  const { state } = view
  const sel = state.selection.main
  const fromLine = state.doc.lineAt(sel.from)
  const toLine = state.doc.lineAt(sel.to)
  const levels = []
  for (let n = fromLine.number; n <= toLine.number; n++) levels.push(headingLevel(state.doc.line(n).text))
  const allSame = levels.every((lv) => lv === levels[0])
  const cur = allSame ? levels[0] : 0
  const next = cur === 0 ? 2 : (cur === 2 ? 3 : (cur === 3 ? 1 : 0))
  const prefix = next ? '#'.repeat(next) + ' ' : ''
  applyLineTransform(view, (text) => prefix + stripMdPrefix(text))
}

function toggleLineKind(view, kind) {
  const { state } = view
  const sel = state.selection.main
  const fromLine = state.doc.lineAt(sel.from)
  const toLine = state.doc.lineAt(sel.to)
  let allOn = true
  for (let n = fromLine.number; n <= toLine.number; n++) {
    if (lineKind(state.doc.line(n).text) !== kind) { allOn = false; break }
  }
  applyLineTransform(view, (text, i) => {
    const body = stripMdPrefix(text)
    if (allOn) return body
    if (kind === 'ul') return '- ' + body
    if (kind === 'ol') return (i + 1) + '. ' + body
    if (kind === 'quote') return '> ' + body
    return text
  })
}

function countMatches(view) {
  if (!view) return { current: 0, total: 0 }
  const q = getSearchQuery(view.state)
  if (!q || !q.valid || !q.search) return { current: 0, total: 0 }
  const sel = view.state.selection.main
  const cursor = q.getCursor(view.state)
  let total = 0
  let current = 0
  for (let step = cursor.next(); !step.done; step = cursor.next()) {
    total++
    const match = step.value
    if (!match) continue
    if (sel.from >= match.from && sel.to <= match.to) current = total
    else if (sel.empty && sel.head >= match.from && sel.head <= match.to) current = total
  }
  return { current, total }
}

function selectedFindSeed(view) {
  if (!view) return ''
  const sel = view.state.selection.main
  if (sel.empty) return ''
  const text = view.state.sliceDoc(sel.from, sel.to)
  if (!text || text.includes('\n')) return ''
  return text.slice(0, 120)
}

const mdHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontFamily: '"Noto Serif SC", serif', fontWeight: '700', fontSize: '1.15em' },
  { tag: tags.heading2, fontWeight: '700', fontSize: '1.05em' },
  { tag: tags.heading3, fontWeight: '600' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.quote, color: '#5c5348' },
  { tag: tags.processingInstruction, color: '#8a7d6c' },
  { tag: tags.monospace, fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.92em' },
  { tag: tags.link, color: '#9c2b1a' },
  { tag: tags.meta, color: '#8a7d6c' },
])

function hiddenSearchPanel() {
  const dom = document.createElement('div')
  dom.className = 'md-editor-cm-search'
  dom.style.display = 'none'
  return { dom, top: true }
}

const paperTheme = EditorView.theme({
  '&': {
    backgroundColor: '#fffdf8',
    color: '#1b1712',
    fontSize: '14px',
    height: '100%',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': {
    fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif',
    lineHeight: '1.65',
    padding: '10px 12px',
    caretColor: '#1b1712',
  },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'inherit' },
  '.cm-gutters': { display: 'none' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: '#e4d4b8 !important',
  },
  '.cm-searchMatch': { backgroundColor: '#ead8a8' },
  '.cm-searchMatch-selected': { backgroundColor: '#d4b56a' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#1b1712' },
})

function BarBtn(props) {
  return (
    <button
      type="button"
      className={'md-editor-btn' + (props.on ? ' on' : '') + (props.className ? ' ' + props.className : '')}
      title={props.title || ''}
      disabled={!!props.disabled}
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={props.onClick}
    >{props.children}</button>
  )
}

export function MdEditor(props) {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const findRef = useRef(null)
  const replaceRef = useRef(null)
  const onChangeRef = useRef(props.onChange)
  const onSaveRef = useRef(props.onSave)
  const findStateRef = useRef({ find: '', replace: '', caseSensitive: false, wholeWord: false, findOpen: false })
  const openFindRef = useRef(() => {})
  onChangeRef.current = props.onChange
  onSaveRef.current = props.onSave

  const [preview, setPreview] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [marks, setMarks] = useState({ bold: false, italic: false, h: 0, ul: false, ol: false, quote: false })
  const [matchInfo, setMatchInfo] = useState({ current: 0, total: 0 })
  const [draft, setDraft] = useState(() => String(props.value || ''))
  findStateRef.current = { find, replace, caseSensitive, wholeWord, findOpen }

  const pushQuery = (view, nextFind, nextReplace, nextCase, nextWord) => {
    if (!view) return
    const q = new SearchQuery({
      search: nextFind,
      replace: nextReplace,
      caseSensitive: nextCase,
      wholeWord: nextWord,
      regexp: false,
      literal: true,
    })
    view.dispatch({ effects: setSearchQuery.of(q) })
    const info = countMatches(view)
    setMatchInfo(info)
    if (q.valid && info.total && !info.current) {
      findNext(view)
      setMatchInfo(countMatches(view))
    }
  }

  const openFind = (opts) => {
    const view = viewRef.current
    const st = findStateRef.current
    const seed = selectedFindSeed(view)
    setPreview(false)
    setFindOpen(true)
    if (seed) setFind(seed)
    if (view) openSearchPanel(view)
    pushQuery(view, seed || st.find, st.replace, st.caseSensitive, st.wholeWord)
    requestAnimationFrame(() => {
      const el = opts && opts.replace ? replaceRef.current : findRef.current
      if (el) {
        el.focus()
        el.select()
      }
    })
  }
  openFindRef.current = openFind

  const closeFind = () => {
    const view = viewRef.current
    setFindOpen(false)
    if (view) {
      view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: '' })) })
      closeSearchPanel(view)
      view.focus()
    }
    setMatchInfo({ current: 0, total: 0 })
  }

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const view = new EditorView({
      doc: String(props.value || ''),
      parent: host,
      extensions: [
        history(),
        markdown({ addKeymap: false }),
        syntaxHighlighting(mdHighlight),
        search({ top: true, createPanel: hiddenSearchPanel }),
        EditorView.lineWrapping,
        paperTheme,
        Prec.high(keymap.of([
          {
            key: 'Mod-b',
            preventDefault: true,
            run: (v) => { wrapInline(v, '**'); return true },
          },
          {
            key: 'Mod-i',
            preventDefault: true,
            run: (v) => { wrapInline(v, '*'); return true },
          },
          {
            key: 'Mod-f',
            preventDefault: true,
            run: () => { openFindRef.current(); return true },
          },
          {
            key: 'Mod-h',
            preventDefault: true,
            run: () => { openFindRef.current({ replace: true }); return true },
          },
          {
            key: 'Mod-g',
            preventDefault: true,
            run: (v) => findNext(v),
          },
          {
            key: 'Shift-Mod-g',
            preventDefault: true,
            run: (v) => findPrevious(v),
          },
          {
            key: 'F3',
            preventDefault: true,
            run: (v) => findNext(v),
          },
          {
            key: 'Shift-F3',
            preventDefault: true,
            run: (v) => findPrevious(v),
          },
          {
            key: 'Mod-s',
            preventDefault: true,
            run: () => {
              if (onSaveRef.current) onSaveRef.current()
              return true
            },
          },
          {
            key: 'Escape',
            run: () => {
              if (findStateRef.current.findOpen) {
                closeFind()
                return true
              }
              return false
            },
          },
        ])),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const text = update.state.doc.toString()
            setDraft(text)
            if (onChangeRef.current) onChangeRef.current(text)
          }
          if (update.docChanged || update.selectionSet) {
            setMarks(readMarks(update.view))
            setMatchInfo(countMatches(update.view))
          }
        }),
        EditorView.contentAttributes.of({ spellcheck: 'false' }),
      ],
    })
    viewRef.current = view
    setMarks(readMarks(view))
    setDraft(view.state.doc.toString())
    requestAnimationFrame(() => view.focus())
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Mount once with the value at edit start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    pushQuery(view, findOpen ? find : '', replace, caseSensitive, wholeWord)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [find, replace, caseSensitive, wholeWord, findOpen])

  const mod = modLabel()
  const canFind = !!String(find || '').trim()
  const run = (fn) => {
    const view = viewRef.current
    if (!view) return
    fn(view)
  }

  const onWrapKey = (ev) => {
    const modKey = ev.metaKey || ev.ctrlKey
    if (!modKey) {
      if (ev.key === 'Escape' && findOpen) {
        ev.preventDefault()
        closeFind()
      }
      return
    }
    const k = ev.key.toLowerCase()
    if (k === 's') {
      ev.preventDefault()
      if (onSaveRef.current) onSaveRef.current()
    } else if (k === 'f') {
      ev.preventDefault()
      openFind()
    } else if (k === 'h') {
      ev.preventDefault()
      openFind({ replace: true })
    }
  }

  return (
    <div className="md-editor" onKeyDown={onWrapKey}>
      <div className="md-editor-bar">
        <BarBtn title={'标题 循环 二/三/一级'} on={marks.h > 0} disabled={preview} onClick={() => run(cycleHeading)}>标题</BarBtn>
        <BarBtn title={'加粗 ' + mod + 'B'} on={marks.bold} disabled={preview} onClick={() => run((v) => wrapInline(v, '**'))}>加粗</BarBtn>
        <BarBtn title={'斜体 ' + mod + 'I'} on={marks.italic} disabled={preview} onClick={() => run((v) => wrapInline(v, '*'))}>斜体</BarBtn>
        <BarBtn title="无序列表" on={marks.ul} disabled={preview} onClick={() => run((v) => toggleLineKind(v, 'ul'))}>列表</BarBtn>
        <BarBtn title="有序列表" on={marks.ol} disabled={preview} onClick={() => run((v) => toggleLineKind(v, 'ol'))}>编号</BarBtn>
        <BarBtn title="引用" on={marks.quote} disabled={preview} onClick={() => run((v) => toggleLineKind(v, 'quote'))}>引用</BarBtn>
        <span className="md-editor-sep" />
        <BarBtn title={'查找 ' + mod + 'F'} on={findOpen} disabled={preview} onClick={() => (findOpen ? closeFind() : openFind())}>查找</BarBtn>
        <BarBtn title={'替换 ' + mod + 'H'} on={findOpen} disabled={preview} onClick={() => openFind({ replace: true })}>替换</BarBtn>
        <BarBtn className="md-editor-grow" title="按现在的写法看排版" on={preview} onClick={() => {
          setPreview((v) => {
            if (!v) setFindOpen(false)
            else requestAnimationFrame(() => viewRef.current && viewRef.current.focus())
            return !v
          })
        }}>预览</BarBtn>
      </div>
      {findOpen && !preview ? (
        <div className="md-editor-find">
          <div className="md-editor-find-row">
            <input
              ref={findRef}
              type="text"
              placeholder="查找"
              value={find}
              onChange={(ev) => setFind(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault()
                  const view = viewRef.current
                  if (!view || !canFind) return
                  if (ev.shiftKey) findPrevious(view)
                  else findNext(view)
                }
              }}
            />
            <span className="md-editor-count">{canFind ? (matchInfo.total ? (matchInfo.current + '/' + matchInfo.total) : '0/0') : ''}</span>
            <button type="button" className="quiet" disabled={!canFind} onClick={() => viewRef.current && findPrevious(viewRef.current)}>上一个</button>
            <button type="button" className="quiet" disabled={!canFind} onClick={() => viewRef.current && findNext(viewRef.current)}>下一个</button>
            <button type="button" className={'md-editor-btn' + (caseSensitive ? ' on' : '')} title="区分大小写" onClick={() => setCaseSensitive((v) => !v)}>Aa</button>
            <button type="button" className={'md-editor-btn' + (wholeWord ? ' on' : '')} title="全字匹配" onClick={() => setWholeWord((v) => !v)}>全字</button>
            <button type="button" className="quiet" onClick={closeFind}>关闭</button>
          </div>
          <div className="md-editor-find-row">
            <input
              ref={replaceRef}
              type="text"
              placeholder="替换为"
              value={replace}
              onChange={(ev) => setReplace(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault()
                  if (viewRef.current && canFind) replaceNext(viewRef.current)
                }
              }}
            />
            <button type="button" className="quiet" disabled={!canFind} onClick={() => viewRef.current && replaceNext(viewRef.current)}>替换</button>
            <button type="button" className="quiet" disabled={!canFind} onClick={() => viewRef.current && replaceAll(viewRef.current)}>全部替换</button>
          </div>
        </div>
      ) : null}
      <div ref={hostRef} className={'md-editor-host' + (preview ? ' off' : '')} />
      {preview ? <div className="md-editor-preview"><Md text={draft} /></div> : null}
    </div>
  )
}
