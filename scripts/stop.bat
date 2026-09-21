@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
echo [会议助手] 正在停止…
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" -NoPause
echo.
pause
