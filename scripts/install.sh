#!/usr/bin/env bash
# =============================================================================
# 会议助手 · 本机一键安装（macOS）
#
# 1. 检查/安装 Node.js 与钉钉 DWS CLI（飞书/腾讯 CLI 可选，不自动装）
# 2. 安装依赖（界面产物 public/app.js 已在仓库里，缺文件时才现场编译）
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

# GitHub / 浏览器下的 zip 会带隔离属性，访达双击 .command 会被拦。先清掉。
if [ "$(uname -s)" = Darwin ]; then
  xattr -dr com.apple.quarantine "$REPO_DIR" 2>/dev/null || true
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

refresh_node_path() {
  export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
  hash -r 2>/dev/null || true
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
  fi
}

# 没有 Homebrew 时，下载 Node 22 LTS 的官方 .pkg 并打开安装窗口。
install_node_pkg() {
  local ver dest url
  dest="/tmp/meeting-brain-node.pkg"
  info "正在查找 Node.js 22 LTS 安装包…"
  ver="$(python3 -c '
import json, urllib.request
req = urllib.request.Request("https://nodejs.org/dist/index.json", headers={"User-Agent": "meeting-brain"})
with urllib.request.urlopen(req, timeout=25) as r:
    data = json.load(r)
for x in data:
    v = x.get("version") or ""
    if v.startswith("v22.") and x.get("lts"):
        print(v)
        break
' 2>/dev/null || true)"
  if [ -z "$ver" ]; then
    ver="v22.20.0"
  fi
  for base in \
    "https://nodejs.org/dist/${ver}" \
    "https://npmmirror.com/mirrors/node/${ver}"
  do
    url="${base}/node-${ver}.pkg"
    warn "下载 ${url}"
    if curl -fL --retry 2 --connect-timeout 20 -o "$dest" "$url"; then
      info "已下载，正在打开安装窗口（可能要输入开机密码）…"
      open "$dest"
      echo
      warn "请在弹出窗口里点「继续」把 Node 装完，装完后回到本窗口。"
      read -r -p "[会议助手] 装完后按回车继续…" _
      refresh_node_path
      return 0
    fi
  done
  return 1
}

# ---------- 1. Node.js ----------
refresh_node_path
if ! command -v node >/dev/null 2>&1; then
  warn "未检测到 Node.js，尝试安装…"
  if command -v brew >/dev/null 2>&1; then
    brew install node
    refresh_node_path
  elif ! install_node_pkg; then
    open "https://nodejs.org/" 2>/dev/null || true
    die "自动下载 Node 失败。请打开 https://nodejs.org 下载 LTS（≥ 22.5）装完后，重新运行：bash scripts/install.sh"
  fi
fi
if ! command -v node >/dev/null 2>&1; then
  die "还是找不到 node。请确认刚才的安装已完成，然后重新打开终端再运行：bash scripts/install.sh"
fi
if ! node_ok; then
  die "Node.js 版本过低（$(node -v)），需要 ≥ 22.5。请打开 https://nodejs.org 安装 LTS 后重试。"
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

# ---------- 2b. 飞书 / 腾讯会议 CLI（可选，同事按需） ----------
ask_yes() {
  local prompt="$1"
  local ans=""
  read -r -p "[会议助手] ${prompt} (y/N): " ans || true
  [ "$ans" = "y" ] || [ "$ans" = "Y" ]
}

pipe_open_url() {
  local opened=0 line url
  while IFS= read -r line || [ -n "$line" ]; do
    printf '%s\n' "$line"
    if [ "$opened" -eq 0 ]; then
      url="$(printf '%s' "$line" | grep -oE 'https://[^[:space:]"]+' | head -1 || true)"
      if [ -n "$url" ]; then
        opened=1
        open "$url" 2>/dev/null || true
      fi
    fi
  done
}

feishu_configured() {
  local out
  out="$(lark-cli config show 2>/dev/null || true)"
  echo "$out" | grep -q 'not_configured' && return 1
  echo "$out" | grep -Eq '"ok"[[:space:]]*:[[:space:]]*true' && return 0
  echo "$out" | grep -Eqi '"app[_-]?id"' && return 0
  return 1
}

feishu_logged_in() {
  local out
  out="$(lark-cli auth status --json 2>/dev/null || true)"
  printf '%s' "$out" | python3 -c '
import json,sys
try:
    j=json.load(sys.stdin)
except Exception:
    sys.exit(1)
u=(j.get("identities") or {}).get("user") or {}
sys.exit(0 if u.get("userName") and u.get("tokenStatus") == "valid" else 1)
' 2>/dev/null
}

feishu_parse_device() {
  python3 -c '
import json,re,sys
t=sys.stdin.read()
j={}
try:
    j=json.loads(t)
except Exception:
    m=re.search(r"\{[\s\S]*\}", t)
    if m:
        try: j=json.loads(m.group(0))
        except Exception: j={}
if isinstance(j.get("data"), dict):
    j=j["data"]
url=j.get("verification_uri_complete") or j.get("verification_url") or j.get("verification_uri") or j.get("url") or ""
code=j.get("device_code") or j.get("deviceCode") or ""
if not url:
    m=re.search(r"https://accounts\.feishu\.cn[^\s\"]+", t)
    if m: url=m.group(0)
print(url)
print(code)
'
}

