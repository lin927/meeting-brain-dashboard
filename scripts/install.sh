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
# 从 node -v（如 v24.13.0）提取主版本号，避免不同 shell 的引号传递差异
NODE_VER="$(node -v)"
NODE_MAJOR="$(echo "$NODE_VER" | sed -n 's/^v\{0,1\}\([0-9]*\)\..*/\1/p')"
if [ -z "$NODE_MAJOR" ]; then
  die "无法解析 Node.js 版本：$NODE_VER"
fi
if [ "$NODE_MAJOR" -lt 22 ]; then
  die "Node.js 版本过低（$NODE_VER），需要 >= 22.5。请升级后重试。"
fi
info "Node.js $NODE_VER OK"

# ---------- 2. 钉钉 DWS CLI ----------
if ! command -v dws >/dev/null 2>&1; then
  warn "未检测到钉钉 DWS CLI，尝试通过 npm 全局安装…"
  npm install -g dingtalk-workspace-cli >/dev/null 2>&1 || true
fi
if command -v dws >/dev/null 2>&1; then
  info "DWS $(dws --version 2>/dev/null || echo '已安装') OK"
  # 登录检测：dws auth status 返回 authenticated。未登录/过期则自动拉起 OAuth 扫码登录。
  AUTH_STATUS="$(dws auth status 2>/dev/null || true)"
  if ! echo "$AUTH_STATUS" | grep -q '"authenticated": true'; then
    warn "检测到 DWS 未登录或登录已过期，自动打开登录（浏览器弹出钉钉授权，请扫码/确认）…"
    dws auth login || warn "dws auth login 未完成，可稍后手动执行: dws auth login"
  else
    info "DWS 已登录（$(echo "$AUTH_STATUS" | grep -o '"user_name": "[^"]*"' | cut -d'"' -f4)）"
  fi
else
  warn "npm 安装 dws 失败（可能网络或权限问题）。请手动安装："
  warn "  方式 A：npm install -g dingtalk-workspace-cli"
  warn "  方式 B：curl -fsSL https://dws.dingtalk.com/install | bash"
  warn "  参考：https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli"
  warn "安装完成后重新运行本脚本，并执行: dws auth login"
fi

# ---------- 3. 安装依赖 + 构建 ----------
info "安装依赖（首次会下载约 24MB 本地嵌入模型，之后离线可用）…"
cd "$REPO_DIR"
if [ ! -d node_modules ]; then
  # devDependencies 含后端运行时依赖（express + transformers），npm 会一并安装
  npm install --no-audit --no-fund
fi
info "构建 client 插件 bundle…"
npm run build

# ---------- 4. 检测并安装 DSH（DeepSeek Harness） ----------
# 驾驶舱插件运行在 DSH Web 里；本仓库不包含 DSH 本体，只包含插件。
# 步骤：装 dsh 全局命令 → 启动一次 dsh web 生成 profile → 本脚本继续注册插件。
if ! command -v dsh >/dev/null 2>&1; then
  warn "未检测到 dsh 命令，尝试通过 npm 全局安装 @deepseek-ai/dsh…"
  npm install -g @deepseek-ai/dsh >/dev/null 2>&1 || true
fi
if command -v dsh >/dev/null 2>&1; then
  info "dsh 已安装: $(dsh --version 2>/dev/null || echo 'OK')"
else
  echo
  die "npm 安装 dsh 失败。请手动执行：npm install -g @deepseek-ai/dsh，然后重新运行本脚本。"
fi
# DSH Web 首次启动后才会生成 profile（插件注册目标）
if [ ! -f "$PROFILE_DIR/package.json" ]; then
  echo
  warn "DSH Web 尚未启动过（缺 profile：$PROFILE_DIR）。"
  warn "请执行以下命令启动 DSH Web（首次启动会生成 profile）："
  echo
  warn "        dsh web"
  warn "      或（不想全局安装时）：npx @deepseek-ai/dsh web"
  echo
  warn "确认浏览器打开 http://127.0.0.1:3080 看到 DSH 界面后，"
  warn "Ctrl+C 停止 DSH，再重新运行本脚本。"
  echo
  die "请先启动一次 DSH Web 生成 profile，然后重新运行本脚本。"
fi
info "DSH Web profile 已存在（$PROFILE_DIR）"

# 幂等：已在 dependencies 中则跳过
# 注：meeting-brain-dashboard 是「客户端插件 + bundle patch」双角色包——
#   - package.json 声明 dsh.bundle.patch（cordis.patch.yml 注册插件行到 loader）
#   - package.json 声明 dsh.client（client-modules 扫描后挂载浏览器 half）
#   - 零生产依赖：profile 的 pnpm install 不会重复下载 transformers/onnxruntime
#   - pnpm 的 file: 依赖以硬链接同步整个仓库目录，cordis.patch.yml 自动带上
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
  info "安装 profile 依赖（pnpm，仅插件本身，秒级完成）…"
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
info "  4. 若未同步任何内容：确认已执行 dws auth login 且账号有听记权限"
info "======================================================"
echo
info "常用命令："
info "  启动后端:  node $REPO_DIR/server/index.js"
info "  同步听记:  node $REPO_DIR/lib/cli.js pull && node $REPO_DIR/lib/cli.js index"
info "  查看日志:  tail -f $DSH_HOME/meetings/backend.log"
