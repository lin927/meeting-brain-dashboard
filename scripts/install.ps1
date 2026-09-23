# =============================================================================
# 会议助手 · 本机一键安装（Windows）
#
# 1. 检查/安装 Node.js 与钉钉 DWS CLI（飞书/腾讯 CLI 可选，不自动装）
# 2. 安装依赖（界面产物 public/app.js 已在仓库里，缺文件时才现场编译）
# 3. 把「会议助手」放到桌面，启动 localhost:3400 并打开浏览器
#
# 不依赖 DSH。PowerShell：
#   powershell -ExecutionPolicy Bypass -File scripts\install.ps1
# =============================================================================
$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSVersion.Major -lt 6) {
    try {
        [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
    } catch {
        # ignore
    }
}

function Info($m) { Write-Host "[会议助手] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "[会议助手] $m" -ForegroundColor Yellow }
function Die($m) {
    Write-Host "[会议助手] $m" -ForegroundColor Red
    Wait-Enter
    exit 1
}

function Wait-Enter([string]$Msg = '按回车关闭本窗口') {
    try {
        Read-Host $Msg | Out-Null
    } catch {
        # ignore
    }
}

# npm / dws 常把提示写到 stderr；PowerShell 5.1 在 Stop 下会当成错误直接退出（窗口像闪退）。
function Invoke-NativeText {
    param([scriptblock]$Block)
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $out = & $Block 2>&1 | Out-String
    $ErrorActionPreference = $oldEap
    return $out
}

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "C:\Program Files\nodejs;$machine;$user"
}

# npm 会把警告写 stderr；PowerShell 5.1 在 Stop 下会当成错误。临时降级。
function Invoke-Npm {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$NpmArgs)
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & npm @NpmArgs 2>&1 | Out-String | Write-Host
    $code = $LASTEXITCODE
    $ErrorActionPreference = $oldEap
    return $code
}

function Test-NodeOk {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $false }
    $nodeVer = (node -v).Trim()
    if ($nodeVer -notmatch '^v?(\d+)\.(\d+)') { return $false }
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    return ($major -gt 22) -or ($major -eq 22 -and $minor -ge 5)
}

$RepoDir = Split-Path -Parent $PSScriptRoot
$DataDir = if ($env:DSH_HOME) { Join-Path $env:DSH_HOME 'meetings' } else { Join-Path $HOME '.dsh\meetings' }

Info "仓库目录: $RepoDir"
Refresh-Path

# ---------- 1. Node.js ----------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Warn '未检测到 Node.js，尝试用 winget 安装 LTS…'
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        $oldEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements --disable-interactivity
        $ErrorActionPreference = $oldEap
        Refresh-Path
    }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Die '需要 Node.js ≥ 22.5。请打开 https://nodejs.org 安装 LTS，然后重新运行本脚本。'
}
if (-not (Test-NodeOk)) {
    Die "Node.js 版本过低（$(node -v)），需要 ≥ 22.5。请升级后重试。"
}
Info "Node.js $(node -v) OK"

# ---------- 2. 钉钉 DWS CLI ----------
if (-not (Get-Command dws -ErrorAction SilentlyContinue)) {
    Warn '未检测到钉钉 DWS CLI，尝试通过 npm 全局安装…'
    $null = Invoke-Npm install -g dingtalk-workspace-cli
    Refresh-Path
}
if (Get-Command dws -ErrorAction SilentlyContinue) {
    $dwsVer = (Invoke-NativeText { & dws --version }).Trim()
    Info ("DWS " + $(if ($dwsVer) { $dwsVer } else { '已安装' }) + " OK")
    $checkOut = Invoke-NativeText { & dws upgrade --check }
    if ($checkOut -match '新版本可用') {
        Write-Host ''
        Warn '检测到 DWS 有新版本可用：'
        $checkOut -split "`n" | Select-Object -First 12 | ForEach-Object { Warn $_ }
        Write-Host ''
        $upgradeAns = Read-Host '[会议助手] 是否现在升级 DWS 到最新版本？(y/N)'
        if ($upgradeAns -eq 'y' -or $upgradeAns -eq 'Y') {
            Info '正在升级 DWS…'
            Invoke-NativeText { & dws upgrade } | Write-Host
            if ($LASTEXITCODE -ne 0) { Warn 'dws upgrade 未完成，可稍后手动执行: dws upgrade' }
        } else {
            Info "跳过升级（当前 $dwsVer）。若后续同步报命令错误，请先 dws upgrade。"
        }
    }
    $authJson = Invoke-NativeText { & dws auth status }
    if ($authJson -notmatch '"authenticated": true') {
        Warn '检测到 DWS 未登录或登录已过期，自动打开登录（浏览器弹出钉钉授权，请扫码/确认）…'
        Invoke-NativeText { & dws auth login } | Write-Host
        if ($LASTEXITCODE -ne 0) {
            Warn 'dws auth login 未完成，可稍后手动执行: dws auth login'
        }
    } else {
        Info 'DWS 已登录 OK'
    }
} else {
    Warn 'npm 安装 dws 失败（可能网络或权限问题）。请手动安装：'
    Warn '  npm install -g dingtalk-workspace-cli'
    Warn '  参考：https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli'
    Warn '安装完成后重新运行本脚本，并执行: dws auth login'
}

