import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function npmModuleRoots() {
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

export function findNpmFile(relPaths) {
  for (const root of npmModuleRoots()) {
    for (const rel of relPaths) {
      const p = join(root, rel);
      if (existsSync(p)) return p;
    }
  }
  return '';
}

function extraPath() {
  const pathSep = process.platform === 'win32' ? ';' : ':';
  return [
    process.env.APPDATA ? join(process.env.APPDATA, 'npm') : '',
    join(homedir(), '.npm-global', 'bin'),
    join(homedir(), '.local', 'bin'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    'C:\\Program Files\\nodejs',
    process.env.PATH || '',
  ].filter(Boolean).join(pathSep);
}

export function execOpts(extra = {}) {
  const o = {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: extra.maxBuffer || 64 * 1024 * 1024,
    env: { ...process.env, PATH: extraPath() },
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

export function cliOutputText(errOrResult) {
  if (!errOrResult) return '';
  if (typeof errOrResult === 'string') return errOrResult;
  return [
    errOrResult.text,
    errOrResult.stdout,
    errOrResult.stderr,
    errOrResult.message,
  ].filter(Boolean).join('\n');
}

export async function execNamed({ jsFile, names, args, extra = {} }) {
  if (jsFile) {
    return combined(await execFileAsync(process.execPath, [jsFile, ...args], execOpts(extra)));
  }
  const bins = names || [];
  let last;
  for (const bin of bins) {
    try {
      return combined(await execFileAsync(bin, args, execOpts(extra)));
    } catch (e) {
      last = e;
      if (isMissing(e)) continue;
      throw e;
    }
  }
  throw last || new Error('未找到命令 ' + (names && names[0] || ''));
}

/** 在可见终端里跑需要扫码/打开浏览器的命令。stdio ignore 的后台进程看不到授权链接。 */
export function spawnVisible(command) {
  const env = execOpts().env;
  const line = String(command || '').trim();
  if (!line) throw new Error('缺少命令');
  if (process.platform === 'darwin') {
    const child = spawn('osascript', ['-e', 'tell application "Terminal" to do script ' + JSON.stringify(line)], {
      detached: true, stdio: 'ignore', env,
    });
    child.unref();
    return { spawned: true, command: line };
  }
  if (process.platform === 'win32') {
    const child = spawn('cmd.exe', ['/c', 'start', '会议助手登录', 'cmd.exe', '/k', line], {
      detached: true, stdio: 'ignore', env, windowsHide: false,
    });
    child.unref();
    return { spawned: true, command: line };
  }
  const child = spawn('sh', ['-lc', line], { detached: true, stdio: 'ignore', env });
  child.unref();
  return { spawned: true, command: line };
}

