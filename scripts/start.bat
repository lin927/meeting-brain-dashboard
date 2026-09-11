@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
if not errorlevel 1 exit /b 0

echo [会议助手] start.ps1 失败，改用 node 直接启动…
if not exist "public\app.js" call npm.cmd run build
start "meeting-brain" /MIN node server\index.js
timeout /t 3 /nobreak >nul
start http://127.0.0.1:3400
exit /b 0
