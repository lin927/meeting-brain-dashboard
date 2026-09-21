# 打一份给同事用的运行包 dist\meeting-brain.zip。不含 git / src / node_modules。
$ErrorActionPreference = 'Stop'
$RepoDir = Split-Path -Parent $PSScriptRoot
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
if (-not $py) {
    Write-Host '需要 Python 才能打包。也可在 Mac 上执行 bash scripts/pack.sh' -ForegroundColor Red
    cmd /c pause
    exit 1
}
& $py.Source (Join-Path $RepoDir 'scripts\pack.py')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
