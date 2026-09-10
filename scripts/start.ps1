# 启动本机会议助手（http://127.0.0.1:3400）。已在运行则只打开浏览器。
# 用法：
#   powershell -ExecutionPolicy Bypass -File scripts\start.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -NoOpen
#   powershell -ExecutionPolicy Bypass -File scripts\start.ps1 -Restart -NoOpen
param(
    [switch]$NoOpen,
    [switch]$Restart
)

$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSVersion.Major -lt 6) {
    try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new() } catch {}
}

function Info($m) { Write-Host "[会议助手] $m" }
function Die($m) { Write-Host "[会议助手] $m" -ForegroundColor Red; exit 1 }

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "C:\Program Files\nodejs;$machine;$user"
}

function Test-Health([int]$Port) {
    try {
        $old = $ProgressPreference
        $ProgressPreference = 'SilentlyContinue'
        $null = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 2
        $ProgressPreference = $old
        return $true
    } catch {
        return $false
    }
}

function Stop-Port([int]$Port, [string]$PidFile) {
    if (Test-Path $PidFile) {
        $procId = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
        if ($procId) {
            Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -match 'server\\index\.js|server/index\.js' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    try {
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    } catch {}
}

$RepoDir = Split-Path -Parent $PSScriptRoot
$DataDir = if ($env:DSH_HOME) { Join-Path $env:DSH_HOME 'meetings' } else { Join-Path $HOME '.dsh\meetings' }
$Port = if ($env:PORT) { [int]$env:PORT } else { 3400 }
$Url = "http://127.0.0.1:$Port"
$PidFile = Join-Path $DataDir 'backend.pid'
$LogOut = Join-Path $DataDir 'backend.out.log'
$LogErr = Join-Path $DataDir 'backend.err.log'

Refresh-Path

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Die '未找到 Node.js。请先运行 scripts\install.ps1'
}

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

if ($Restart) { Stop-Port $Port $PidFile }

if (-not (Test-Health $Port)) {
    Stop-Port $Port $PidFile
    $appJs = Join-Path $RepoDir 'public\app.js'
    if (-not (Test-Path $appJs)) {
        Info '正在构建界面…'
        Push-Location $RepoDir
        $oldEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try { npm run build 2>&1 | Out-String | Write-Host } finally { $ErrorActionPreference = $oldEap }
        if ($LASTEXITCODE -ne 0) { Die '构建失败' }
        Pop-Location
    }
    Info "正在启动本机服务 $Url"
    $node = (Get-Command node).Source
    $server = Join-Path $RepoDir 'server\index.js'
    $proc = Start-Process -FilePath $node -ArgumentList @($server) -WorkingDirectory $RepoDir `
        -RedirectStandardOutput $LogOut -RedirectStandardError $LogErr `
        -WindowStyle Hidden -PassThru
    Set-Content -Path $PidFile -Value $proc.Id -Encoding ASCII
    $ok = $false
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Milliseconds 250
        if (Test-Health $Port) { $ok = $true; break }
    }
    if (-not $ok) { Die "启动失败，请查看日志：$LogErr" }
    Info '服务已就绪'
} else {
    Info "服务已在运行 $Url"
}

if (-not $NoOpen) {
    Info '打开浏览器…'
    Start-Process $Url
    Info '已打开。关掉本窗口不影响使用；停止服务请运行 scripts\stop.ps1'
}
