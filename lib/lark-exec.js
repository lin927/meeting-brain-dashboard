import { execNamed, findNpmFile } from './cli-bin.js';

function findLarkJs() {
  return findNpmFile([
    '@larksuite/cli/bin/lark-cli.js',
    '@larksuite/cli/dist/cli.js',
    '@larksuite/cli/bin/cli.js',
  ]);
}

export async function execLark(args, extra = {}) {
  const js = findLarkJs();
  const names = process.platform === 'win32' ? ['lark-cli.cmd', 'lark-cli'] : ['lark-cli'];
  try {
    return await execNamed({ jsFile: js, names, args, extra });
  } catch (e) {
    if (js) throw e;
    throw e.code === 'ENOENT' ? new Error('未找到 lark-cli。请先安装：npm install -g @larksuite/cli') : e;
  }
}
