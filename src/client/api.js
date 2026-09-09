const BACKEND_PORTS = [3400, 3401, 3402, 3403, 3404]

const fetchGlobal = () => {
  const w = (typeof window !== 'undefined') ? window : globalThis
  if (w.fetch === undefined) throw new Error('当前环境无 fetch，无法连接本地后端')
  return w.fetch.bind(w)
}

const forcedApi = () => (typeof window !== 'undefined' && window.MEETING_BRAIN_API) || null

async function probeBackend(port, timeoutMs = 1500) {
  const f = fetchGlobal()
  try {
    const res = await f(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return false
    const j = await res.json()
    return !!(j && j.ok && j.name === 'meeting-brain')
  } catch {
    return false
  }
}

let cachedApi = null

async function resolveApi() {
  const forced = forcedApi()
  if (forced) return forced
  if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
    try {
      const res = await fetchGlobal()('/api/health', { signal: AbortSignal.timeout(800) })
      if (res.ok) {
        const j = await res.json()
        if (j && j.ok && j.name === 'meeting-brain') return ''
      }
    } catch { /* 非同源，改探测 */ }
  }
  if (cachedApi !== null) {
    if (await probeBackend(cachedApi)) return cachedApi
    cachedApi = null
  }
  for (const p of BACKEND_PORTS) {
    if (await probeBackend(p)) {
      cachedApi = `http://127.0.0.1:${p}`
      return cachedApi
    }
  }
  return null
}

export function qs(params) {
  const u = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    u.set(k, String(v))
  })
  const s = u.toString()
  return s ? '?' + s : ''
}

export async function api(path, body, method) {
  const base = await resolveApi()
  if (base === null) throw new Error('无法连接本地会议后端（3400-3404 均无响应），请确认后端已启动')
  const url = base + path
  const verb = method || (body === undefined ? 'GET' : 'POST')
  const res = await fetchGlobal()(url, body === undefined
    ? { method: verb }
    : { method: verb, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    let msg = `后端错误 ${res.status}`
    try {
      const j = JSON.parse(t)
      if (j && j.error) msg = j.error
    } catch {
      if (t) msg = t.slice(0, 200)
    }
    throw new Error(msg)
  }
  return res.json()
}

export function fallbackCopy(w, text) {
  try {
    const ta = w.document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    w.document.body.appendChild(ta)
    ta.select()
    w.document.execCommand('copy')
    w.document.body.removeChild(ta)
  } catch { /* 复制失败静默 */ }
}
