#!/usr/bin/env bash
# =============================================================================
# meeting-brain-dashboard 一键安装（macOS）
#
# 用途：给公司同事在本机安装「会议驾驶舱」。
#   1. 检查/安装 Node.js 与钉钉 DWS CLI
#   2. 安装本仓库依赖（@huggingface/transformers 本地嵌入模型 + express）
#   3. 构建 DSH client 插件 bundle
#   4. 注册插件到 DSH Web profile
#   5. 启动本地后端（localhost:3400）
#
# 隐私：所有会议数据只存本机 SQLite；AI 问答/深度总结按配置走 DeepSeek 云端。
# 使用：bash scripts/install.sh
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[meeting-brain]${NC} $*"; }
warn()  { echo -e "${YELLOW}[meeting-brain]${NC} $*"; }
die()   { echo -e "${RED}[meeting-brain]${NC} $*" >&2; exit 1; }

# 仓库根目录（脚本所在目录的上一级）
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME/profiles/web"
PACKAGE_NAME="meeting-brain-dashboard"
BACKEND_PORT="${PORT:-3400}"

info "仓库目录: $REPO_DIR"
info "DSH Home: $DSH_HOME"

# ---------- 1. Node.js ----------
if ! command -v node >/dev/null 2>&1; then
  warn "未检测到 Node.js，尝试通过 Homebrew 安装…"
  if command -v brew >/dev/null 2>&1; then
    brew install node
  else
    die "未找到 Homebrew。请先安装 Node.js >= 22.5（https://nodejs.org）后重试。"
  fi
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  die "Node.js 版本过低（$(node -v)），需要 >= 22.5。请升级后重试。"
fi
info "Node.js $(node -v) OK"

# ---------- 2. 钉钉 DWS CLI ----------
if ! command -v dws >/dev/null 2>&1; then
  warn "未检测到钉钉 DWS CLI，需要安装后才能同步听记。"
  warn "安装方式（二选一）："
  warn "  A. 官方安装脚本：curl -fsSL https://dws.dingtalk.com/install | bash"
  warn "  B. 手动安装：请参考 https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli"
  warn "安装完成后重新运行本脚本，并执行: dws login"
else
  info "DWS $(dws --version 2>/dev/null || echo '已安装') OK"
  if ! ls "$HOME/.dws/token.json" >/dev/null 2>&1; then
    warn "检测到 DWS 已安装但未登录，请执行: dws login"
  fi
fi

# ---------- 3. 安装依赖 + 构建 ----------
info "安装依赖（首次会下载约 24MB 本地嵌入模型，之后离线可用）…"
cd "$REPO_DIR"
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi
info "构建 client 插件 bundle…"
npm run build

# ---------- 4. 注册到 DSH Web profile ----------
if [ ! -f "$PROFILE_DIR/package.json" ]; then
  die "未找到 DSH Web profile（$PROFILE_DIR）。请先运行 DSH Web 一次后重试。"
fi

# 幂等：已在 dependencies 中则跳过
if ! grep -q "\"$PACKAGE_NAME\"" "$PROFILE_DIR/package.json"; then
  info "注册插件到 DSH Web profile…"
  # 用 node 修改 package.json（安全 JSON 处理）
  node - "$PROFILE_DIR/package.json" "$REPO_DIR" "$PACKAGE_NAME" <<'EOF'
const [pkgPath, repoDir, pkgName] = process.argv.slice(2)
const fs = require('node:fs')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
pkg.dependencies = pkg.dependencies || {}
pkg.dependencies[pkgName] = `file:${repoDir}`
pkg.dsh = pkg.dsh || {}
pkg.dsh.profile = pkg.dsh.profile || {}
pkg.dsh.profile.bundles = pkg.dsh.profile.bundles || []
if (!pkg.dsh.profile.bundles.includes(pkgName)) pkg.dsh.profile.bundles.push(pkgName)
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(`已注册 ${pkgName} → ${pkgPath}`)
EOF
  info "安装 profile 依赖（pnpm）…"
  (cd "$PROFILE_DIR" && pnpm install --no-frozen-lockfile 2>/dev/null || npm install --no-audit --no-fund)
else
  info "插件已在 profile 中注册，跳过"
fi

# ---------- 5. DeepSeek key 提示 ----------
if [ ! -f "$DSH_HOME/.credentials.yaml" ] || ! grep -q "DEEPSEEK_API_KEY" "$DSH_HOME/.credentials.yaml"; then
  warn "未检测到 DEEPSEEK_API_KEY（$DSH_HOME/.credentials.yaml）。"
  warn "AI 问答/深度总结需要它。请手动添加："
  warn "  DEEPSEEK_API_KEY: sk-xxxx"
fi

# ---------- 6. 启动后端 ----------
if curl -s -m 2 "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
  info "后端已在运行: http://127.0.0.1:$BACKEND_PORT"
else
  info "启动后端（后台）: http://127.0.0.1:$BACKEND_PORT"
  # 常驻：写日志，nohup 启动
  mkdir -p "$DSH_HOME/meetings"
  nohup node "$REPO_DIR/server/index.js" >> "$DSH_HOME/meetings/backend.log" 2>&1 &
  echo $! > "$DSH_HOME/meetings/backend.pid"
  sleep 2
  if curl -s -m 3 "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    info "后端启动成功"
  else
    warn "后端启动可能失败，查看日志: tail -f $DSH_HOME/meetings/backend.log"
  fi
fi

# ---------- 完成 ----------
echo
info "======================================================"
info "安装完成！"
info "  1. 重启 DSH Web GUI（插件注册需重启生效）"
info "  2. 打开对话界面 → 顶部「会议驾驶舱」tab"
info "  3. 首次使用点击「立即同步」拉取你的钉钉听记"
info "  4. 若未同步任何内容：确认已执行 dws login 且账号有听记权限"
info "======================================================"
echo
info "常用命令："
info "  启动后端:  node $REPO_DIR/server/index.js"
info "  同步听记:  node $REPO_DIR/lib/cli.js pull && node $REPO_DIR/lib/cli.js index"
info "  查看日志:  tail -f $DSH_HOME/meetings/backend.log"
