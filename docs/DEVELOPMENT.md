# Development Workflow

This guide covers local development for both the FastAPI backend and the
Tauri + Vue frontend.

## Prerequisites

- Python 3.11+
- Node.js 20+
- pnpm
- Rust toolchain (for Tauri builds)
- Docker (optional, for dev/CI workflows)
- **VS Code** (recommended IDE) with **Volar** extension

## Integrated Development Environment

The project is optimized for VS Code with integrated configurations to manage the backend, frontend, and Docker environments.

### VS Code Workflows

#### Native Development (Recommended)

To iterate on the Vue 3 frontend and FastAPI backend simultaneously, use the **Dev: Backend + Frontend** compound launch configuration.

1. Open the Debug panel (`Ctrl+Shift+D`).
2. Select `Dev: Backend + Frontend` from the dropdown.
3. Press `F5` to start both services with live reload and breakpoints enabled.

#### Docker Debugging

If you prefer to work within a containerized environment:

- Use the **Attach Backend (Docker debugpy)** workflow.
- This configuration automatically triggers `docker-compose up` via integrated tasks, allowing you to attach the debugger to the Python process running inside Docker.

### Task Automation (`tasks.json`)

Several convenience tasks are available via `Ctrl+Shift+P` -> `Tasks: Run Task`:

- `backend: dev`: Starts only the FastAPI server.
- `frontend: dev`: Starts only the Vite/Vue dev server.
- `dev: all`: Runs both in parallel (used by the smoke test logic).

### Editor Setup (`settings.json`)

- **Vue 3 Support**: The project is optimized for **Volar**. Default formatters and type checking are configured to prioritize Vue 3 + TypeScript.
- **TypeScript Mapping**: The TypeScript SDK is specifically mapped to `frontend/node_modules` to ensure consistent type checking across the internal monorepo structure.

### Architecture Note: Sidecar vs. Docker

It is critical to distinguish between the development environment and the final product:

- **Docker**: Used primarily for testing, CI, and isolated debugging sessions.
- **Tauri Sidecar**: The final distributed application uses the **Tauri Sidecar pattern**. The Python backend is compiled into a standalone binary via `scripts/build_backend.ps1` and bundled into the native installer. **The production app does NOT require Docker.**

## Project Standards

All code modifications must adhere to the following principles defined in our core guidelines:

- **SRP (Single Responsibility Principle)**: Each module or class should have one reason to change.
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering; favor readable code over clever solutions.
- **Clean Architecture**: Maintain clear boundaries between services, agents, and the API layer.

## AI Agent Skills (Semantic Kernel)

The following Semantic Kernel skills are available for automated development tasks:

- **UnityCodeSkill**: Provides Unity-aware code generation (`generate_unity_csharp`), syntax validation (`validate_unity_syntax`), and code extraction (`extract_csharp_code`).
- **UnityProjectSkill**: Secure file operations restricted to the output directory (`write_unity_asset`, `create_unity_folder`).
- **TextSkill**: Basic text manipulation like `trim_text`, `uppercase_text`, and `lowercase_text`.
- **TimeSkill**: Date and time operations including `get_current_time` and `format_date`.
- **MathSkill**: Basic mathematical operations like `add_numbers` and `multiply_numbers`.

### Frontend Technical Skills (Vue/TypeScript)

The following frontend modules provide standardized capabilities:

- **apiClient**: Unified API wrapper in `src/api/client.ts` for generation, preferences, and finalization jobs.
- **SmartField**: A versatile UI component (`src/components/generic/SmartField.vue`) that handles various input types and validation.
- **StatusBanner**: Consistent UI for status updates and error reporting.
- **TauriShell**: Secure OS integration via Tauri's shell API for file system interaction.

Use these skills when appropriate according to the task context. Be smart, mutatis mutandis. See [agents/SKILLS_USAGE.md](../agents/SKILLS_USAGE.md) for detailed implementation.

## Project setup

To install all dependencies for both frontend and backend:

```bash
pnpm run setup
```

## Running the app

To start the Tauri development environment:

```bash
pnpm run dev
```

This starts the Tauri integration which handles the backend sidecar.

## Manual individual setup (Optional)

### Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

The backend serves on `http://127.0.0.1:8000` with CORS enabled.

### Frontend setup

```bash
cd frontend
pnpm install
pnpm run dev
```

The UI dev server runs on `http://localhost:5173`.

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

To run all tests (Backend & Frontend):

```bash
pnpm run test:all
```

### Backend tests

```bash
pnpm run test:backend
```

### Frontend unit tests

```bash
pnpm run test:frontend
```

### Playwright E2E tests

```bash
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
pnpm run lint
pnpm run typecheck
```

## Smoke test (Windows)

```powershell
.\scripts\smoke_test.ps1
```

## Unity Engine Integration (local development)

To test the Unity finalize workflow locally you need a Unity Editor installation.

### Setup

1. Install Unity Hub and a Unity Editor version (2022.3 LTS recommended).
2. Set the Unity path via environment variable:

```powershell
# Windows
$env:UNITY_EDITOR_PATH = "C:\Program Files\Unity\Hub\Editor\2022.3.0f1\Editor\Unity.exe"
```

```bash
# Linux / macOS
export UNITY_EDITOR_PATH="/path/to/Unity"
```

Alternatively, set it in the UI Settings panel or via the preferences API.

### Testing the finalize flow

1. Start the backend (`pnpm run dev` or `uvicorn`).
2. In the UI, fill in prompts and enable Unity Engine Settings toggles.
3. Click **Finalize with Unity Engine**.
4. Watch the log viewer for real-time progress.
5. On completion, download the `.zip` artifact.

### Debugging Unity batch execution

- Unity writes its log to platform-specific locations:
  - **Windows**: `%LOCALAPPDATA%\Unity\Editor\Editor.log`
  - **macOS**: `~/Library/Logs/Unity/Editor.log`
  - **Linux**: `~/.config/unity3d/Editor.log`
- The finalize job status includes the last 5000 chars of the Editor.log via the
  polling endpoint.
- For deeper debugging, open the Editor.log file directly while the job is
  running.

### Jinja2 C# templates

Editor automation scripts are generated from Jinja2 templates in
`backend/templates/unity/`. To modify the automation:

1. Edit the `.cs.j2` template.
2. Restart the backend (templates are loaded at render time, so hot-reload is
   supported with `--reload`).
3. Run a finalize job to test the rendered output.

## Common issues

- Backend not reachable: confirm port 8000 is free and the backend is running.
- Provider failures: verify `config/api_keys.json` and check `logs/`.
- Unity output missing: confirm `output/` exists and requests include prompts.
- Frontend build issues: delete `node_modules/` and reinstall with pnpm.
- Unity finalize fails: check that `UNITY_EDITOR_PATH` is set and the Unity
  license is activated. Review `logs_tail` in the job status or the raw
  `Editor.log`.
- Timeout during finalize: increase the timeout in Unity Engine Settings
  (default 300s). Large projects with many packages may need more time.
