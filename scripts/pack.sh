#!/usr/bin/env bash
# 打一份给同事用的运行包 dist/meeting-brain.zip。不含 git / src / node_modules。
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 "$ROOT/scripts/pack.py"
