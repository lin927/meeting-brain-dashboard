import { execFile, execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const WIN = process.platform === 'win32';

function exists(p) {
  try { return !!p && existsSync(p); } catch { return false; }
}

function pushUnique(list, dir) {
  const raw = String(dir || '').trim();
  if (!raw) return;
  let abs;
  try { abs = resolve(raw); } catch { return; }
  if (!list.includes(abs)) list.push(abs);
}

/** 当前进程 Node、nvm/fnm/volta、常见全局 bin。不含系统 PATH。 */
export function extraBinDirs() {
  const home = homedir();
  const appdata = process.env.APPDATA || join(home, 'AppData', 'Roaming');
  const nodeDir = dirname(process.execPath);
  const dirs = [];
  pushUnique(dirs, nodeDir);
  pushUnique(dirs, process.env.NVM_BIN);
  pushUnique(dirs, process.env.FNM_MULTISHELL_PATH);
  if (process.env.VOLTA_HOME) pushUnique(dirs, join(process.env.VOLTA_HOME, 'bin'));
  pushUnique(dirs, join(home, '.npm-global', 'bin'));
  pushUnique(dirs, join(home, '.local', 'bin'));
  if (WIN) {
    pushUnique(dirs, join(appdata, 'npm'));
    pushUnique(dirs, 'C:\\Program Files\\nodejs');
    pushUnique(dirs, 'C:\\Program Files (x86)\\nodejs');
  } else {
    pushUnique(dirs, '/opt/homebrew/bin');
    pushUnique(dirs, '/usr/local/bin');
  }
  return dirs;
}

function extraPath() {
  return [...extraBinDirs(), process.env.PATH || ''].filter(Boolean).join(delimiter);
}

export function npmModuleRoots() {
  const home = homedir();
  const appdata = process.env.APPDATA || join(home, 'AppData', 'Roaming');
  const nodeDir = dirname(process.execPath);
  const roots = [];
  pushUnique(roots, join(nodeDir, 'node_modules'));
  pushUnique(roots, join(nodeDir, '..', 'lib', 'node_modules'));
  pushUnique(roots, join(nodeDir, '..', 'node_modules'));
  pushUnique(roots, join(home, '.npm-global', 'lib', 'node_modules'));
  pushUnique(roots, join(home, '.npm-global', 'node_modules'));
  pushUnique(roots, join(home, '.local', 'lib', 'node_modules'));
  if (WIN) {
    pushUnique(roots, join(appdata, 'npm', 'node_modules'));
  } else {
    pushUnique(roots, '/opt/homebrew/lib/node_modules');
    pushUnique(roots, '/usr/local/lib/node_modules');
  }
  for (const p of String(process.env.NODE_PATH || '').split(delimiter)) pushUnique(roots, p);

  let n = 0;
  for (const dir of extraPath().split(delimiter)) {
    if (!dir || ++n > 80) continue;
    pushUnique(roots, join(dir, 'node_modules'));
    pushUnique(roots, join(dir, '..', 'node_modules'));
    pushUnique(roots, join(dir, '..', 'lib', 'node_modules'));
  }
  return roots;
}

export function findNpmFile(relPaths) {
  const rels = (relPaths || []).filter(Boolean);
  if (!rels.length) return '';
  for (const root of npmModuleRoots()) {
    for (const rel of rels) {
      const p = join(root, rel);
      if (exists(p)) return p;
    }
  }
  return '';
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

export function isCliMissing(err) {
  if (!err) return false;
  const code = err.code;
  if (code === 'ENOENT' || code === 'EINVAL') return true;
  const msg = String(err.message || err);
  return /not found|不是内部或外部命令|不是可运行的程序|spawn .*(ENOENT|EINVAL)/i.test(msg);
}

function quoteCmd(s) {
  const str = String(s);
  if (str === '') return '""';
  if (!/[\s"&|<>^()%!]/u.test(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

function quoteSh(s) {
  const str = String(s);
  if (str === '') return "''";
  if (!/[^A-Za-z0-9_./:=+-]/u.test(str)) return str;
  return `'${str.replace(/'/g, `'\\''`)}'`;
}

function winBinName(bin) {
  const name = String(bin || '');
  if (/[\\/]/.test(name)) return name;
  return name.replace(/\.(cmd|bat)$/i, '');
}

function winCmdLine(bin, args) {
  return [quoteCmd(winBinName(bin)), ...args.map(quoteCmd)].join(' ');
}

function runWinCmdOpts(o) {
  return { ...o, windowsVerbatimArguments: true };
}

function runBinAsync(bin, args, extra) {
  const o = execOpts(extra);
  if (WIN) {
    return execFileAsync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', winCmdLine(bin, args)], runWinCmdOpts(o));
  }
  return execFileAsync(bin, args, o);
}

function runBinSync(bin, args, extra) {
  const o = execOpts(extra);
  if (WIN) {
    return execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', winCmdLine(bin, args)], runWinCmdOpts(o));
  }
  return execFileSync(bin, args, o);
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

function resolvedJs(jsFile, relPaths) {
  const given = String(jsFile || '').trim();
  if (given && exists(given)) return given;
  return relPaths && relPaths.length ? findNpmFile(relPaths) : '';
}

/**
 * 优先用当前 Node 直接跑 CLI 的 .js（Mac / Windows 都走这条，避开 .cmd EINVAL）。
 * Windows 找不到 js 时用 cmd.exe /c 跑命令名，由 PATHEXT 解析 .cmd，绝不 execFile 直接 spawn .cmd/.bat。
 */
export async function execNamed({ jsFile, relPaths, names, args, extra = {} }) {
  const js = resolvedJs(jsFile, relPaths);
  if (js) {
    return combined(await execFileAsync(process.execPath, [js, ...args], execOpts(extra)));
  }
  const bins = names || [];
  let last;
  for (const bin of bins) {
    try {
      return combined(await runBinAsync(bin, args, extra));
    } catch (e) {
      last = e;
      if (isCliMissing(e)) continue;
      throw e;
    }
  }
  throw last || new Error('未找到命令 ' + (names && names[0] || ''));
}

export function execNamedSync({ jsFile, relPaths, names, args, extra = {} }) {
  const js = resolvedJs(jsFile, relPaths);
  if (js) {
    const stdout = execFileSync(process.execPath, [js, ...args], execOpts(extra));
    return typeof stdout === 'string' ? stdout : String(stdout || '');
  }
  const bins = names || [];
  let last;
  for (const bin of bins) {
    try {
      const stdout = runBinSync(bin, args, extra);
      return typeof stdout === 'string' ? stdout : String(stdout || '');
    } catch (e) {
      last = e;
      if (isCliMissing(e)) continue;
      throw e;
    }
  }
  throw last || new Error('未找到命令 ' + (names && names[0] || ''));
}

export function formatCliCommand({ relPaths, names, args = [] }) {
  const js = relPaths ? findNpmFile(relPaths) : '';
  const q = WIN ? quoteCmd : quoteSh;
  if (js) return [q(process.execPath), q(js), ...args.map(q)].join(' ');
  let bin = String((names && names[0]) || '');
  if (WIN) bin = winBinName(bin);
  return [q(bin), ...args.map(q)].join(' ');
}

function visiblePathPrefix() {
  if (WIN) return '';
  return `export PATH=${quoteSh(extraBinDirs().join(':'))}:$PATH; `;
}

export function spawnVisibleScript(body) {
  return spawnVisible(visiblePathPrefix() + String(body || ''));
}

export function visibleFooter() {
  return WIN ? ' & echo. & echo 完成后可关闭本窗口' : "; echo; echo '完成后可关闭本窗口'";
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
  if (WIN) {
    const child = spawn(process.env.ComSpec || 'cmd.exe', ['/c', 'start', '会议助手登录', 'cmd.exe', '/k', line], {
      detached: true, stdio: 'ignore', env, windowsHide: false,
    });
    child.unref();
    return { spawned: true, command: line };
  }
  const child = spawn('sh', ['-lc', line], { detached: true, stdio: 'ignore', env });
  child.unref();
  return { spawned: true, command: line };
}

export function spawnCliVisible({ relPaths, names, args = [], after = '' }) {
  const line = visiblePathPrefix() + formatCliCommand({ relPaths, names, args }) + after;
  return spawnVisible(line);
}
