# Start local meeting assistant (http://127.0.0.1:3400).
param(
    [switch]$NoOpen,
    [switch]$Restart
)

$ErrorActionPreference = 'Stop'

function Info($m) {
    Write-Host "[会议助手] $m"
}

function Die($m) {
    Write-Host "[会议助手] $m" -ForegroundColor Red
    cmd /c pause
    exit 1
}

function Refresh-Path {
    $npm = Join-Path $env:APPDATA 'npm'
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "C:\Program Files\nodejs;$npm;$machine;$user"
}

function Test-Health([int]$Port) {
    $client = $null
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $ar = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        $ok = $ar.AsyncWaitHandle.WaitOne(400, $false)
        if ($ok) { $client.EndConnect($ar) }
        if ($client) { $client.Close() }
        if ($ok) { return $true }
        return $false
    } catch {
        if ($client) { $client.Close() }
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
        Where-Object { $_.CommandLine -and ($_.CommandLine -like '*server\index.js*' -or $_.CommandLine -like '*server/index.js*') } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
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

$repoHead = ''
$relFile = Join-Path $RepoDir 'release.json'
if (Test-Path (Join-Path $RepoDir '.git')) {
    try {
        $repoHead = (& git -C $RepoDir rev-parse HEAD 2>$null | Out-String).Trim()
    } catch { $repoHead = '' }
} elseif (Test-Path $relFile) {
    try {
        $rel = Get-Content $relFile -Raw | ConvertFrom-Json
        $bits = @()
        if ($rel.git) { $bits += $rel.git }
        if ($rel.version) { $bits += $rel.version }
        $repoHead = ($bits -join '@')
    } catch { $repoHead = '' }
}
$runningRev = ''
$revFile = Join-Path $DataDir 'server-rev'
if (Test-Path $revFile) {
    $runningRev = (Get-Content $revFile -Raw -ErrorAction SilentlyContinue).Trim()
}
if (-not $Restart -and (Test-Health $Port) -and $repoHead -and ($repoHead -ne $runningRev)) {
    Info '代码已更新，正在重启本机服务…'
    $Restart = $true
}

if ($Restart) { Stop-Port $Port $PidFile }

if (-not (Test-Health $Port)) {
    Stop-Port $Port $PidFile
    $appJs = Join-Path $RepoDir 'public\app.js'
    if (-not (Test-Path $appJs)) {
        Info '正在构建界面…'
        Push-Location $RepoDir
        $oldEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if ($npmCmd) {
            & npm.cmd run build
        } else {
            & npm run build
        }
        $buildExit = $LASTEXITCODE
        $ErrorActionPreference = $oldEap
        if ($buildExit -ne 0) { Die '构建失败' }
        Pop-Location
    }
    Info "正在启动本机服务 $Url"
    $node = (Get-Command node).Source
    $server = Join-Path $RepoDir 'server\index.js'
    $proc = Start-Process -FilePath $node -ArgumentList @($server) -WorkingDirectory $RepoDir -RedirectStandardOutput $LogOut -RedirectStandardError $LogErr -WindowStyle Hidden -PassThru
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
    Info '已打开。关掉本窗口不影响使用；停止服务请双击 scripts\stop.bat'
}
