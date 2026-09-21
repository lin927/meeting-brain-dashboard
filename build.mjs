/**
 * 构建独立 Web（public/app.js）与 DSH host 工具（lib/index.js）。
 * 产物提交进仓库，同事 git pull 后不用再编译即可运行。
 * 改 src/ 后请重新构建并一起提交。
 */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('lib', { recursive: true });
mkdirSync('public', { recursive: true });

await build({
  entryPoints: ['src/web/main.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outfile: 'public/app.js',
  sourcemap: false,
  minify: false,
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
});

await build({
  entryPoints: ['src/host/index.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  outfile: 'lib/index.js',
  sourcemap: false,
  logLevel: 'info',
  external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-tools'],
});

console.log('✅ public/app.js（独立界面）与 lib/index.js（DSH 会议工具）构建完成');