feishu_user_login() {
  echo
  info "第 2 步 / 共 2 步：授权读取妙记。"
  warn "会再打开一个浏览器页，和刚才「创建应用成功」不是同一页。请在新页面点允许。"
  local raw url code
  set +e
  raw="$(lark-cli auth login --domain minutes --no-wait --json 2>&1)"
  set -e
  printf '%s\n' "$raw"
  url="$(printf '%s' "$raw" | feishu_parse_device | sed -n '1p')"
  code="$(printf '%s' "$raw" | feishu_parse_device | sed -n '2p')"
  if [ -n "$url" ]; then
    warn "请完成这个授权页：$url"
    open "$url" 2>/dev/null || true
  fi
  set +e
  if [ -n "$code" ]; then
    lark-cli auth login --device-code "$code"
  else
    lark-cli auth login --domain minutes
  fi
  st=$?
  set -e
  if feishu_logged_in; then
    return 0
  fi
  return "$st"
}

feishu_setup() {
  if ! feishu_configured; then
    echo
    info "第 1 步 / 共 2 步：创建并绑定飞书应用。"
    warn "请在打开的页面里点允许。完成后本窗口会继续第 2 步（授权妙记）。"
    set +e
    set +o pipefail
    lark-cli config init --new --brand feishu --lang zh 2>&1 | pipe_open_url
    init_st=${PIPESTATUS[0]}
    set -o pipefail
    set -e
    if [ "$init_st" != "0" ]; then
      warn "创建应用未完成。可稍后重跑本脚本，或在终端执行："
      warn "  lark-cli config init --new --brand feishu --lang zh"
      warn "  lark-cli auth login --domain minutes"
      return 1
    fi
    info "应用已绑定。下面还要再授权一次妙记，不是重复。"
  fi
  if feishu_logged_in; then
    info "飞书已登录"
    return 0
  fi
  feishu_user_login || true
  if feishu_logged_in; then
    info "飞书已就绪（未勾选的额外权限不影响拉妙记）"
    return 0
  fi
  warn "飞书登录未完成。可稍后在设置 → 听记点「登录」，或执行: lark-cli auth login --domain minutes"
  return 1
}

if ! command -v lark-cli >/dev/null 2>&1; then
  echo
  warn "飞书妙记需要 lark-cli。未装不影响钉钉。"
  if ask_yes "是否安装飞书并完成登录？"; then
    info "正在安装 @larksuite/cli…"
    if npm install -g @larksuite/cli; then
      hash -r 2>/dev/null || true
    else
      warn "安装失败。可稍后手动执行: npm install -g @larksuite/cli"
    fi
  fi
fi
if command -v lark-cli >/dev/null 2>&1; then
  info "飞书 lark-cli 已安装"
  if feishu_logged_in; then
    info "飞书已登录"
  else
    feishu_setup || true
  fi
else
  warn "未装飞书 CLI。要用妙记时重跑本脚本并选择安装，或执行: npm install -g @larksuite/cli"
fi

if ! command -v tmeet >/dev/null 2>&1; then
  echo
  warn "腾讯会议纪要需要 tmeet。未装不影响钉钉。"
  if ask_yes "是否现在安装腾讯会议 CLI？"; then
    info "正在安装 @tencentcloud/tmeet…"
    if npm install -g @tencentcloud/tmeet; then
      hash -r 2>/dev/null || true
    else
      warn "安装失败。可稍后手动执行: npm install -g @tencentcloud/tmeet"
    fi
  fi
fi
if command -v tmeet >/dev/null 2>&1; then
  info "腾讯会议 tmeet 已安装"
  TM_STATUS="$(tmeet auth status 2>/dev/null || true)"
  if echo "$TM_STATUS" | grep -Eqi 'not logged in|未登录'; then
    TM_OK=0
  elif echo "$TM_STATUS" | grep -Eqi 'logged|已登录|openid|user_name|userName'; then
    TM_OK=1
  else
    TM_OK=0
  fi
  if [ "$TM_OK" = "1" ]; then
    info "腾讯会议已登录"
  elif ask_yes "腾讯会议未登录，现在扫码登录？"; then
    set +e
    tmeet auth login
    set -e
    TM_AFTER="$(tmeet auth status 2>/dev/null || true)"
    if echo "$TM_AFTER" | grep -Eqi 'logged|已登录|openid|user_name|userName'; then
      info "腾讯会议已登录"
    else
      warn "腾讯登录未完成，可稍后在设置 → 听记点「登录」"
    fi
  else
    info "跳过腾讯登录。需要时到设置 → 听记点「登录」。"
  fi
else
  warn "未装腾讯会议 CLI。要用纪要时执行: npm install -g @tencentcloud/tmeet"
fi

# ---------- 3. 安装依赖（界面已提交 public/app.js，缺文件时才编译） ----------
info "安装依赖…"
cd "$REPO_DIR"
npm install --no-audit --no-fund
if [ ! -f "$REPO_DIR/public/app.js" ]; then
  info "构建界面…"
  npm run build
fi

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
info "  · 点「更新」拉取已登录来源的听记（钉钉 / 飞书 / 腾讯）"
info "  · 停止服务：bash scripts/stop.sh"
info "======================================================"
