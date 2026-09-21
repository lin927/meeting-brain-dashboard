@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
echo [会议助手] 正在重启…
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart.ps1" -NoPause
echo.
pause
