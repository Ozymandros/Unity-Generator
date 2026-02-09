#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Starting backend..."
./scripts/run_backend.sh &

echo "Starting frontend (Tauri dev)..."
cd frontend
npm install
npm run dev:tauri
