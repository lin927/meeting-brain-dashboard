import { execNamed, findNpmFile } from './cli-bin.js';

function findTmeetJs() {
  return findNpmFile([
    '@tencentcloud/tmeet/bin/tmeet.js',
    '@tencentcloud/tmeet/dist/tmeet.js',
  ]);
}

export async function execTmeet(args, extra = {}) {
  const js = findTmeetJs();
  const names = process.platform === 'win32' ? ['tmeet.cmd', 'tmeet'] : ['tmeet'];
  try {
    return await execNamed({ jsFile: js, names, args, extra });
  } catch (e) {
    if (js) throw e;
    throw e.code === 'ENOENT' ? new Error('未找到 tmeet。请先安装：npm install -g @tencentcloud/tmeet') : e;
  }
}
