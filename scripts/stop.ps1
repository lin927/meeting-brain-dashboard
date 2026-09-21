# 停止本机会议助手（localhost:3400）。请双击 stop.bat，不要直接双击本文件。
param([switch]$NoPause)

$ErrorActionPreference = 'SilentlyContinue'
if ($PSVersionTable.PSVersion.Major -lt 6) {
    try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new() } catch {}
}

function Pause-IfNeeded {
    if ($NoPause) { return }
    Write-Host ''
    try { Read-Host '按回车关闭本窗口' | Out-Null } catch { cmd /c pause }
}

try {
    $DataDir = if ($env:DSH_HOME) { Join-Path $env:DSH_HOME 'meetings' } else { Join-Path $HOME '.dsh\meetings' }
    $Port = if ($env:PORT) { [int]$env:PORT } else { 3400 }
    $PidFile = Join-Path $DataDir 'backend.pid'

    if (Test-Path $PidFile) {
        $procId = (Get-Content $PidFile | Select-Object -First 1)
        if ($procId) { Stop-Process -Id ([int]$procId) -Force }
        Remove-Item $PidFile -Force
    }

    Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
        Where-Object { $_.CommandLine -and $_.CommandLine -match 'server\\index\.js|server/index\.js' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

    try {
        Get-NetTCPConnection -LocalPort $Port -State Listen |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
    } catch {}

    Write-Host '[会议助手] 已停止'
    Pause-IfNeeded
    exit 0
} catch {
    Write-Host "[会议助手] 停止时出错：$($_.Exception.Message)" -ForegroundColor Red
    Pause-IfNeeded
    exit 1
}
