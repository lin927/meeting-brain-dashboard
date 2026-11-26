// 调用本机 dws。优先直接跑 CLI 的 js，找不到再按 PATH 找命令名（Mac 二进制 / Windows cmd.exe）。
import { execNamed, execNamedSync, findNpmFile, isCliMissing } from './cli-bin.js';

export const DWS_JS = ['dingtalk-workspace-cli/bin/dws.js'];
export const DWS_NAMES = ['dws'];

export function findDwsJs() {
  return findNpmFile(DWS_JS);
}

function missingError(err) {
  if (isCliMissing(err)) {
    return new Error('未找到 dws。请确认已安装钉钉 CLI，且安装目录已在 PATH 里（Mac 常见 ~/.local/bin，Windows 常见 Node 目录或 %APPDATA%\\npm）');
  }
  return err;
}

export async function execDws(args, extra = {}) {
  try {
    return await execNamed({ jsFile: findDwsJs(), relPaths: DWS_JS, names: DWS_NAMES, args, extra });
  } catch (e) {
    throw missingError(e);
  }
}

export function execDwsSync(args, extra = {}) {
  try {
    return execNamedSync({ jsFile: findDwsJs(), relPaths: DWS_JS, names: DWS_NAMES, args, extra });
  } catch (e) {
    throw missingError(e);
  }
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
