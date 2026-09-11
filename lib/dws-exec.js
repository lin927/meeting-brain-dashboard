// 调用本机 dws。优先直接跑 CLI 的 js，避开 Windows 上 dws.cmd / PATH / 系统代理问题。
import { execFile, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function npmModuleRoots() {
  const home = homedir();
  const appdata = process.env.APPDATA || join(home, 'AppData', 'Roaming');
  return [
    join(appdata, 'npm', 'node_modules'),
    join(home, '.npm-global', 'lib', 'node_modules'),
    join(home, '.local', 'lib', 'node_modules'),
    '/opt/homebrew/lib/node_modules',
    '/usr/local/lib/node_modules',
  ];
}

function findDwsJs() {
  for (const root of npmModuleRoots()) {
    const js = join(root, 'dingtalk-workspace-cli', 'bin', 'dws.js');
    const bin = join(root, 'dingtalk-workspace-cli', 'bin', 'dws');
    if (existsSync(js)) return js;
    if (existsSync(bin)) return bin;
  }
  return '';
}

function opts(extra = {}) {
  const pathSep = process.platform === 'win32' ? ';' : ':';
  const extraPath = [
    process.env.APPDATA ? join(process.env.APPDATA, 'npm') : '',
    'C:\\Program Files\\nodejs',
    process.env.PATH || '',
  ].filter(Boolean).join(pathSep);
  const o = {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: extra.maxBuffer || 64 * 1024 * 1024,
    env: { ...process.env, PATH: extraPath },
  };
  if (extra.timeout) o.timeout = extra.timeout;
  if (extra.cwd) o.cwd = extra.cwd;
  return o;
}

function isMissing(err) {
  return err && (err.code === 'ENOENT' || /not found|不是内部或外部命令/i.test(String(err.message || '')));
}

function combined(result) {
  const stdout = result && result.stdout ? String(result.stdout) : '';
  const stderr = result && result.stderr ? String(result.stderr) : '';
  return { ...result, stdout: stdout || stderr, stderr, text: (stdout + '\n' + stderr).trim() };
}

async function runOnce(file, argv, extra) {
  const r = await execFileAsync(file, argv, opts(extra));
  return combined(r);
}

function runOnceSync(file, argv, extra) {
  const stdout = execFileSync(file, argv, opts(extra));
  return typeof stdout === 'string' ? stdout : String(stdout || '');
}

export async function execDws(args, extra = {}) {
  const js = findDwsJs();
  if (js) {
    return runOnce(process.execPath, [js, ...args], extra);
  }
  const bins = process.platform === 'win32' ? ['dws.cmd', 'dws'] : ['dws'];
  let last;
  for (const bin of bins) {
    try {
      return await runOnce(bin, args, extra);
    } catch (e) {
      last = e;
      if (isMissing(e)) continue;
      throw e;
    }
  }
  throw last || new Error('未找到 dws');
}

export function execDwsSync(args, extra = {}) {
  const js = findDwsJs();
  if (js) return runOnceSync(process.execPath, [js, ...args], extra);
  const bins = process.platform === 'win32' ? ['dws.cmd', 'dws'] : ['dws'];
  let last;
  for (const bin of bins) {
    try {
      return runOnceSync(bin, args, extra);
    } catch (e) {
      last = last || e;
      if (isMissing(e)) continue;
      throw e;
    }
  }
  throw last || new Error('未找到 dws');
}

export function dwsOutputText(errOrResult) {
  if (!errOrResult) return '';
  if (typeof errOrResult === 'string') return errOrResult;
  return [
    errOrResult.text,
    errOrResult.stdout,
    errOrResult.stderr,
    errOrResult.message,
  ].filter(Boolean).join('\n');
}
