@echo off
echo ========================================
echo Stopping all Node.js processes...
echo ========================================

REM Kill all node processes
taskkill /F /IM node.exe 2>nul

if %errorlevel% equ 0 (
    echo ✓ All Node.js processes stopped
) else (
    echo ℹ No Node.js processes were running
)

echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
echo.

cd backend
node server.js
