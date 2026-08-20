# =============================================================================
# meeting-brain-dashboard 一键安装（Windows）
#
# 用途：给公司同事在本机安装「会议驾驶舱」。
#   1. 检查 Node.js 与钉钉 DWS CLI
#   2. 安装本仓库依赖 + 构建 DSH client 插件 bundle
#   3. 注册插件到 DSH Web profile
#   4. 启动本地后端（localhost:3400）
#
# 隐私：所有会议数据只存本机 SQLite；AI 问答/深度总结按配置走 DeepSeek 云端。
# 使用（PowerShell）：
#   powershell -ExecutionPolicy Bypass -File scripts\install.ps1
# =============================================================================
$ErrorActionPreference = 'Stop'
$Green = [char]27 + '[0;32m'; $Yellow = [char]27 + '[1;33m'; $Red = [char]27 + '[0;31m'; $NC = [char]27 + '[0m'
function Info($m) { Write-Host "$Green[meeting-brain]$NC $m" }
function Warn($m) { Write-Host "$Yellow[meeting-brain]$NC $m" }
function Die($m) { Write-Host "$Red[meeting-brain]$NC $m" -ForegroundColor Red; exit 1 }

$RepoDir = Split-Path -Parent $PSScriptRoot
$DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$ProfileDir = Join-Path $DshHome 'profiles\web'
$PackageName = 'meeting-brain-dashboard'
$BackendPort = if ($env:PORT) { $env:PORT } else { 3400 }

Info "仓库目录: $RepoDir"
Info "DSH Home: $DshHome"

# ---------- 1. Node.js ----------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Warn "未检测到 Node.js。请从 https://nodejs.org 安装 LTS（>= 22.5）后重试。"
    Die '需要 Node.js >= 22.5'
}
# 从 node -v（如 v24.13.0）提取主版本号，避免跨 PowerShell 传参引号问题
$nodeVer = (node -v).Trim()
if ($nodeVer -notmatch '^v?(\d+)\.') {
    Die "无法解析 Node.js 版本：$nodeVer"
}
$nodeMajor = [int]$Matches[1]
if ($nodeMajor -lt 22) {
    Die "Node.js 版本过低（$nodeVer），需要 >= 22.5。请升级后重试。"
}
Info "Node.js $nodeVer OK"

# ---------- 2. 钉钉 DWS CLI ----------
if (-not (Get-Command dws -ErrorAction SilentlyContinue)) {
    Warn '未检测到钉钉 DWS CLI。安装方式：'
    Warn '  A. 官方安装脚本: curl -fsSL https://dws.dingtalk.com/install | bash （或 Windows 安装包）'
    Warn '  B. 参考 https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli'
    Warn '安装后重新运行本脚本，并执行: dws login'
} else {
    Info 'DWS 已安装 OK'
    if (-not (Test-Path (Join-Path $HOME '.dws\token.json'))) {
        Warn 'DWS 已安装但未登录，请执行: dws login'
    }
}

# ---------- 3. 安装依赖 + 构建 ----------
Info '安装依赖（首次会下载约 24MB 本地嵌入模型，之后离线可用）…'
Set-Location $RepoDir
if (-not (Test-Path 'node_modules')) {
    # devDependencies 含后端运行时依赖（express + transformers），npm 会一并安装
    npm install --no-audit --no-fund
}
Info '构建 client 插件 bundle…'
npm run build

