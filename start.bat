@echo off
chcp 65001 >nul
title Curalink — AI Medical Research Assistant

echo.
echo  ══════════════════════════════════════════════════════════
echo   ⚕️  CURALINK — AI Medical Research Assistant
echo   Powered by PubMed · OpenAlex · ClinicalTrials · Ollama
echo  ══════════════════════════════════════════════════════════
echo.

:: ── Check Node.js ──────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js not found. Please install from https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% detected

:: ── Backend: install deps if needed ────────────────────────────
if not exist "backend\node_modules" (
  echo  [SETUP] Installing backend dependencies...
  cd backend && npm install --silent && cd ..
  if %errorlevel% neq 0 (
    echo  [ERROR] Backend npm install failed!
    pause & exit /b 1
  )
  echo  [OK] Backend dependencies installed
)

:: ── Frontend: install deps if needed ───────────────────────────
if not exist "frontend\node_modules" (
  echo  [SETUP] Installing frontend dependencies...
  cd frontend && npm install --silent && cd ..
  if %errorlevel% neq 0 (
    echo  [ERROR] Frontend npm install failed!
    pause & exit /b 1
  )
  echo  [OK] Frontend dependencies installed
)

echo.
echo  [INFO] Starting Curalink services...
echo  ────────────────────────────────────────────────────────────
echo   Backend  →  http://localhost:5000
echo   Frontend →  http://localhost:5173
echo  ────────────────────────────────────────────────────────────
echo.

:: ── Start Backend ──────────────────────────────────────────────
echo  [1/2] Launching backend server (port 5000)...
start "Curalink Backend" cmd /k "cd /d %~dp0backend && node server.js"

:: Give backend a moment to start
timeout /t 2 /nobreak >nul

:: ── Start Frontend ─────────────────────────────────────────────
echo  [2/2] Launching frontend dev server (port 5173)...
start "Curalink Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait for frontend to start then open browser
timeout /t 4 /nobreak >nul
echo.
echo  [OK] Opening Curalink in your browser...
start http://localhost:5173

echo.
echo  ══════════════════════════════════════════════════════════
echo   ✅  Curalink is running!
echo   Close the terminal windows to stop the servers.
echo  ══════════════════════════════════════════════════════════
echo.
pause
