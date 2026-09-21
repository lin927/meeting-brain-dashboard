// 安装包（zip）分发：读版本戳、把 zip 解到运行目录。听记在 ~/.dsh，不会被覆盖。

import { execFile } from 'node:child_process'
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync,
  readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ALLOW_FILES = new Set(['package.json', 'package-lock.json', 'README.md', 'release.json'])
const ALLOW_DIRS = new Set(['server', 'lib', 'public', 'scripts'])

export function destRoot() {
  return process.env.MEETING_BRAIN_REPO || ROOT
}

export function readRelease(root = destRoot()) {
  const p = join(root, 'release.json')
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null }
}

export function packageVersion(root = destRoot()) {
  try {
    const j = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    return String(j.version || '')
  } catch { return '' }
}

/** 当前安装对应的短戳，用于发现「文件已更新但进程还是旧的」。 */
export function localStamp(root = destRoot()) {
  const rel = readRelease(root)
  if (rel && (rel.git || rel.version)) {
    return [rel.git, rel.version].filter(Boolean).join('@')
  }
  return packageVersion(root)
}

function psQuote(s) {
  return "'" + String(s).replace(/'/g, "''") + "'"
}

function safeJoin(root, rel) {
  const abs = resolve(root, rel)
  const base = resolve(root)
  if (abs !== base && !abs.startsWith(base + sep) && !abs.startsWith(base + '/')) {
    throw new Error('安装包里有非法路径')
  }
  return abs
}

function unwrapRoot(unpack) {
  const names = readdirSync(unpack).filter((n) => n !== '__MACOSX' && n !== '.DS_Store')
  if (names.length === 1) {
    const only = join(unpack, names[0])
    if (statSync(only).isDirectory()) return only
  }
  return unpack
}

async function unzipTo(zipPath, dest) {
  if (process.platform === 'win32') {
    await execFileAsync('powershell.exe', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
      `Expand-Archive -LiteralPath ${psQuote(zipPath)} -DestinationPath ${psQuote(dest)} -Force`,
    ], { timeout: 120000, windowsHide: true })
    return
  }
  try {
    await execFileAsync('unzip', ['-o', '-q', zipPath, '-d', dest], { timeout: 120000 })
    return
  } catch { /* 改用 python */ }
  await execFileAsync('python3', ['-c', (
    'import sys, zipfile\n'
    + 'zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])\n'
  ), zipPath, dest], { timeout: 120000 })
}

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const name of readdirSync(src)) {
    if (name === '.' || name === '..' || name === 'node_modules' || name === '.git') continue
    const from = join(src, name)
    const to = join(dest, name)
    if (statSync(from).isDirectory()) copyTree(from, to)
    else copyFileSync(from, to)
  }
}

function copyAllowlist(src, root) {
  for (const name of ALLOW_FILES) {
    const from = join(src, name)
    if (!existsSync(from) || !statSync(from).isFile()) continue
    copyFileSync(from, safeJoin(root, name))
  }
  for (const name of ALLOW_DIRS) {
    const from = join(src, name)
    if (!existsSync(from) || !statSync(from).isDirectory()) continue
    copyTree(from, safeJoin(root, name))
  }
}

function lockSig(root) {
  const p = join(root, 'package-lock.json')
  if (!existsSync(p)) return Buffer.alloc(0)
  return readFileSync(p)
}

export async function applyZipBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 30) {
    return { ok: false, error: '请选择会议助手安装包（zip）' }
  }
  const root = destRoot()
  const dir = mkdtempSync(join(tmpdir(), 'mb-zip-'))
  const zipPath = join(dir, 'pkg.zip')
  const unpack = join(dir, 'unpack')
  mkdirSync(unpack)
  writeFileSync(zipPath, buf)
    const beforeLock = lockSig(root)
    try {
    await unzipTo(zipPath, unpack)
    const src = unwrapRoot(unpack)
    const hasApp = existsSync(join(src, 'public', 'app.js')) || existsSync(join(src, 'server', 'index.js'))
    if (!hasApp) return { ok: false, error: '这个 zip 不是会议助手安装包' }
    copyAllowlist(src, root)
    const needInstall = Buffer.compare(beforeLock, lockSig(root)) !== 0
    if (needInstall) {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      await execFileAsync(npm, ['install', '--no-audit', '--no-fund'], {
        cwd: root,
        timeout: 180000,
        windowsHide: true,
        env: process.env,
      })
    }
    const rel = readRelease(root)
    const to = rel ? [rel.version, rel.git].filter(Boolean).join(' ') : packageVersion(root)
    return {
      ok: true,
      updated: true,
      restarting: true,
      to,
      message: '已应用安装包，正在重启服务',
    }
  } catch (e) {
    const msg = String((e && (e.stderr || e.message)) || e).replace(/\s+/g, ' ').trim()
    return { ok: false, error: msg.slice(0, 180) || '解压安装包失败' }
  } finally {
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}