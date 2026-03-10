@echo off
REM Cross-platform development server launcher
REM Windows equivalent of scripts/run_dev.sh

cd /d "%~dp0\.."

echo Starting development servers...
start "Unity Generator - Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 35421"
start "Unity Generator - Frontend" cmd /k "cd frontend && pnpm dev"

echo.
echo Development servers started in separate windows.
echo Backend: http://localhost:35421
echo Frontend: http://localhost:5173
