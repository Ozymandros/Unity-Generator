Set-Location "$PSScriptRoot\..\backend"

python -m venv .venv
. .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
pip install pyinstaller

pyinstaller --clean --onefile --name unity-generator-backend app/entrypoint.py
