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

// Node half：与 DSH 官方 client 插件一致的简单空插件（浏览器 half 是全部行为）
writeFileSync('lib/index.js', `// meeting-brain-dashboard node half — 纯 UI 插件，行为全在浏览器 half。
function apply() {}
export { apply };
`);

console.log('✅ lib/client.js 与 lib/index.js 构建完成');
