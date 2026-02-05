@echo off
echo ========================================
echo Testing Backend and Frontend
echo ========================================
echo.

echo [1/3] Testing Backend Health...
curl -s http://localhost:3001/health
echo.
echo.

echo [2/3] Testing Backend Ping...
curl -s http://localhost:3001/api/ping
echo.
echo.

echo [3/3] Testing Frontend...
curl -s http://localhost:8080 | findstr "Offline Audio"
echo.
echo.

echo ========================================
echo Test Complete!
echo ========================================
echo.
echo If you see JSON responses above, both servers are running!
echo Open http://localhost:8080 in your browser to use the app.
echo.
pause
