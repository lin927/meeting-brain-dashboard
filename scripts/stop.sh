#!/usr/bin/env bash
# 停止本机会议助手（localhost:3400）
set -euo pipefail

DATA_DIR="${DSH_HOME:-$HOME/.dsh}/meetings"
PORT="${PORT:-3400}"
PIDFILE="$DATA_DIR/backend.pid"

info() { echo "[会议助手] $*"; }

if [ -f "$PIDFILE" ]; then
  pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    sleep 0.3
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$PIDFILE"
fi

pids="$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$pids" ]; then
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 0.3
  pids="$(lsof -nP -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
fi

info "已停止"
