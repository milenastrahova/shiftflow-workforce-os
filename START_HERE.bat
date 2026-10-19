@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js 22.12+ is required. Install it from https://nodejs.org/
  pause
  exit /b 1
)
echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 goto :fail
echo [2/3] Running unit tests...
call npm test
if errorlevel 1 goto :fail
echo [3/3] Starting ShiftFlow at http://localhost:5173
call npm run dev
exit /b %errorlevel%
:fail
echo Something went wrong. Read START_HERE_RU.md for help.
pause
exit /b 1
