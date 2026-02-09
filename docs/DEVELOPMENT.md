# Development Workflow

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

## Frontend (Vue + Tauri)

```bash
cd frontend
pnpm install
pnpm run dev
```

## Combined Dev Runner

```bash
./scripts/run_dev.sh
```

Windows:

```powershell
.\scripts\run_dev.ps1
```

If you build the backend sidecar (`scripts/build_backend.*`), `pnpm run tauri dev`
will auto-start the backend binary.

## Smoke Test (Windows)

```powershell
.\scripts\smoke_test.ps1
```

## Frontend Tests

```bash
cd frontend
pnpm test
```

## Component Unit Tests

Unit tests use Vitest + @vue/test-utils. Test files are co-located with components:

- `src/components/StatusBanner.test.ts`
- `src/components/CodePanel.test.ts`
- `src/components/TextPanel.test.ts`
- `src/components/ImagePanel.test.ts`
- `src/components/AudioPanel.test.ts`
- `src/components/SettingsPanel.test.ts`
- `src/components/UnityProjectPanel.test.ts`
- `src/App.test.ts`

## UI Tests (Playwright)

```bash
cd frontend
pnpm run test:e2e
```

The tests mock backend endpoints using Playwright route interception.

## Backend Tests

```bash
cd backend
python -m pytest -v
```

### Backend Test Files

Unit tests cover all modules and endpoints:

- `tests/test_health.py` - Health check endpoint
- `tests/test_config_keys.py` - API key configuration
- `tests/test_prefs.py` - User preferences
- `tests/test_output_latest.py` - Output path retrieval
- `tests/test_unity_project.py` - Unity project generation endpoint
- `tests/test_generate_code.py` - Code generation endpoint
- `tests/test_generate_text.py` - Text generation endpoint
- `tests/test_generate_image.py` - Image generation endpoint
- `tests/test_generate_audio.py` - Audio generation endpoint
- `tests/test_config.py` - Config module utilities
- `tests/test_db.py` - SQLite preferences database
- `tests/test_agent_manager.py` - Agent manager initialization
- `tests/test_schemas.py` - Pydantic schemas and response helpers
- `tests/test_unity_project_utils.py` - Unity project file utilities

## Unity Project Output

The backend can generate a Unity project folder in `output/` from prompts. Use
the "Unity Project" panel in the UI, or call:

```bash
curl -X POST http://127.0.0.1:8000/generate/unity-project \
  -H "Content-Type: application/json" \
  -d '{"project_name":"MyUnityProject","code_prompt":"Create a player controller","image_prompt":"Fantasy landscape","provider_overrides":{"code":"openai"},"options":{"code":{"model":"gpt-4o-mini"}}}'
```

The output includes minimal Unity `ProjectSettings` and `.meta` files so the
folder can be opened directly in the Unity editor.
