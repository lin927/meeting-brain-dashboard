// 检查并应用本仓库远程更新。听记数据在 ~/.dsh，拉代码不会覆盖。
// 有未提交改动或与远程分叉时不自动拉，避免把本机改动冲掉。

import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000
const FETCH_MIN_MS = 15 * 60 * 1000

let _cache = null
let _cacheAt = 0
let _applying = false
let _restarting = false
let _notified = ''

function repoRoot() {
  return process.env.MEETING_BRAIN_REPO || ROOT
}

async function git(args, extra = {}) {
  const { stdout, stderr } = await execFileAsync('git', args, {
    cwd: repoRoot(),
    timeout: extra.timeout || 20000,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0' },
  })
  return String(stdout || stderr || '').trim()
}

function gitError(e) {
  const raw = String((e && (e.stderr || e.stdout || e.message)) || e).replace(/\s+/g, ' ').trim()
  if (/not a git repository/i.test(raw)) return '当前不是 git 仓库，不能自动更新'
  if (/not found|ENOENT|不是内部或外部命令/i.test(raw)) return '本机没有 git，不能自动更新'
  if (/Could not resolve|timed out|Could not read|Authentication|Permission denied|could not find remote/i.test(raw)) {
    return '连不上远程仓库。请确认本机能访问 GitHub'
  }
  return raw.slice(0, 180) || 'git 失败'
}

async function hasGitRepo() {
  try {
    if (!existsSync(join(repoRoot(), '.git'))) return false
    const inside = await git(['rev-parse', '--is-inside-work-tree'])
    return inside === 'true'
  } catch {
    return false
  }
}

async function upstreamRef() {
  try {
    const u = await git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
    if (u) return u
  } catch { /* 未设置上游 */ }
  for (const name of ['origin/main', 'origin/master']) {
    try {
      await git(['rev-parse', '--verify', name])
      return name
    } catch { /* 没有这个分支 */ }
  }
  return ''
}

export async function checkAppUpdate({ fresh = false } = {}) {
  if (!fresh && _cache && Date.now() - _cacheAt < FETCH_MIN_MS) return _cache
  const base = {
    ok: true,
    configured: false,
    available: false,
    canApply: false,
    dirty: false,
    behind: 0,
    ahead: 0,
    current: '',
    latest: '',
    branch: '',
    remote: '',
    subject: '',
    applying: _applying || _restarting,
    checkedAt: Date.now(),
  }
  if (!(await hasGitRepo())) {
    _cache = { ...base, message: '当前不是 git 仓库' }
    _cacheAt = Date.now()
    return _cache
  }
  try {
    const branch = await git(['rev-parse', '--abbrev-ref', 'HEAD'])
    const current = await git(['rev-parse', '--short', 'HEAD'])
    const porcelain = await git(['status', '--porcelain'])
    const dirty = !!porcelain
    let fetchError = ''
    try {
      await git(['fetch', '--quiet', '--prune'], { timeout: 25000 })
    } catch (e) {
      fetchError = gitError(e)
    }
    const upstream = await upstreamRef()
    if (!upstream) {
      _cache = {
        ...base, configured: true, current, branch, dirty,
        message: fetchError || '没有远程分支，不能自动更新',
      }
      _cacheAt = Date.now()
      return _cache
    }
    const behind = Number(await git(['rev-list', '--count', `HEAD..${upstream}`])) || 0
    const ahead = Number(await git(['rev-list', '--count', `${upstream}..HEAD`])) || 0
    const latest = behind ? await git(['rev-parse', '--short', upstream]) : current
    let subject = ''
    if (behind) {
      try { subject = await git(['log', '-1', '--format=%s', upstream]) } catch { /* ignore */ }
    }
    const available = behind > 0
    const canApply = available && !dirty && ahead === 0 && !_applying && !_restarting
    let message = '已是最新'
    if (fetchError && !behind) message = fetchError
    else if (available && dirty) message = '有新版本，但本机代码有改动，不能自动更新'
    else if (available && ahead) message = '有新版本，但本机分支已分叉，不能自动快进'
    else if (available) message = behind === 1 ? '有 1 个更新' : `有 ${behind} 个更新`
    _cache = {
      ...base,
      configured: true,
      available,
      canApply,
      dirty,
      behind,
      ahead,
      current,
      latest,
      branch,
      remote: upstream,
      subject,
      message,
      applying: _applying || _restarting,
    }
    _cacheAt = Date.now()
    return _cache
  } catch (e) {
    _cache = { ...base, message: gitError(e) }
    _cacheAt = Date.now()
    return _cache
  }
}

function spawnRestart() {
  const root = repoRoot()
  const win = process.platform === 'win32'
  const cmd = win ? 'powershell.exe' : 'bash'
  const args = win
    ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(root, 'scripts', 'restart.ps1')]
    : [join(root, 'scripts', 'restart.sh')]
  const child = spawn(cmd, args, {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: process.env,
  })
  child.unref()
}

export async function applyAppUpdate() {
  if (_applying || _restarting) return { ok: false, error: '正在更新…请稍候' }
  const st = await checkAppUpdate({ fresh: true })
  if (!st.configured) return { ok: false, error: st.message || '不能自动更新' }
  if (!st.available) return { ok: true, updated: false, message: '已是最新' }
  if (st.dirty) return { ok: false, error: '本机代码有改动，不能自动更新' }
  if (st.ahead) return { ok: false, error: '本机分支已分叉，不能自动快进' }
  _applying = true
  try {
    const before = st.current
    const upstream = st.remote
    const remote = String(upstream || '').split('/')[0] || 'origin'
    const branch = String(upstream || '').split('/').slice(1).join('/') || st.branch || 'main'
    await git(['pull', '--ff-only', remote, branch], { timeout: 120000 })
    const after = await git(['rev-parse', '--short', 'HEAD'])
    let changed = ''
    try { changed = await git(['diff', '--name-only', `${before}..${after}`]) } catch { /* ignore */ }
    const needInstall = /(^|\n)package(-lock)?\.json(\n|$)/.test(changed)
    if (needInstall) {
      await execFileAsync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], {
        cwd: repoRoot(),
        timeout: 180000,
        encoding: 'utf8',
        windowsHide: true,
        env: process.env,
      })
    }
    _cache = null
    _restarting = true
    return {
      ok: true,
      updated: true,
      restarting: true,
      from: before,
      to: after,
      message: '已拉取最新代码，正在重启服务',
    }
  } catch (e) {
    _applying = false
    return { ok: false, error: gitError(e) }
  } finally {
    _applying = false
  }
}

export function scheduleRestart(delayMs = 900) {
  _restarting = true
  setTimeout(() => {
    try { spawnRestart() } catch (e) {
      console.error('[app-update] 重启失败:', e && e.message || e)
      _restarting = false
    }
  }, delayMs)
}

export function armAppUpdate(onAvailable) {
  const tick = () => {
    checkAppUpdate({ fresh: true }).then((r) => {
      if (r && r.available && r.latest && r.latest !== _notified) {
        _notified = r.latest
        if (onAvailable) onAvailable(r)
      }
    }).catch((e) => console.error('[app-update]', e && e.message || e))
  }
  setTimeout(tick, 12000)
  setInterval(tick, CHECK_EVERY_MS)
}
