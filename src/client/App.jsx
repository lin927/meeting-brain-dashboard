import React, { useEffect, useState } from 'react'
import { api, uploadAppZip } from './api.js'
import { NAV } from './format.js'
import { MeetPage } from './meet.jsx'
import { LedgerPage } from './ledger.jsx'
import { SettingsPage } from './settings.jsx'
import { ConfirmSheet } from './ui.jsx'

export function App() {
  const STORE = 'ma-state'
  const [page, setPage] = useState('meet')
  const [selectedMeet, setSelectedMeet] = useState(null)
  const [selectedTodo, setSelectedTodo] = useState(0)
  const [toast, setToast] = useState('')
  const [appUp, setAppUp] = useState(null)
  const [updOpen, setUpdOpen] = useState(false)
  const [updBusy, setUpdBusy] = useState(false)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE)
      const meet = new URLSearchParams(window.location.search).get('meet')
      if (saved) {
        const s = JSON.parse(saved)
        if (s.page) setPage(s.page)
        if (s.selectedMeet) setSelectedMeet(s.selectedMeet)
        if (s.selectedTodo) setSelectedTodo(s.selectedTodo)
      }
      if (meet) { setSelectedMeet(meet); setPage('meet') }
    } catch { /* ignore */ }
  }, [])
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify({ page, selectedMeet, selectedTodo })) } catch { /* ignore */ }
  }, [page, selectedMeet, selectedTodo])
  const checkAppUp = React.useCallback((fresh) => {
    return api('/api/app/update' + (fresh ? '?fresh=1' : ''), undefined, 'GET', { timeoutMs: 30000 }).then((r) => {
      setAppUp(r)
      return r
    })
  }, [])
  useEffect(() => {
    const load = (fresh) => { checkAppUp(fresh).catch(() => {}) }
    load(false)
    const t = setInterval(() => load(true), 30 * 60 * 1000)
    const onVis = () => { if (document.visibilityState === 'visible') load(false) }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [checkAppUp])
  const showToast = React.useCallback((t) => {
    setToast(t)
    setTimeout(() => setToast(''), String(t || '').length > 12 ? 3200 : 1600)
  }, [])
  const waitRestart = () => {
    const ping = (n) => {
      fetch('/api/health', { signal: AbortSignal.timeout(1500) }).then((res) => {
        if (res.ok) { window.location.reload(); return }
        throw new Error('not ready')
      }).catch(() => {
        if (n > 45) { setUpdBusy(false); showToast('服务还在重启，请稍后再刷新'); return }
        setTimeout(() => ping(n + 1), 1000)
      })
    }
    setTimeout(() => ping(0), 2500)
  }
  const doAppUpdate = () => {
    if (updBusy) return
    if (appUp && appUp.canApply === false) {
      showToast(appUp.message || '现在不能自动更新')
      setUpdOpen(false)
      return
    }
    setUpdBusy(true)
    api('/api/app/update', {}, 'POST', { timeoutMs: 5 * 60 * 1000 }).then((r) => {
      if (!r.updated) {
        setUpdBusy(false)
        setUpdOpen(false)
        setAppUp(r)
        showToast(r.message || '已是最新')
        return
      }
      showToast(r.message || '正在重启…')
      waitRestart()
    }).catch((er) => {
      setUpdBusy(false)
      showToast(String(er && er.message || er))
    })
  }
  const applyZipFile = (file) => {
    if (updBusy || !file) return
    setUpdBusy(true)
    uploadAppZip(file).then((r) => {
      showToast((r && r.message) || '正在重启…')
      waitRestart()
    }).catch((er) => {
      setUpdBusy(false)
      showToast(String(er && er.message || er))
    })
  }
  return (
    <div className="app">
      <header className="top">
        <div className="brand">会议助手<small>LOCAL</small></div>
        <nav className="main">
          {NAV.map(([id, label]) => (
            <button type="button" key={id} className={page === id ? 'on' : ''} onClick={() => setPage(id)}>{label}</button>
          ))}
        </nav>
        {appUp && appUp.available
          ? (
            <div className="top-actions">
              <button type="button" className="sync-pill on" disabled={updBusy} onClick={() => setUpdOpen(true)}>
                {updBusy ? '更新中…' : '有更新'}
              </button>
            </div>
          )
          : null}
      </header>
      <main>
        <div className={'view' + (page === 'meet' ? '' : ' view-off')}>
          <MeetPage
            active={page === 'meet'}
            selected={selectedMeet}
            setSelected={setSelectedMeet}
            toast={showToast}
            goLedger={(id) => { setSelectedTodo(id); setPage('ledger') }}
          />
        </div>
        <div className={'view' + (page === 'ledger' ? '' : ' view-off')}>
          <LedgerPage
            active={page === 'ledger'}
            selected={selectedTodo}
            setSelected={setSelectedTodo}
            toast={showToast}
            goMeet={(id) => { setSelectedMeet(id); setPage('meet') }}
          />
        </div>
        <div className={'view' + (page === 'settings' ? '' : ' view-off')}>
          <SettingsPage
            toast={showToast}
            appUp={appUp}
            updBusy={updBusy}
            onCheckUpdate={checkAppUp}
            onRequestApply={() => setUpdOpen(true)}
            onApplyZip={applyZipFile}
          />
        </div>
      </main>
      {toast ? <div className="toast">{toast}</div> : null}
      {updOpen
        ? (
          <ConfirmSheet
            title="更新会议助手"
            lede={
              updBusy
                ? (appUp && appUp.channel === 'zip'
                  ? '正在下载安装包并重启本机服务。听记数据在本机，不会被覆盖。请等页面自动刷新，先不要关掉。'
                  : '正在拉代码并重启本机服务。听记数据在本机，不会被覆盖。请等页面自动刷新，先不要关掉。')
                : ((appUp && appUp.subject ? ('最新：' + appUp.subject + '。') : '') + (appUp && appUp.canApply
                  ? (appUp.channel === 'zip'
                    ? '会下载最新安装包并重启。听记、称呼和密钥都在本机，不会被覆盖。'
                    : '会从 GitHub 拉最新代码并重启。听记、称呼和密钥都在本机，不会被覆盖。')
                  : ((appUp && appUp.message) || '现在不能自动更新')))
            }
            confirmLabel="更新"
            busyLabel="更新中…"
            busy={updBusy}
            onConfirm={doAppUpdate}
            onClose={() => { if (!updBusy) setUpdOpen(false) }}
          />
        )
        : null}
    </div>
  )
}
