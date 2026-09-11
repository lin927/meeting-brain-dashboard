# 编译独立界面并重启本机会议助手（localhost:3400）。不依赖 DSH。
$ErrorActionPreference = 'Stop'
$RepoDir = Split-Path -Parent $PSScriptRoot
Write-Host '[restart] 编译独立界面…'
Set-Location $RepoDir
$oldEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& npm run build 2>&1 | Out-String | Write-Host
$buildExit = $LASTEXITCODE
$ErrorActionPreference = $oldEap
if ($buildExit -ne 0) {
    Write-Host '[restart] 构建失败' -ForegroundColor Red
    exit 1
}
$start = Join-Path $RepoDir 'scripts\start.ps1'
& powershell -NoProfile -ExecutionPolicy Bypass -File $start -Restart -NoOpen
if ($LASTEXITCODE -ne 0) {
    Write-Host '[restart] 启动失败' -ForegroundColor Red
    exit 1
}
Write-Host '[restart] 会议助手已就绪 http://127.0.0.1:3400  ·  请刷新浏览器'
