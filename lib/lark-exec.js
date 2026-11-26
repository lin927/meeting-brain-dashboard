import { execNamed, findNpmFile, isCliMissing } from './cli-bin.js';

export const LARK_JS = [
  '@larksuite/cli/bin/lark-cli.js',
  '@larksuite/cli/dist/cli.js',
  '@larksuite/cli/bin/cli.js',
];
export const LARK_NAMES = ['lark-cli'];

function findLarkJs() {
  return findNpmFile(LARK_JS);
}

export async function execLark(args, extra = {}) {
  const js = findLarkJs();
  try {
    return await execNamed({ jsFile: js, relPaths: LARK_JS, names: LARK_NAMES, args, extra });
  } catch (e) {
    if (js) throw e;
    throw isCliMissing(e) ? new Error('未找到 lark-cli。请先安装：npm install -g @larksuite/cli') : e;
  }
}