function Ask-Yes([string]$Prompt) {
    $ans = Read-Host "[会议助手] $Prompt (y/N)"
    return ($ans -eq 'y' -or $ans -eq 'Y')
}

function Test-FeishuConfigured {
    $out = Invoke-NativeText { & lark-cli config show }
    if ($out -match 'not_configured') { return $false }
    if ($out -match '"ok"\s*:\s*true') { return $true }
    if ($out -match '"app[_-]?id"') { return $true }
    return $false
}

function Test-FeishuLoggedIn {
    $out = Invoke-NativeText { & lark-cli auth status --json }
    try {
        $j = $out | ConvertFrom-Json
        $u = $j.identities.user
        return [bool]($u -and $u.userName -and ($u.tokenStatus -eq 'valid' -or $u.status -eq 'ready'))
    } catch {
        return $false
    }
}

function Complete-FeishuUserLogin {
    Write-Host ''
    Info '第 2 步 / 共 2 步：授权读取妙记。'
    Warn '会再打开一个浏览器页，和刚才「创建应用成功」不是同一页。请在新页面点允许。'
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $raw = Invoke-NativeText { & lark-cli auth login --domain minutes --no-wait --json }
    Write-Host $raw
    $url = $null
    $code = $null
    try {
        $j = $raw | ConvertFrom-Json
        if ($j.data) { $j = $j.data }
        $url = $j.verification_uri_complete; if (-not $url) { $url = $j.verification_url }
        if (-not $url) { $url = $j.verification_uri }; if (-not $url) { $url = $j.url }
        $code = $j.device_code; if (-not $code) { $code = $j.deviceCode }
    } catch { }
    if (-not $url -and $raw -match 'https://accounts\.feishu\.cn[^\s"]+') { $url = $Matches[0] }
    if ($url) {
        Warn "请完成这个授权页：$url"
        Start-Process $url
    }
    if ($code) {
        & lark-cli auth login --device-code $code
    } else {
        & lark-cli auth login --domain minutes
    }
    $ErrorActionPreference = $oldEap
    if (Test-FeishuLoggedIn) { return 0 }
    return $LASTEXITCODE
}

function Complete-FeishuSetup {
    if (-not (Test-FeishuConfigured)) {
        Write-Host ''
        Info '第 1 步 / 共 2 步：创建并绑定飞书应用。'
        Warn '请在打开的页面里点允许。完成后本窗口会继续第 2 步（授权妙记）。'
        $oldEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & lark-cli config init --new --brand feishu --lang zh
        $initSt = $LASTEXITCODE
        $ErrorActionPreference = $oldEap
        if ($initSt -ne 0) {
            Warn '创建应用未完成。可稍后重跑本脚本，或在终端执行：'
            Warn '  lark-cli config init --new --brand feishu --lang zh'
            Warn '  lark-cli auth login --domain minutes'
            return
        }
        Info '应用已绑定。下面还要再授权一次妙记，不是重复。'
    }
    if (Test-FeishuLoggedIn) {
        Info '飞书已登录'
        return
    }
    Complete-FeishuUserLogin | Out-Null
    if (Test-FeishuLoggedIn) {
        Info '飞书已就绪（未勾选的额外权限不影响拉妙记）'
    } else {
        Warn '飞书登录未完成。可稍后在设置 → 听记点「登录」，或执行: lark-cli auth login --domain minutes'
    }
}

