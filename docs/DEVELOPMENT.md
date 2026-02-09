# Development Workflow

This guide covers local development for both the FastAPI backend and the
Tauri + Vue frontend.

## Prerequisites

- Python 3.11+
- Node.js 20+
- pnpm
- Rust toolchain (for Tauri builds)
- Docker (optional, for dev/CI workflows)

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend serves on `http://127.0.0.1:8000` with CORS enabled.

## Frontend setup

```bash
cd frontend
pnpm install
pnpm run dev
```

The UI dev server runs on `http://localhost:5173`.

## Combined dev runner

```bash
./scripts/run_dev.sh
```

Windows:

```powershell
.\scripts\run_dev.ps1
```

If you build the backend sidecar (`scripts/build_backend.*`), `pnpm run tauri dev`
will auto-start the backend binary.

## Configuration

API keys are stored in `config/api_keys.json`. You can edit manually or use the
Settings panel in the UI. Example structure:

```json
{
  "openai_api_key": "",
  "deepseek_api_key": "",
  "openrouter_api_key": "",
  "groq_api_key": "",
  "stability_api_key": "",
  "flux_api_key": "",
  "elevenlabs_api_key": "",
  "playht_api_key": ""
}
```

Provider preferences are stored in `db/user_prefs.db` with keys:

- `preferred_llm_provider`
- `preferred_image_provider`
- `preferred_audio_provider`

## Backend endpoints (dev sanity)

```bash
curl http://127.0.0.1:8000/health
```

## Tests

Backend:

```bash
cd backend
python -m pytest -v
```

Frontend unit tests:

```bash
cd frontend
pnpm test
```

Playwright UI tests:

```bash
cd frontend
pnpm run test:e2e
```

Component tests are co-located with Vue components:

- `src/components/StatusBanner.test.ts`
- `src/components/CodePanel.test.ts`
- `src/components/TextPanel.test.ts`
- `src/components/ImagePanel.test.ts`
- `src/components/AudioPanel.test.ts`
- `src/components/SettingsPanel.test.ts`
- `src/components/UnityProjectPanel.test.ts`
- `src/App.test.ts`

## Linting and type checks

```bash
cd frontend
pnpm run lint:check
pnpm run typecheck
```

## Smoke test (Windows)

```powershell
.\scripts\smoke_test.ps1
```

## Common issues

- Backend not reachable: confirm port 8000 is free and the backend is running.
- Provider failures: verify `config/api_keys.json` and check `logs/`.
- Unity output missing: confirm `output/` exists and requests include prompts.
- Frontend build issues: delete `node_modules/` and reinstall with pnpm.
