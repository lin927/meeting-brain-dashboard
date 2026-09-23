// 检查并应用本仓库远程更新。听记数据在 ~/.dsh，拉代码不会覆盖。
// 有未提交改动或与远程分叉时不自动拉，避免把本机改动冲掉。

import { execFile, execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { destRoot, localStamp, packageVersion, readRelease, applyZipBuffer } from './app-zip.js'

const execFileAsync = promisify(execFile)
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000
const FETCH_MIN_MS = 15 * 60 * 1000

let _cache = null
let _cacheAt = 0
let _applying = false
let _restarting = false
let _notified = ''

function repoRoot() {
  return destRoot()
}

export function runningRevPath() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(home, 'meetings', 'server-rev')
}

/** 记下当前进程对应的版本戳，方便下次启动发现「代码已更新但服务还是旧的」。 */
export function markRunningRevision() {
  try {
    let rev = ''
    try {
      rev = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: repoRoot(),
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true,
      }).trim()
    } catch { /* 安装包没有 git */ }
    if (!rev) rev = localStamp()
    if (!rev) return
    const file = runningRevPath()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, rev + '\n')
  } catch { /* 写戳失败则跳过 */ }
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
  if (/cannot lock ref|\.lock['"]?: File exists|Another git process/i.test(raw)) {
    return 'Git 锁文件还在（上次更新可能中断了）。请关掉其他终端里的 git，再点「检查更新」。仍不行就在仓库里删除 .git/refs/remotes/origin/main.lock 后再试。'
  }
  if (/Could not resolve|timed out|Could not read|Authentication|Permission denied|could not find remote/i.test(raw)) {
    return '连不上远程仓库。请确认本机能访问 GitHub'
  }
  return raw.slice(0, 180) || 'git 失败'
}

function isGitLockError(e) {
  const raw = String((e && (e.stderr || e.stdout || e.message)) || e)
  return /cannot lock ref|\.lock['"]?: File exists|Another git process/i.test(raw)
}

function clearStaleGitLocks(minAgeMs = 10000) {
  const gitDir = join(repoRoot(), '.git')
  const now = Date.now()
  const files = [
    join(gitDir, 'refs/remotes/origin/main.lock'),
    join(gitDir, 'refs/remotes/origin/master.lock'),
    join(gitDir, 'refs/heads/main.lock'),
    join(gitDir, 'packed-refs.lock'),
    join(gitDir, 'index.lock'),
    join(gitDir, 'HEAD.lock'),
    join(gitDir, 'shallow.lock'),
    join(gitDir, 'config.lock'),
  ]
  let n = 0
  for (const p of files) {
    if (!existsSync(p)) continue
    try {
      if (now - statSync(p).mtimeMs < minAgeMs) continue
      unlinkSync(p)
      n += 1
    } catch { /* 正在被占用则跳过 */ }
  }
  return n
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

function shortGit(s) {
  return String(s || '').trim().toLowerCase().replace(/^mb-/, '').slice(0, 40)
}

function sameGit(a, b) {
  const x = shortGit(a)
  const y = shortGit(b)
  if (!x || !y) return false
  return x === y || x.startsWith(y) || y.startsWith(x)
}

function githubHeaders(accept) {
  const h = {
    'User-Agent': 'meeting-brain',
    Accept: accept || 'application/vnd.github+json',
  }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
  if (token) h.Authorization = 'Bearer ' + token
  return h
}

async function fetchGithub(url, extra = {}) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), extra.timeout || 25000)
  try {
    const res = await fetch(url, { headers: githubHeaders(extra.accept), signal: ac.signal, redirect: 'follow' })
    const buf = Buffer.from(await res.arrayBuffer())
    if (!res.ok) {
      const err = new Error(res.status === 404 ? '找不到安装包发布页' : ('GitHub ' + res.status))
      err.status = res.status
      throw err
    }
    return buf
  } finally {
    clearTimeout(t)
  }
}

function zipRepo() {
  const rel = readRelease()
  if (rel && rel.repo) return String(rel.repo)
  return 'lin927/meeting-brain-dashboard'
}

