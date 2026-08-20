/**
 * 构建 meeting-brain-dashboard 的 client bundle。
 * 产出格式与 DSH 官方 client 插件一致：
 *   window.__ModuleLoader__.load({ id, factory: (require) => { ...CJS...; return module.exports; } })
 * react / @deepseek-ai/* 保持外部引用，由客户端模块系统的 require 解析。
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';

const PACKAGE = 'meeting-brain-dashboard';

const HEAD = `window.__ModuleLoader__.load({\n\tid: ${JSON.stringify(PACKAGE)},\n\tfactory: (require) => {\n\t\tvar module = { exports: {} };\n\t\tvar exports = module.exports;\n\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });\n`;
const TAIL = `\n\t\treturn module.exports;\n\t}\n});\n`;

mkdirSync('lib', { recursive: true });

await build({
  entryPoints: ['src/client/index.js'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  plugins: [
    {
      name: 'external-deepseek-ai',
      setup(build) {
        build.onResolve({ filter: /^@deepseek-ai\// }, (args) => ({ path: args.path, external: true }));
      },
    },
  ],
  banner: { js: HEAD },
  footer: { js: TAIL },
  outfile: 'lib/client.js',
  sourcemap: false,
  minify: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
});

// Node half：host 端插件（注册会议工具），浏览器 half 是驾驶舱 UI
await build({
  entryPoints: ['src/host/index.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  outfile: 'lib/index.js',
  sourcemap: false,
  logLevel: 'info',
  external: ['@deepseek-ai/cordis'],
});

console.log('✅ lib/client.js（驾驶舱 UI）与 lib/index.js（会议工具 host half）构建完成');
