# Unity Generator

Lightweight desktop app for generating Unity C# code, text, images, and audio
using cloud AI providers. Built with Tauri + Vue for the UI and a Python
FastAPI backend orchestrated by Semantic Kernel. All API keys are provided by
the user and stored locally.

## Workspace Structure

- `frontend/` - Tauri + Vue UI
- `backend/` - FastAPI + Semantic Kernel backend
- `config/` - Local API key storage
- `agents/` - Modular Semantic Kernel agents
- `services/` - Provider wrappers (LLM, image, audio)
- `db/` - SQLite storage for user preferences

## Status

Scaffolded and functional. See docs for development and packaging details.

## Quick Start

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
pnpm install
pnpm run dev
```

## Tests

```bash
cd backend
pytest
```

```bash
cd frontend
pnpm test
```

```bash
cd frontend
pnpm run test:e2e
```

## Packaging

See `docs/PACKAGING.md` for bundling the backend sidecar and building the
Tauri app.

## Docker

`docker-compose.yml` provides a dev/CI runner. See `docs/PACKAGING.md`.
