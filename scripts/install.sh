#!/usr/bin/env bash
# =============================================================================
# 会议助手 · 本机一键安装（macOS）
#
# 1. 检查/安装 Node.js 与钉钉 DWS CLI
# 2. 安装依赖并构建独立界面
# 3. 把「会议助手」放到桌面，启动 localhost:3400 并打开浏览器
#
# 不依赖 DSH。使用：bash scripts/install.sh
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[会议助手]${NC} $*"; }
warn()  { echo -e "${YELLOW}[会议助手]${NC} $*"; }
die()   { echo -e "${RED}[会议助手]${NC} $*" >&2; exit 1; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${DSH_HOME:-$HOME/.dsh}/meetings"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi

info "仓库目录: $REPO_DIR"

node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local ver major minor
  ver="$(node -v)"
  major="$(echo "$ver" | sed -n 's/^v\{0,1\}\([0-9]*\)\..*/\1/p')"
  minor="$(echo "$ver" | sed -n 's/^v\{0,1\}[0-9]*\.\([0-9]*\).*/\1/p')"
  [ -n "$major" ] || return 1
  if [ "$major" -gt 22 ]; then return 0; fi
  if [ "$major" -eq 22 ] && [ "${minor:-0}" -ge 5 ]; then return 0; fi
  return 1
}

# ---------- 1. Node.js ----------
if ! command -v node >/dev/null 2>&1; then
  warn "未检测到 Node.js，尝试通过 Homebrew 安装…"
  if command -v brew >/dev/null 2>&1; then
    brew install node
  else
    die "未找到 Homebrew。请先安装 Node.js ≥ 22.5（https://nodejs.org）后重试。"
  fi
fi
if ! node_ok; then
  die "Node.js 版本过低（$(node -v)），需要 ≥ 22.5。请升级后重试。"
fi
info "Node.js $(node -v) OK"

# ---------- 2. 钉钉 DWS CLI ----------
if ! command -v dws >/dev/null 2>&1; then
  warn "未检测到钉钉 DWS CLI，尝试通过 npm 全局安装…"
  npm install -g dingtalk-workspace-cli >/dev/null 2>&1 || true
fi
if command -v dws >/dev/null 2>&1; then
  info "DWS $(dws --version 2>/dev/null || echo '已安装') OK"
  if dws upgrade --check 2>&1 | grep -q "新版本可用"; then
    echo
    warn "检测到 DWS 有新版本可用："
    dws upgrade --check 2>&1 | sed -n '1,12p'
    echo
    read -r -p "[会议助手] 是否现在升级 DWS 到最新版本？(y/N): " UPGRADE_ANS
    if [ "$UPGRADE_ANS" = "y" ] || [ "$UPGRADE_ANS" = "Y" ]; then
      info "正在升级 DWS…"
      dws upgrade || warn "dws upgrade 未完成，可稍后手动执行: dws upgrade"
    else
      info "跳过升级（当前 $(dws --version 2>/dev/null)）。若后续同步报命令错误，请先 dws upgrade。"
    fi
  fi
  AUTH_STATUS="$(dws auth status 2>/dev/null || true)"
  if ! echo "$AUTH_STATUS" | grep -q '"authenticated": true'; then
    warn "检测到 DWS 未登录或登录已过期，自动打开登录（浏览器弹出钉钉授权，请扫码/确认）…"
    dws auth login || warn "dws auth login 未完成，可稍后手动执行: dws auth login"
  else
    info "DWS 已登录（$(echo "$AUTH_STATUS" | grep -o '"user_name": "[^"]*"' | cut -d'"' -f4)）"
  fi
else
  warn "npm 安装 dws 失败（可能网络或权限问题）。请手动安装："
  warn "  npm install -g dingtalk-workspace-cli"
  warn "  参考：https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli"
  warn "安装完成后重新运行本脚本，并执行: dws auth login"
fi

# ---------- 3. 安装依赖 + 构建 ----------
info "安装依赖…"
cd "$REPO_DIR"
npm install --no-audit --no-fund
info "构建界面…"
npm run build

# ---------- 4. 桌面快捷方式 ----------
mkdir -p "$DATA_DIR"
DESKTOP=""
if [ -d "$HOME/Desktop" ]; then DESKTOP="$HOME/Desktop"
elif [ -d "$HOME/桌面" ]; then DESKTOP="$HOME/桌面"
fi
if [ -n "$DESKTOP" ]; then
  LAUNCHER="$DESKTOP/会议助手.command"
  cat > "$LAUNCHER" <<EOF
#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:\$HOME/.local/bin:\$PATH"
exec bash "$REPO_DIR/scripts/start.sh"
EOF
  chmod +x "$LAUNCHER"
  xattr -d com.apple.quarantine "$LAUNCHER" 2>/dev/null || true
  info "已放到桌面：会议助手.command（以后双击即可）"
else
  warn "未找到桌面目录。可在访达中双击： $REPO_DIR/scripts/start.command"
  chmod +x "$REPO_DIR/scripts/start.command"
fi
chmod +x "$REPO_DIR/scripts/start.sh" "$REPO_DIR/scripts/stop.sh" "$REPO_DIR/scripts/start.command" "$REPO_DIR/scripts/install.sh"

# ---------- 5. 启动并打开浏览器 ----------
bash "$REPO_DIR/scripts/start.sh"

echo
info "======================================================"
info "安装完成。浏览器应已打开 http://127.0.0.1:3400"
info "  · 以后使用：双击桌面上的「会议助手」"
info "  · 设置页填写大模型 API Key（问答/总结用）"
info "  · 点「更新」拉取钉钉听记（需已完成 dws 登录）"
info "  · 停止服务：bash scripts/stop.sh"
info "======================================================"
