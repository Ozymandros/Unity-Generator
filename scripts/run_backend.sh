#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
python -m uvicorn app.main:app --reload --port 35421
