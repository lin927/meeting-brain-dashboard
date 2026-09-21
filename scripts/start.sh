#!/usr/bin/env bash
# 启动本机会议助手（localhost:3400）。已在运行则只打开浏览器。
# 用法：
#   bash scripts/start.sh
#   bash scripts/start.sh --no-open
#   bash scripts/start.sh --restart --no-open
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${DSH_HOME:-$HOME/.dsh}/meetings"
PORT="${PORT:-3400}"
URL="http://127.0.0.1:$PORT"

# 双击 .command 时不是登录壳，补上常见 Node 路径
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi

OPEN=1
RESTART=0
for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN=0 ;;
    --restart) RESTART=1 ;;
  esac
done

info() { echo "[会议助手] $*"; }
die() { echo "[会议助手] $*" >&2; exit 1; }

health() {
  curl -sf -m 2 "$URL/api/health" >/dev/null 2>&1
}

kill_port() {
  local pids
  pids="$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.4
    pids="$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

launch_server() {
  local node_bin
  node_bin="$(command -v node)"
  python3 - "$DATA_DIR/backend.pid" "$DATA_DIR/backend.log" "$REPO_DIR" "$node_bin" "$REPO_DIR/server/index.js" <<'PY'
import os, subprocess, sys
pidfile, logfile, cwd, *cmd = sys.argv[1:]
os.makedirs(os.path.dirname(pidfile), exist_ok=True)
log = open(logfile, "a", buffering=1)
proc = subprocess.Popen(
    cmd,
    cwd=cwd or None,
    stdin=subprocess.DEVNULL,
    stdout=log,
    stderr=subprocess.STDOUT,
    start_new_session=True,
    env=os.environ.copy(),
)
open(pidfile, "w").write(str(proc.pid))
print(proc.pid)
PY
}

if ! command -v node >/dev/null 2>&1; then
  die "未找到 Node.js。请先运行：bash scripts/install.sh"
fi

mkdir -p "$DATA_DIR"

HEAD=""
if [ -d "$REPO_DIR/.git" ]; then
  HEAD="$(git -C "$REPO_DIR" rev-parse HEAD 2>/dev/null | tr -d '[:space:]' || true)"
elif [ -f "$REPO_DIR/release.json" ]; then
  HEAD="$(node -e "const d=require(process.argv[1]); process.stdout.write([d.git,d.version].filter(Boolean).join('@'))" "$REPO_DIR/release.json" 2>/dev/null || true)"
fi
RUNNING="$(tr -d '[:space:]' < "$DATA_DIR/server-rev" 2>/dev/null || true)"
if [ "$RESTART" != 1 ] && health && [ -n "$HEAD" ] && [ "$HEAD" != "$RUNNING" ]; then
  info "代码已更新，正在重启本机服务…"
  RESTART=1
fi

if [ "$RESTART" = 1 ]; then
  kill_port
fi

if ! health; then
  kill_port
  if [ ! -f "$REPO_DIR/public/app.js" ]; then
    info "正在构建界面…"
    (cd "$REPO_DIR" && npm run build)
  fi
  info "正在启动本机服务 $URL"
  launch_server >/dev/null
  n=0
  while [ "$n" -lt 40 ]; do
    if health; then break; fi
    n=$((n + 1))
    sleep 0.25
  done
  if ! health; then
    die "启动失败，请查看日志：$DATA_DIR/backend.log"
  fi
  info "服务已就绪"
else
  info "服务已在运行 $URL"
fi

if [ "$OPEN" = 1 ]; then
  info "打开浏览器…"
  open "$URL"
  info "已打开。关掉本窗口不影响使用；停止服务请运行 bash scripts/stop.sh"
fi
