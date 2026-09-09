const MAX = 400
const logs = []

export function pushLog(source, text, level = 'info') {
  logs.unshift({
    at: Date.now(),
    source: String(source || ''),
    text: String(text || ''),
    level: level === 'error' ? 'error' : 'info',
  })
  if (logs.length > MAX) logs.length = MAX
}

export function listLogs(limit = 200) {
  const n = Math.min(Math.max(Number(limit) || 200, 1), MAX)
  return logs.slice(0, n)
}
