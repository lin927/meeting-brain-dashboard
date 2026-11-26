import { execNamed, findNpmFile, isCliMissing } from './cli-bin.js';

export const TMEET_JS = [
  '@tencentcloud/tmeet/bin/tmeet.js',
  '@tencentcloud/tmeet/dist/tmeet.js',
];
export const TMEET_NAMES = ['tmeet'];

function findTmeetJs() {
  return findNpmFile(TMEET_JS);
}

export async function execTmeet(args, extra = {}) {
  const js = findTmeetJs();
  try {
    return await execNamed({ jsFile: js, relPaths: TMEET_JS, names: TMEET_NAMES, args, extra });
  } catch (e) {
    if (js) throw e;
    throw isCliMissing(e) ? new Error('未找到 tmeet。请先安装：npm install -g @tencentcloud/tmeet') : e;
  }
}
