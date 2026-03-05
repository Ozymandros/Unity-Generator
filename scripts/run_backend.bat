@echo off
REM Backend development server launcher
REM Windows equivalent of scripts/run_backend.sh

setlocal

cd /d "%~dp0\..\backend"

if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt
pip install -e ".[dev]"

echo.
echo Starting backend development server on port 8000...
python -m uvicorn app.main:app --reload --port 8000

endlocal
