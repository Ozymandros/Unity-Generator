# Development Workflow

This guide covers local development for both the FastAPI backend and the
Electron + Vue frontend.

## Prerequisites

- Python 3.11+
- Node.js 20+
- pnpm
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

### Architecture Note: Electron Backend Integration

It is critical to distinguish between the development environment and the final product:

- **Docker**: Used primarily for testing, CI, and isolated debugging sessions.
- **Electron Backend**: The final distributed application uses the **Electron main process** to manage the Python backend. The Python backend is compiled into a standalone binary via `scripts/build_backend.ps1` and spawned by the Electron main process. **The production app does NOT require Docker.**

### Unified Quality Control

The project uses a global `package.json` to manage quality across the monorepo. **Always run the following command before completing any task:**

```bash
pnpm check:all
```

This command sequentially runs `pnpm lint:all`, `pnpm typecheck:all`, and `pnpm test:all`.

## Project Standards

All code modifications must adhere to the following principles defined in our core guidelines:

- **Mandatory Validation**: Every agent action MUST be validated with `pnpm check:all & pnpm test:all` before finishing.
- **SRP (Single Responsibility Principle)**: Each module or class should have one reason to change.
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering; favor readable code over clever solutions.
- **Clean Architecture**: Maintain clear boundaries between services, agents, and the API layer.

## Code Organization

To maintain long-term maintainability and clarity, follow these organization rules:

### Separation of Concerns

- **HTML/CSS/TS**: Strictly separate template structure, styling, and business logic.
- **Frontend Components**: Extract complex logic into composables and keep `<script setup>` sections focused.
- **Styles**: Use scoped CSS for component-specific styling or extract to independent CSS files for shared styles.

### File Responsibility (Single Responsibility Principle)

- Each file must have a single clear responsibility.
- Large components should be split into smaller, modular sub-components.
- Utilities should be grouped logically (e.g., `src/utils/validation.ts`, `src/utils/formatting.ts`).

### Hierarchical Folder Structure

- Group related items together in intuitive hierarchies.
- Use subdirectories for complex features or component families.
- Maintain consistent naming conventions (camelCase for TS/JS, PascalCase for Vue components).

### Modularity and Coupling

- Design components to be reusable and independent.
- Minimize coupling between modules by using clear interfaces and dependency injection where appropriate.
- Prioritize testability by keeping logic decoupled from the UI/DOM where possible.

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

Use these skills when appropriate according to the task context. Be smart, mutatis mutandis. See [agents/SKILLS_USAGE.md](../agents/SKILLS_USAGE.md) for detailed implementation.

## Project setup

To install all dependencies for both frontend and backend:

```bash
pnpm run setup
```

## Running the app

To start the Electron development environment:

```bash
pnpm run dev
```

This starts the Electron app with the backend and frontend.

## Manual individual setup (Optional)

### Backend setup

The project supports **Windows**, **Linux**, and **macOS**.

#### Create and activate Python virtual environment

```bash
cd backend
python -m venv .venv
```

**On Linux/macOS:**
```bash
source .venv/bin/activate
```

**On Windows (Command Prompt):**
```bash
.venv\Scripts\activate.bat
```

**On Windows (PowerShell):**
```bash
.\.venv\Scripts\Activate.ps1
```

#### Install dependencies

```bash
pip install -r requirements.txt
```

#### Run the backend

```bash
# Option 1: Using pnpm (cross-platform, recommended)
pnpm run backend:dev

# Option 2: Directly with uvicorn (after venv activation)
python -m uvicorn app.main:app --reload --port 8000

# Option 3: With debugpy for remote debugging
pnpm run backend:debug
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

## Incremental Project Generation Workflow

The Unity Generator supports an incremental workflow where you can generate assets (Code, Text, Images, Audio, Sprites) and save them directly into an active Unity project workspace.

### Active Project Store

The application uses a reactive `projectStore` to keep track of the currently active project name and its file system path.

1.  **Selection/Activation**: When you generate a base project structure in the **Unity Project** tab, it is automatically set as the active project.
2.  **Persistence**: The active project is persisted in the browser's local storage.
3.  **Visual Indicator**: Every asset panel shows a banner indicating the active project if one is set.

### Individual Asset Saving

When a project is active, asset panels provide an **"Auto-save to project"** toggle. If enabled:

-   **Code**: Generated `.cs` files are saved to `Assets/Scripts/`.
-   **Text**: Generated `.txt` files are saved to `Assets/Text/`.
-   **Images/Sprites**: Generated `.png` files are saved to `Assets/Sprites/`.
-   **Audio**: Generated `.mp3` (or other formats) are saved to `Assets/Audio/`.

Meta files (`.meta`) are automatically generated for all saved assets to ensure compatibility with the Unity Editor.

### Finalization

Once you have added individual assets to your project, use the **Finalize with Unity Engine** button in the **Unity Project** tab to perform batch processing (UPM installation, scene setup, etc.).

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

### Automation mode (batch vs MCP)

Finalize supports two backends. In **Unity Engine Settings** (or the finalize request payload) you can set `unity_automation_mode`:

- **`auto`** (default): Use the MCP-Unity plugin if configured and available; otherwise use batch mode (injected scripts and `-executeMethod`).
- **`batch`**: Always use injected Editor scripts and Unity batch mode. Use this for CI or headless environments where no Editor window is running.
- **`mcp`**: Always use the MCP-Unity (Semantic Kernel) plugin. Fails with a clear error if the plugin is not configured.

To use MCP for local development, set **`UNITY_USE_MCP=1`** and either **`UNITY_MCP_SERVER_URL`** (HTTP) or ensure **`unity-mcp`** (or the command in **`UNITY_MCP_COMMAND`**) is on PATH for stdio. The backend connects via the MCP Python SDK and calls the Unity-MCP-Server contract tools. For CI pipelines, set `unity_automation_mode` to `"batch"` so finalize does not depend on MCP. See [Unity Engine Integration](UNITY_INTEGRATION.md) for the tool contract and configuration.

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
