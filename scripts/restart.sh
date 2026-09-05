#!/usr/bin/env bash
# 编译驾驶舱插件，并重启本机后端 + DSH Web。
# 改完 src/client、server、lib 后由 agent 自动执行，无需手动启动。
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
LOG_DIR="$DSH_HOME/meetings"
BACKEND_PORT="${PORT:-3400}"
DSH_PORT="${DSH_PORT:-3080}"
DSH_HARNESS="${DSH_HARNESS_DIR:-$HOME/code/deepseek/deepseek-harness}"
NODE_BIN="$(command -v node)"
PNPM_BIN="$(command -v pnpm)"
export MEETING_BRAIN_REPO="$REPO_DIR"

mkdir -p "$LOG_DIR"

info() { echo "[restart] $*"; }

wait_port_free() {
  local port="$1" n=0
  while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    n=$((n + 1))
    if [ "$n" -gt 30 ]; then
      echo "[restart] 端口 $port 仍被占用" >&2
      return 1
    fi
    sleep 0.3
  done
}

wait_http() {
  local url="$1" n=0
  while [ "$n" -lt 60 ]; do
    if curl -sf -m 2 "$url" >/dev/null 2>&1; then return 0; fi
    n=$((n + 1))
    sleep 0.5
  done
  echo "[restart] 等待 $url 超时" >&2
  return 1
}

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    info "结束占用 $port 的进程: $pids"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.4
    pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
  fi
  wait_port_free "$port"
}

# 新会话拉起守护进程，避免脚本退出时把后端/DSH 一起杀掉。
start_daemon() {
  local pidfile="$1" logfile="$2" cwd="$3"
  shift 3
  python3 - "$pidfile" "$logfile" "$cwd" "$@" <<'PY'
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

# ---------- 编译 ----------
info "编译 client / host bundle…"
cd "$REPO_DIR"
npm run build

# ---------- 停 DSH（避免 host 看门狗把旧后端拉起来）----------
kill_port "$DSH_PORT"
# pnpm dsh web 父进程未必占 3080，顺带清掉残留
pkill -f "pnpm dsh web" 2>/dev/null || true
pkill -f "apps/cli/src/bin.ts web" 2>/dev/null || true
sleep 0.3

# ---------- 重启后端 ----------
kill_port "$BACKEND_PORT"
info "启动后端 http://127.0.0.1:$BACKEND_PORT"
start_daemon "$LOG_DIR/backend.pid" "$LOG_DIR/backend.log" "$REPO_DIR" "$NODE_BIN" "$REPO_DIR/server/index.js" >/dev/null
wait_http "http://127.0.0.1:$BACKEND_PORT/api/health"
info "后端已就绪"

# ---------- 启动 DSH Web ----------
if [ ! -d "$DSH_HARNESS" ]; then
  echo "[restart] 未找到 DSH 仓库: $DSH_HARNESS（可设 DSH_HARNESS_DIR）" >&2
  exit 1
fi
info "启动 DSH Web http://127.0.0.1:$DSH_PORT"
if [ -z "$PNPM_BIN" ]; then
  echo "[restart] 未找到 pnpm，无法启动 DSH Web" >&2
  exit 1
fi
start_daemon "$LOG_DIR/dsh-web.pid" "$LOG_DIR/dsh-web.log" "$DSH_HARNESS" "$PNPM_BIN" dsh web >/dev/null
wait_http "http://127.0.0.1:$DSH_PORT/"
info "DSH Web 已就绪"
info "完成：后端 :$BACKEND_PORT  ·  DSH :$DSH_PORT  ·  请刷新浏览器"