# ---------- 2b. 飞书 / 腾讯会议 CLI（可选，同事按需） ----------
if (-not (Get-Command lark-cli -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Warn '飞书妙记需要 lark-cli。未装不影响钉钉。'
    if (Ask-Yes '是否安装飞书并完成登录？') {
        Info '正在安装 @larksuite/cli…'
        if ((Invoke-Npm install -g @larksuite/cli) -eq 0) {
            Refresh-Path
        } else {
            Warn '安装失败。可稍后手动执行: npm install -g @larksuite/cli'
        }
    }
}
if (Get-Command lark-cli -ErrorAction SilentlyContinue) {
    Info '飞书 lark-cli 已安装'
    if (Test-FeishuLoggedIn) {
        Info '飞书已登录'
    } else {
        Complete-FeishuSetup
    }
} else {
    Warn '未装飞书 CLI。要用妙记时重跑本脚本并选择安装，或执行: npm install -g @larksuite/cli'
}

if (-not (Get-Command tmeet -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Warn '腾讯会议纪要需要 tmeet。未装不影响钉钉。'
    if (Ask-Yes '是否现在安装腾讯会议 CLI？') {
        Info '正在安装 @tencentcloud/tmeet…'
        if ((Invoke-Npm install -g @tencentcloud/tmeet) -eq 0) {
            Refresh-Path
        } else {
            Warn '安装失败。可稍后手动执行: npm install -g @tencentcloud/tmeet'
        }
    }
}
if (Get-Command tmeet -ErrorAction SilentlyContinue) {
    Info '腾讯会议 tmeet 已安装'
    $tmStatus = Invoke-NativeText { & tmeet auth status }
    $tmOk = $false
    if ($tmStatus -match 'not logged in' -or $tmStatus -match '未登录') {
        $tmOk = $false
    } elseif ($tmStatus -match 'logged|已登录|openid|user_name|userName') {
        $tmOk = $true
    }
    if ($tmOk) {
        Info '腾讯会议已登录'
    } elseif (Ask-Yes '腾讯会议未登录，现在扫码登录？') {
        $oldEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & tmeet auth login
        $ErrorActionPreference = $oldEap
        $tmAfter = Invoke-NativeText { & tmeet auth status }
        if ($tmAfter -match 'logged|已登录|openid|user_name|userName') {
            Info '腾讯会议已登录'
        } else {
            Warn '腾讯登录未完成，可稍后在设置 → 听记点「登录」'
        }
    } else {
        Info '跳过腾讯登录。需要时到设置 → 听记点「登录」。'
    }
} else {
    Warn '未装腾讯会议 CLI。要用纪要时执行: npm install -g @tencentcloud/tmeet'
}

# ---------- 3. 安装依赖（界面已提交 public/app.js，缺文件时才编译） ----------
Info '安装依赖…'
Set-Location $RepoDir
if ((Invoke-Npm install --no-audit --no-fund) -ne 0) {
    Die 'npm install 失败，请检查网络后重试。'
}
$appJs = Join-Path $RepoDir 'public\app.js'
if (-not (Test-Path $appJs)) {
    Info '构建界面…'
    if ((Invoke-Npm run build) -ne 0) {
        Die 'npm run build 失败。'
    }
}

# ---------- 4. 桌面快捷方式 ----------
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$Desktop = [Environment]::GetFolderPath('Desktop')
$Wsh = New-Object -ComObject WScript.Shell
$ShortcutPath = Join-Path $Desktop '会议助手.lnk'
$Sc = $Wsh.CreateShortcut($ShortcutPath)
$Sc.TargetPath = Join-Path $RepoDir 'scripts\start.bat'
$Sc.Arguments = ''
$Sc.WorkingDirectory = $RepoDir
$Sc.WindowStyle = 7
$Sc.Description = '打开本机会议助手'
$Sc.Save()
Info '已放到桌面：会议助手（以后双击即可）'

# ---------- 5. 启动并打开浏览器 ----------
$startBat = Join-Path $RepoDir 'scripts\start.bat'
$oldEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
cmd.exe /c "`"$startBat`""
$startExit = $LASTEXITCODE
$ErrorActionPreference = $oldEap
if ($startExit -ne 0) {
    Die '启动失败。可再执行: scripts\start.bat'
}

Write-Host ''
Info '======================================================'
Info '安装完成。浏览器应已打开 http://127.0.0.1:3400'
Info '  · 以后使用：双击桌面上的「会议助手」'
Info '  · 设置页填写大模型 API Key（问答/总结用）'
Info '  · 点「更新」拉取已登录来源的听记（钉钉 / 飞书 / 腾讯）'
Info '  · 停止服务：双击 scripts\stop.bat'
Info '  · 不要用 node server/index.js 当日常启动（请用桌面快捷方式或 start.ps1）'
Info '======================================================'
Wait-Enter
