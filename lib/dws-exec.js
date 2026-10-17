// 调用本机 dws。优先直接跑 CLI 的 js，找不到再按 PATH 找二进制（含 ~/.local/bin）。
import { execFileSync } from 'node:child_process';
import { execNamed, execOpts, findNpmFile } from './cli-bin.js';

function findDwsJs() {
  return findNpmFile([
    'dingtalk-workspace-cli/bin/dws.js',
  ]);
}

function dwsNames() {
  return process.platform === 'win32' ? ['dws.cmd', 'dws'] : ['dws'];
}

function missingError(err) {
  const code = err && err.code;
  if (code === 'ENOENT' || /not found|不是内部或外部命令|spawn dws/i.test(String((err && err.message) || err))) {
    return new Error('未找到 dws。请确认已安装钉钉 CLI，且 ~/.local/bin 在 PATH 里');
  }
  return err;
}

export async function execDws(args, extra = {}) {
  const js = findDwsJs();
  try {
    return await execNamed({ jsFile: js, names: dwsNames(), args, extra });
  } catch (e) {
    throw missingError(e);
  }
}

export function execDwsSync(args, extra = {}) {
  const js = findDwsJs();
  const o = execOpts(extra);
  if (js) {
    const stdout = execFileSync(process.execPath, [js, ...args], o);
    return typeof stdout === 'string' ? stdout : String(stdout || '');
  }
  let last;
  for (const bin of dwsNames()) {
    try {
      const stdout = execFileSync(bin, args, o);
      return typeof stdout === 'string' ? stdout : String(stdout || '');
    } catch (e) {
      last = e;
      if (e && e.code === 'ENOENT') continue;
      throw missingError(e);
    }
  }
  throw missingError(last || new Error('未找到 dws'));
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
