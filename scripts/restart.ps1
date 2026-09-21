# 重启本机会议助手（localhost:3400）。请双击 restart.bat，不要直接双击本文件。
param([switch]$NoPause)

$ErrorActionPreference = 'Stop'

function Pause-IfNeeded {
    if ($NoPause) { return }
    Write-Host ''
    try { Read-Host '按回车关闭本窗口' | Out-Null } catch { cmd /c pause }
}

try {
    if (-not $PSScriptRoot) {
        throw '请双击 scripts\restart.bat 运行'
    }
    $RepoDir = Split-Path -Parent $PSScriptRoot
    $npm = Join-Path $env:APPDATA 'npm'
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "C:\Program Files\nodejs;$npm;$machine;$user"

    Set-Location $RepoDir
    $appJs = Join-Path $RepoDir 'public\app.js'
    if (-not (Test-Path $appJs)) {
        Write-Host '[restart] 缺少界面文件，正在构建…'
        $oldEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if ($npmCmd) { & npm.cmd run build } else { & npm run build }
        $buildExit = $LASTEXITCODE
        $ErrorActionPreference = $oldEap
        if ($buildExit -ne 0) { throw '构建失败' }
    }

    Write-Host '[restart] 正在重启本机服务…'
    $start = Join-Path $PSScriptRoot 'start.ps1'
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $start -Restart -NoOpen
    $startExit = $LASTEXITCODE
    $ErrorActionPreference = $oldEap
    if ($startExit -ne 0) { throw '启动失败' }

    Write-Host '[restart] 会议助手已就绪 http://127.0.0.1:3400  ·  请刷新浏览器'
    Pause-IfNeeded
    exit 0
} catch {
    Write-Host "[restart] $($_.Exception.Message)" -ForegroundColor Red
    Pause-IfNeeded
    exit 1
}
