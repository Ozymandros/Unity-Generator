#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"
python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
pip install pyinstaller

pyinstaller --clean --onefile --name unity-generator-backend app/entrypoint.py