async function checkZipChannel(base) {
  const rel = readRelease()
  const ver = (rel && rel.version) || packageVersion()
  const git = (rel && rel.git) || ''
  const current = [ver, git].filter(Boolean).join(' ') || '安装包'
  const common = {
    ...base,
    channel: 'zip',
    configured: true,
    current,
    branch: '安装包',
  }
  try {
    const repo = zipRepo()
    const latestBuf = await fetchGithub(`https://api.github.com/repos/${repo}/releases/latest`)
    const latest = JSON.parse(latestBuf.toString('utf8'))
    const assets = Array.isArray(latest.assets) ? latest.assets : []
    const jsonAsset = assets.find((a) => a && a.name === 'release.json')
    const zipAsset = assets.find((a) => a && a.name === 'meeting-brain.zip')
    let remoteGit = ''
    let remoteVer = ''
    let subject = String(latest.name || latest.tag_name || '')
    if (jsonAsset && (jsonAsset.url || jsonAsset.browser_download_url)) {
      try {
        const raw = await fetchGithub(jsonAsset.url || jsonAsset.browser_download_url, {
          accept: 'application/octet-stream',
        })
        const info = JSON.parse(raw.toString('utf8'))
        remoteGit = info.git || ''
        remoteVer = info.version || ''
        if (info.git) subject = [info.version, info.git].filter(Boolean).join(' ')
      } catch { /* 用 tag 兜底 */ }
    }
    if (!remoteGit) remoteGit = shortGit(latest.tag_name)
    const latestLabel = [remoteVer, remoteGit].filter(Boolean).join(' ') || subject
    const available = !!(remoteGit || remoteVer) && !sameGit(git, remoteGit)
    const canApply = available && !!(zipAsset && (zipAsset.url || zipAsset.browser_download_url)) && !_applying && !_restarting
    let message = '已是最新'
    if (available && canApply) message = '有新的安装包'
    else if (available) message = '有新的安装包。请点「选用安装包」或向维护者要最新 zip'
    _cache = {
      ...common,
      available,
      canApply,
      latest: latestLabel,
      subject,
      remote: (zipAsset && (zipAsset.url || zipAsset.browser_download_url)) || '',
      message,
    }
    _cacheAt = Date.now()
    return _cache
  } catch (e) {
    const status = e && e.status
    const hint = status === 404
      ? '仓库若是私有的，在线检查不到。维护者发了新 zip 后，用「选用安装包」。'
      : (String((e && e.message) || e).slice(0, 120) || '连不上 GitHub')
    _cache = { ...common, message: hint }
    _cacheAt = Date.now()
    return _cache
  }
}

async function applyZipRemote() {
  const st = await checkAppUpdate({ fresh: true })
  if (!st.available) return { ok: true, updated: false, message: '已是最新' }
  if (!st.remote) return { ok: false, error: '没有安装包下载地址，请用「选用安装包」' }
  const buf = await fetchGithub(st.remote, { accept: 'application/octet-stream', timeout: 120000 })
  return applyZipBuffer(buf)
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
    channel: 'git',
    applying: _applying || _restarting,
    checkedAt: Date.now(),
  }
  if (!(await hasGitRepo())) {
    return checkZipChannel(base)
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
      if (isGitLockError(e) && clearStaleGitLocks()) {
        try {
          await git(['fetch', '--quiet', '--prune'], { timeout: 25000 })
        } catch (e2) {
          fetchError = gitError(e2)
        }
      } else {
        fetchError = gitError(e)
      }
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
    ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(root, 'scripts', 'restart.ps1'), '-NoPause']
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
  if (st.channel === 'zip') {
    _applying = true
    try {
      const r = await applyZipRemote()
      if (r && r.ok && r.updated) {
        _cache = null
        _restarting = true
      }
      return r
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e).slice(0, 180) || '下载安装包失败' }
    } finally {
      _applying = false
    }
  }
  if (st.dirty) return { ok: false, error: '本机代码有改动，不能自动更新' }
  if (st.ahead) return { ok: false, error: '本机分支已分叉，不能自动快进' }
  _applying = true
  try {
    const before = st.current
    const upstream = st.remote
    const remote = String(upstream || '').split('/')[0] || 'origin'
    const branch = String(upstream || '').split('/').slice(1).join('/') || st.branch || 'main'
    try {
      await git(['pull', '--ff-only', remote, branch], { timeout: 120000 })
    } catch (e) {
      if (!isGitLockError(e) || !clearStaleGitLocks()) throw e
      await git(['pull', '--ff-only', remote, branch], { timeout: 120000 })
    }
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
