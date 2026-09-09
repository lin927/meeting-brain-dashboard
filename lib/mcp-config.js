import { randomBytes, timingSafeEqual } from 'node:crypto'
import { open, getMeta, setMeta } from './db.js'
import { pushLog } from './runtime-log.js'

export const MCP_CLIENT_NAME = 'htmeeting_tools'

export function newMcpToken() {
  return 'htmeeting_mcp_' + randomBytes(32).toString('base64url')
}

export function mcpUrl(port) {
  return `http://127.0.0.1:${Number(port) || 3400}/mcp`
}

export function mcpSnippet(url, token) {
  return `"${MCP_CLIENT_NAME}": {
      "url": ${JSON.stringify(url)},
      "headers": {
        "Authorization": "Bearer ${token}"
      },
      "disabled": false
    }`
}

function readState(db, port) {
  const enabled = getMeta(db, 'mcp_enabled') === '1'
  const token = getMeta(db, 'mcp_token') || ''
  const url = mcpUrl(port)
  return {
    enabled,
    token: enabled ? token : '',
    url,
    name: MCP_CLIENT_NAME,
    snippet: enabled && token ? mcpSnippet(url, token) : '',
  }
}

export function getMcpState(port) {
  const db = open()
  let token = getMeta(db, 'mcp_token') || ''
  if (getMeta(db, 'mcp_enabled') === '1' && !token) {
    token = newMcpToken()
    setMeta(db, 'mcp_token', token)
  }
  const st = readState(db, port)
  db.close()
  return st
}

export function setMcpEnabled(on, port) {
  const db = open()
  setMeta(db, 'mcp_enabled', on ? '1' : '0')
  if (on && !getMeta(db, 'mcp_token')) setMeta(db, 'mcp_token', newMcpToken())
  const st = readState(db, port)
  db.close()
  pushLog('MCP', on ? '已打开' : '已关闭')
  return st
}

export function rotateMcpToken(port) {
  const db = open()
  setMeta(db, 'mcp_token', newMcpToken())
  const st = readState(db, port)
  db.close()
  pushLog('MCP', '已重新生成密钥，旧配置失效')
  return st
}

export function mcpIsEnabled() {
  const db = open()
  const on = getMeta(db, 'mcp_enabled') === '1'
  db.close()
  return on
}

export function bearerMatches(header) {
  const raw = String(header || '')
  const m = raw.match(/^Bearer\s+(\S+)/i)
  const got = m ? m[1] : ''
  const db = open()
  const want = getMeta(db, 'mcp_token') || ''
  const enabled = getMeta(db, 'mcp_enabled') === '1'
  db.close()
  if (!enabled || !want || !got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(want)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
