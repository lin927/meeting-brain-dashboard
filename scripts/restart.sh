#!/usr/bin/env bash
# 编译独立界面并重启本机会议助手（localhost:3400）。不启动、不停止 DSH。
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"

info() { echo "[restart] $*"; }

info "编译独立界面…"
cd "$REPO_DIR"
npm run build

bash "$REPO_DIR/scripts/start.sh" --restart --no-open
info "会议助手已就绪 http://127.0.0.1:${PORT:-3400}  ·  请刷新浏览器"
