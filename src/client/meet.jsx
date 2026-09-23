import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api, qs } from './api.js'
import {
  MEET_PAGE, MEET_VIEWS, TYPE_FILTERS, PROVIDERS, companyMark, fmtDuration, fmtShort, groupMonths, lastSyncLabel, lastSyncTitle, srcMark, syncProgressLabel,
} from './format.js'
import { Md, SourceMark, useDebounced } from './ui.jsx'
import { ImportSheet, MeetingDetail } from './meeting-detail.jsx'

export function MeetPage(props) {
  const { selected, setSelected, toast, goLedger, active } = props
  const [items, setItems] = useState(null)
  const [total, setTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState(null)
  const [err, setErr] = useState(null)
  const [st, setSt] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [moreBusy, setMoreBusy] = useState(false)
  const [meetFilter, setMeetFilter] = useState('all')
  const [meetType, setMeetType] = useState('')
  const [meetProvider, setMeetProvider] = useState('')
  const [meetTag, setMeetTag] = useState('')
  const [meetQuery, setMeetQuery] = useState('')
  const [askQ, setAskQ] = useState('')
  const [askA, setAskA] = useState('')
  const [askHits, setAskHits] = useState([])
  const [asking, setAsking] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [tick, setTick] = useState(0)
  const qDebounced = useDebounced(meetQuery, 280)
  const reqId = useRef(0)
  const seenSyncAt = useRef(null)
  const expectSync = useRef(false)
  const syncMark = useRef(0)
  const kickPoll = useRef(null)

  const fetchPage = useCallback((opts = {}) => {
    const id = ++reqId.current
    const append = !!opts.append
    const cursor = opts.cursor || ''
    if (append) setMoreBusy(true)
    return api('/api/meetings' + qs({
      q: qDebounced,
      tag: meetTag,
      type: meetType,
      provider: meetProvider,
      filter: meetFilter === 'all' ? '' : meetFilter,
      cursor,
      limit: MEET_PAGE,
    })).then((r) => {
      if (id !== reqId.current) return
      const next = r.items || []
      setErr(null)
      setTotal(r.total || 0)
      setNextCursor(r.nextCursor || null)
      setItems((prev) => append ? (prev || []).concat(next) : next)
    }).catch((er) => {
      if (id !== reqId.current) return
      if (!append) setErr(String(er && er.message || er))
      else toast(String(er && er.message || er))
    }).finally(() => { if (append) setMoreBusy(false) })
  }, [qDebounced, meetTag, meetType, meetFilter, meetProvider])

  useEffect(() => { fetchPage() }, [fetchPage, tick])
  useEffect(() => {
    let stop = false
    let timer = 0
    const apply = (r, fromPoll) => {
      if (stop || !r) return
      setSt((prev) => {
        const hasSources = r.sources && Object.keys(r.sources).length
        if (!fromPoll || !prev) {
          if (hasSources) return r
          return { ...r, dws: (prev && prev.dws) || r.dws, sources: (prev && prev.sources) || r.sources || {} }
        }
        return {
          ...prev,
          ...r,
          dws: r.dws || prev.dws,
          sources: hasSources ? r.sources : (prev.sources || {}),
        }
      })
      if (r.syncing) setSyncing(true)
      else if (fromPoll && expectSync.current) {
        const lastAt = (r.last && r.last.at) || 0
        if (lastAt >= syncMark.current) {
          expectSync.current = false
          setSyncing(false)
        }
      } else if (fromPoll) {
        setSyncing(false)
      }
      const at = r.last && r.last.at
      if (!at) return
      const prevAt = seenSyncAt.current
      seenSyncAt.current = at
      if (!fromPoll || prevAt == null || prevAt === at) return
      if (r.last.success && r.last.added > 0) {
        toast('听记已更新 · ' + (r.last.message || ('新增 ' + r.last.added + ' 条')))
        setTick((n) => n + 1)
      } else if (r.last.success === false) {
        toast(r.last.message || '自动更新失败')
      }
    }
    const poll = (ms) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        api('/api/sync-status?meta=1').then((r) => {
          apply(r, true)
          poll(r && (r.syncing || expectSync.current) ? 2000 : 20000)
        }).catch(() => { poll(20000) })
      }, ms)
    }
    api('/api/sync-status').then((r) => {
      apply(r, false)
      if (r && r.dws && !r.dws.authenticated) {
        setTimeout(() => {
          api('/api/sync-status').then((x) => apply(x, false)).catch(() => {})
        }, 2500)
      }
      poll(r && r.syncing ? 2000 : 20000)
    }).catch(() => { poll(20000) })
    kickPoll.current = () => {
      clearTimeout(timer)
      api('/api/sync-status?meta=1').then((r) => {
        apply(r, true)
        poll(r && (r.syncing || expectSync.current) ? 2000 : 20000)
      }).catch(() => { poll(2000) })
    }
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      api('/api/sync-status').then((r) => apply(r, false)).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stop = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [toast])

  const doSync = () => {
    if (syncing) return
    setSyncing(true)
    expectSync.current = true
    syncMark.current = Date.now()
    api('/api/sync', {}).then((r) => {
      toast(r.message || '开始更新')
      setSt((prev) => ({ ...(prev || {}), syncing: true }))
      if (kickPoll.current) kickPoll.current()
    }).catch((er) => {
      expectSync.current = false
      toast(String(er && er.message || er))
      setSyncing(false)
    })
  }
  const doAsk = () => {
    if (!askQ.trim() || asking) return
    setAsking(true)
    api('/api/ask', { query: askQ.trim() }).then((r) => {
      if (r && r.error) { setAskA('错误: ' + r.error); setAskHits([]) }
      else { setAskA(r && r.answer || ''); setAskHits((r && r.hits) || []) }
    }).catch((er) => { setAskA('错误: ' + String(er && er.message || er)); setAskHits([]) }).finally(() => setAsking(false))
  }
  const closeAsk = () => { setAskA(''); setAskHits([]) }

  const pulling = syncing || !!(st && st.syncing)
  if (err) {
    return (
      <div className="pane">
        <p className="empty">{err}</p>
        <button className="quiet" onClick={() => { setErr(null); fetchPage() }}>重试</button>
      </div>
    )
  }
  if (!items) return <div className="pane"><p className="empty">加载中…</p></div>

  const currentId = selected || (items[0] && items[0].taskUuid)
  const months = groupMonths(items)
  const sources = (st && st.sources) || {}
  const logged = ['dingtalk', 'feishu', 'tencent'].filter((id) => sources[id] && sources[id].authenticated)
  const loggedLabel = logged.map((id) => {
    const s = sources[id]
    return (s.label || id) + (s.user ? ('·' + s.user) : '')
  }).join(' / ')
  const linkMap = askHits.reduce((m, h) => { if (h.title) m[h.title] = h.taskUuid; return m }, {})
  const remain = Math.max(0, total - items.length)
  const extraOn = !!(meetType || meetProvider || meetTag)
  const emptyText = meetFilter === 'pending'
    ? '没有待整理的会议'
    : (meetFilter === 'company'
      ? '还没有上传到公司知识库的会议'
      : (extraOn || qDebounced ? '没有符合条件的会议' : '没有会议'))
  const doLogin = () => {
    const first = ['dingtalk', 'feishu', 'tencent'].find((id) => sources[id] && !sources[id].authenticated) || 'dingtalk'
    api('/api/sources/login', { provider: first }).then((r) => {
      toast((r && r.message) || '请按提示完成登录')
    }).catch((er) => toast(String(er && er.message || er)))
  }

  return (
    <div className="split-2">
      <div className="pane">
        <h1>会议</h1>
        <div className="intake">
          <span className="intake-st" title={lastSyncTitle(st) || undefined}>
            {pulling
              ? (syncProgressLabel(st) || '更新中')
              : (logged.length
                ? (loggedLabel + (lastSyncLabel(st) ? ' · ' + lastSyncLabel(st) : ' · 还没更新过'))
                : '听记来源未登录')}
          </span>
          <div className="tools">
            <button className="quiet" onClick={doSync} disabled={pulling}>{pulling ? '更新中' : '更新'}</button>
            {logged.length
              ? null
              : <button className="quiet" onClick={doLogin}>登录</button>}
            <button className="quiet" onClick={() => setShowImport(true)}>导入</button>
          </div>
        </div>
        <div className="askbox">
          <input
            id="ask-q"
            type="text"
            placeholder="问这场会定了什么"
            value={askQ}
            onChange={(ev) => setAskQ(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') doAsk()
              if (ev.key === 'Escape') closeAsk()
            }}
          />
          <button className="quiet" onClick={doAsk} disabled={asking}>{asking ? '问…' : '问'}</button>
          {askA ? <button className="quiet" onClick={closeAsk}>关闭</button> : null}
        </div>
        {askA ? <div className="ans"><Md text={askA} linkMap={linkMap} onMeetingClick={(id) => id && setSelected(id)} /></div> : null}
        <div className={'filters filters-bar' + (meetProvider ? ' has-src' : '')}>
          <div className="filter-group filter-seg">
            {MEET_VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={'meet-filter' + (meetFilter === v.id ? ' on' : '')}
                onClick={() => setMeetFilter(v.id)}
              >{v.label}</button>
            ))}
          </div>
          <span className="filter-split" aria-hidden="true" />
          <div className="filter-group">
            {PROVIDERS.map((p) => (
              <button
                type="button"
                key={p.id}
                className={'src-mark src-' + p.id + (meetProvider === p.id ? ' on' : '')}
                onClick={() => setMeetProvider(meetProvider === p.id ? '' : p.id)}
              >{p.label}</button>
            ))}
          </div>
          <span className="filter-split" aria-hidden="true" />
          <div className="filter-group filter-types">
            {TYPE_FILTERS.map((t) => (
              <button
                type="button"
                key={t}
                className={'meet-filter' + (meetType === t ? ' on' : '')}
                onClick={() => setMeetType(meetType === t ? '' : t)}
              >{t}</button>
            ))}
            {extraOn
              ? (
                <button
                  type="button"
                  className="filter-clear"
                  onClick={() => { setMeetType(''); setMeetProvider(''); setMeetTag('') }}
                >清除</button>
              )
              : null}
          </div>
        </div>
        {meetTag
          ? (
            <div className="tags" style={{ margin: '0 0 10px' }}>
              <button type="button" className="tag active" onClick={() => setMeetTag('')}>{meetTag}<span className="x">×</span></button>
            </div>
          )
          : null}
        <input
          type="text"
          placeholder="过滤标题、项目或标签"
          value={meetQuery}
          onChange={(ev) => setMeetQuery(ev.target.value)}
          style={{ marginBottom: 8 }}
        />
        {months.length
          ? months.map((g) => (
            <div key={g.key}>
              <div className="month">{g.label}</div>
              {g.items.map((x) => {
                const mark = srcMark(x.source, x.provider)
                return (
                <div
                  className={'m-item src-row-' + mark.id + (x.taskUuid === currentId ? ' sel' : '')}
                  key={x.taskUuid}
                  onClick={() => setSelected(x.taskUuid)}
                >
                  <div className="t">
                    <SourceMark source={x.source} provider={x.provider} />
                    {x.title}
                  </div>
                  <div className="meta">
                    {[fmtShort(x.time), fmtDuration(x.durationMs), x.projectName || (x.tags || [])[0], companyMark(x)].filter(Boolean).join(' · ')}
                  </div>
                </div>
                )
              })}
            </div>
          ))
          : <p className="empty">{emptyText}</p>}
        {nextCursor
          ? (
            <div className="more-row">
              <button className="quiet" disabled={moreBusy} onClick={() => fetchPage({ append: true, cursor: nextCursor })}>
                {moreBusy ? '加载中' : ('后面还有 ' + remain + ' 场')}
              </button>
            </div>
          )
          : null}
      </div>
      <div className="pane">
        {currentId
          ? (
            <MeetingDetail
              key={currentId}
              uuid={currentId}
              active={!!active}
              meetTag={meetTag}
              toast={toast}
              onTag={(t) => setMeetTag(meetTag === t ? '' : t)}
              onChanged={() => setTick((n) => n + 1)}
              onDeleted={() => { setSelected(''); setTick((n) => n + 1) }}
              onJumpTodo={goLedger}
            />
          )
          : <p className="empty">选一场会议</p>}
      </div>
      {showImport
        ? (
          <ImportSheet
            toast={toast}
            onClose={() => setShowImport(false)}
            onImported={(id) => { setShowImport(false); setSelected(id); setTick((n) => n + 1) }}
          />
        )
        : null}
    </div>
  )
}
