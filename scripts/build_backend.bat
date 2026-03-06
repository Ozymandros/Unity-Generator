@echo off
REM Backend PyInstaller build script
REM Windows equivalent of scripts/build_backend.sh

setlocal

cd /d "%~dp0\..\backend"

echo Setting up Python environment...
if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

echo.
echo Building backend sidecar with PyInstaller...
pyinstaller --clean --onefile --name unity-generator-backend app/entrypoint.py

echo.
if exist "dist\unity-generator-backend.exe" (
    echo Build completed successfully!
    echo Sidecar binary: dist\unity-generator-backend.exe
) else (
    echo ERROR: Build failed - expected binary not found
    exit /b 1
)

endlocal
