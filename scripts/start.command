#!/bin/bash
# 可在访达中双击。安装脚本也会复制到桌面。
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "$DIR/start.sh"