# ---------- 4. 检测并引导安装 DSH（DeepSeek Harness） ----------
# 驾驶舱插件运行在 DSH Web 里；本仓库不包含 DSH 本体，只包含插件。
# 检测标志：DSH Web 首次启动后会生成 ~/.dsh/profiles/web/package.json。
if (-not (Test-Path (Join-Path $ProfileDir 'package.json'))) {
    Write-Host ''
    Warn ("未检测到 DSH（DeepSeek Harness）Web profile：" + $ProfileDir)
    Warn '会议驾驶舱插件需要先有 DSH Web 才能注册。本仓库不含 DSH 本体，请先安装：'
    Write-Host ''
    Warn '  【1】确保已安装 Node.js >= 22.5（本脚本前面已检查）'
    Warn '  【2】启动 DSH Web（首次会自动安装并生成 profile）：'
    Warn '        npx @deepseek-ai/dsh web'
    Warn '      说明：首次运行 npx 会提示安装 @deepseek-ai/dsh 包，输入 y 确认。'
    Warn '  【3】确认浏览器打开 http://127.0.0.1:3080 看到 DSH 界面后，'
    Warn '        关闭 DSH，再重新运行本脚本。'
    Write-Host ''
    Die '请先按上面步骤安装并启动一次 DSH Web，然后重新运行本脚本。'
}
Info ("DSH Web profile 已存在（" + $ProfileDir + "）")
# 注：meeting-brain-dashboard 是「客户端插件 + bundle patch」双角色包——
#   - package.json 声明 dsh.bundle.patch（cordis.patch.yml 注册插件行到 loader）
#   - package.json 声明 dsh.client（client-modules 扫描后挂载浏览器 half）
#   - 零生产依赖：profile 的 pnpm install 不会重复下载 transformers/onnxruntime
#   - pnpm 的 file: 依赖以硬链接同步整个仓库目录，cordis.patch.yml 自动带上
$pkgJson = Get-Content (Join-Path $ProfileDir 'package.json') -Raw | ConvertFrom-Json
if ($null -eq $pkgJson.dependencies -or -not $pkgJson.dependencies.$PackageName) {
    Info '注册插件到 DSH Web profile…'
    if ($null -eq $pkgJson.dependencies) { $pkgJson | Add-Member -NotePropertyName dependencies -NotePropertyValue @{} }
    $pkgJson.dependencies | Add-Member -NotePropertyName $PackageName -NotePropertyValue "file:$RepoDir" -Force
    if ($null -eq $pkgJson.dsh) { $pkgJson | Add-Member -NotePropertyName dsh -NotePropertyValue @{} }
    if ($null -eq $pkgJson.dsh.profile) { $pkgJson.dsh | Add-Member -NotePropertyName profile -NotePropertyValue @{} }
    if ($null -eq $pkgJson.dsh.profile.bundles) { $pkgJson.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue @() }
    if ($pkgJson.dsh.profile.bundles -notcontains $PackageName) {
        $pkgJson.dsh.profile.bundles += $PackageName
    }
    $pkgJson | ConvertTo-Json -Depth 10 | Set-Content (Join-Path $ProfileDir 'package.json') -Encoding UTF8
    Info '安装 profile 依赖（pnpm，仅插件本身，秒级完成）…'
    Push-Location $ProfileDir
    try { pnpm install --no-frozen-lockfile } catch { npm install --no-audit --no-fund }
    Pop-Location
} else {
    Info '插件已在 profile 中注册，跳过'
}

# ---------- 5. DeepSeek key 提示 ----------
$creds = Join-Path $DshHome '.credentials.yaml'
if (-not (Test-Path $creds) -or -not (Select-String -Path $creds -Pattern 'DEEPSEEK_API_KEY' -Quiet)) {
    Warn "未检测到 DEEPSEEK_API_KEY（$creds）。"
    Warn 'AI 问答/深度总结需要它。请手动添加：'
    Warn '  DEEPSEEK_API_KEY: sk-xxxx'
}

# ---------- 6. 启动后端 ----------
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/api/health" -TimeoutSec 2
    Info "后端已在运行: http://127.0.0.1:$BackendPort"
} catch {
    Info "启动后端（后台）: http://127.0.0.1:$BackendPort"
    $logDir = Join-Path $DshHome 'meetings'
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $logFile = Join-Path $logDir 'backend.log'
    Start-Process node -ArgumentList @("$RepoDir\server\index.js") -RedirectStandardOutput $logFile -RedirectStandardError $logFile -WindowStyle Hidden
    Start-Sleep -Seconds 2
    try {
        $null = Invoke-RestMethod -Uri "http://127.0.0.1:$BackendPort/api/health" -TimeoutSec 3
        Info '后端启动成功'
    } catch {
        Warn "后端启动可能失败，查看日志: Get-Content $logFile -Tail 20"
    }
}

# ---------- 完成 ----------
Write-Host ''
Info '======================================================'
Info '安装完成！'
Info '  1. 重启 DSH Web GUI（插件注册需重启生效）'
Info '  2. 打开对话界面 → 顶部「会议驾驶舱」tab'
Info '  3. 首次使用点击「立即同步」拉取你的钉钉听记'
Info '  4. 若未同步任何内容：确认已执行 dws login 且账号有听记权限'
Info '======================================================'
Write-Host ''
Info '常用命令：'
Info "  启动后端:  node $RepoDir\server\index.js"
Info "  同步听记:  node $RepoDir\lib\cli.js pull ; node $RepoDir\lib\cli.js index"
Info "  查看日志:  Get-Content $logDir\backend.log -Tail 20"
