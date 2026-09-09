import React, { useEffect, useState } from 'react'
import { NAV } from './format.js'
import { MeetPage } from './meet.jsx'
import { LedgerPage } from './ledger.jsx'
import { SettingsPage } from './settings.jsx'

export function App() {
  const STORE = 'ma-state'
  const [page, setPage] = useState('meet')
  const [selectedMeet, setSelectedMeet] = useState(null)
  const [selectedTodo, setSelectedTodo] = useState(0)
  const [toast, setToast] = useState('')
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
  const showToast = React.useCallback((t) => {
    setToast(t)
    setTimeout(() => setToast(''), String(t || '').length > 12 ? 3200 : 1600)
  }, [])
  return (
    <div className="app">
      <header className="top">
        <div className="brand">会议助手<small>LOCAL</small></div>
        <nav className="main">
          {NAV.map(([id, label]) => (
            <button type="button" key={id} className={page === id ? 'on' : ''} onClick={() => setPage(id)}>{label}</button>
          ))}
        </nav>
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
          <SettingsPage toast={showToast} />
        </div>
      </main>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
