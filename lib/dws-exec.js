// 调用本机 dws。Windows 上不要 shell:true：cmd 会再拆一遍参数，
// 时间戳、+08:00、+list-all 可能被当成下一条命令。
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function bins() {
  return process.platform === 'win32' ? ['dws.cmd', 'dws'] : ['dws'];
}

function opts(extra = {}) {
  const o = {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: extra.maxBuffer || 64 * 1024 * 1024,
  };
  if (extra.timeout) o.timeout = extra.timeout;
  return o;
}

function isMissing(err) {
  return err && (err.code === 'ENOENT' || /not found|不是内部或外部命令/i.test(String(err.message || '')));
}

export async function execDws(args, extra = {}) {
  let last;
  for (const bin of bins()) {
    try {
      return await execFileAsync(bin, args, opts(extra));
    } catch (e) {
      last = e;
      if (isMissing(e)) continue;
      throw e;
    }
  }
  throw last;
}

export function execDwsSync(args, extra = {}) {
  let last;
  for (const bin of bins()) {
    try {
      return execFileSync(bin, args, opts(extra));
    } catch (e) {
      last = e;
      if (isMissing(e)) continue;
      throw e;
    }
  }
  throw last;
}
