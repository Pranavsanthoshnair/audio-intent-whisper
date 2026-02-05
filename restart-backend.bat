@echo off
echo ========================================
echo Restarting Backend with CSP Fix...
echo ========================================

REM Kill all node processes
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd backend
node server.js
