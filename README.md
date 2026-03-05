# Unity Generator

[![CI](https://github.com/Ozymandros/Unity-Generator/actions/workflows/ci.yml/badge.svg)](https://github.com/Ozymandros/Unity-Generator/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Ozymandros/Unity-Generator/actions/workflows/codeql.yml/badge.svg)](https://github.com/Ozymandros/Unity-Generator/security/code-scanning)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025E8C?logo=dependabot&logoColor=white)](https://github.com/Ozymandros/Unity-Generator/security/dependabot)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Semantic Kernel](https://img.shields.io/badge/Semantic%20Kernel-512BD4)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-1.x-24C8DB?logo=tauri&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)
[![Playwright](https://img.shields.io/badge/Playwright-45ba4b?logo=playwright&logoColor=white)](https://github.com/Ozymandros/Unity-Generator/actions/workflows/ci.yml)

Unity Generator is a lightweight desktop app for generating Unity C# code, text,
images, and audio using cloud AI providers. It ships a Tauri + Vue UI with a
local FastAPI backend orchestrated by Semantic Kernel. All API keys are provided
by the user and stored locally.

## Why this exists

Unity Generator is a small, local-first studio assistant. It keeps the UI fast,
the backend lightweight, and prompts flexible so you can iterate on Unity code
and assets without wiring multiple tools together.

## What it can do

- Generate Unity-ready C# snippets and project scaffolds
- Create text drafts, image prompts, and audio placeholders
- **Incremental Asset Generation**: Save assets directly into an active Unity project
- **Pixel-Art Sprites**: Generate and process 2D sprite sheets with automatic cropping
- **Unity MCP Integration**: Real-time interaction with the Unity Editor using [Unity-MCP-SK-Plugin](https://github.com/Ozymandros/Unity-MCP-SK-Plugin) and [Unity-MCP-Server](https://github.com/Ozymandros/Unity-MCP-Server)
- Save and reuse provider settings and preferences locally
- Configure global and per-request system key prompts for tailored generation
- Keep output structured so Unity can open it right away

## Workspace Structure

- `frontend/` - Tauri + Vue UI
- `backend/` - FastAPI + Semantic Kernel backend
- `config/` - Local API key storage
- `agents/` - Modular Semantic Kernel agents
- `services/` - Provider wrappers (LLM, image, audio)
- `db/` - SQLite storage for user preferences
- `output/` - Generated Unity projects and assets
- `logs/` - Backend logs

## Status

Scaffolded and functional. See docs for development and packaging details.

## Documentation

- [Architecture overview](docs/ARCHITECTURE.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Packaging and distribution](docs/PACKAGING.md)
- [System Prompts guide](docs/SYSTEM_PROMPTS.md)

## Integrated Tooling

Unity Generator is optimized for development with **VS Code**:

- **Native Workflow**: Use the `Dev: Backend + Frontend` launch configuration to debug both stacks simultaneously.
- **Docker Support**: Integrated tasks for `docker-compose` and remote machine debugging are provided for isolated testing.
- **Editor Setup**: Configured for **Volar (Vue 3)** and **TypeScript**, with type checking mapped to internal monorepo paths.
- **Architecture**: While Docker is used for dev/CI, the final product uses the **Tauri Sidecar pattern** (NOT Docker) for a zero-dependency installation experience.

All contributions must follow the **SRP**, **KISS**, and **Clean Architecture** principles outlined in the development guide.

## 🔥 Cross-Platform Support

Unity Generator runs on **Windows**, **Linux**, and **macOS** with full feature parity.

### Development Setup (All Platforms)

```bash
# Install dependencies (works on all platforms)
pnpm run setup

# Start backend (cross-platform)
pnpm run backend:dev

# Start frontend (cross-platform)
pnpm run dev
```

### Containerized Development

All platforms support Docker/Docker Compose:

```bash
docker-compose up
```

### Validation

The project maintains cross-platform compatibility through:

- **Automated CI**: Tests run on Ubuntu, Windows, and macOS on every PR
- **Path Handling**: Uses `pathlib.Path` throughout for safe cross-platform file operations
- **Shell Scripts**: Build and dev scripts use cross-platform npm/pnpm commands
- **Configuration**: Platform-agnostic JSON/YAML configs (no hardcoded paths)

See [CONTRIBUTING.md](CONTRIBUTING.md) for platform-specific development guidelines.

## Quick Start

### For Development (No Rust Required)

Most development doesn't require building the full installer:

```bash
# 1. Install dependencies
pnpm run setup

# 2. Start dev servers (backend + frontend with hot reload)
pnpm run dev
```

This launches the app in Tauri dev mode with live reloading - **Rust is not required**.

### For Local Packaging (Requires Rust)

To build the full native installer locally:

1. **Install Rust** (one-time setup):
   - Windows: `winget install Rustlang.Rustup` or download from [rustup.rs](https://rustup.rs/)
   - macOS/Linux: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
   - Restart your terminal after installation

2. **Build the package**:
   ```bash
   pnpm run package
   ```
   This creates the native installer:
   - **Windows**: `.msi` in `frontend/src-tauri/target/release/bundle/msi/`
   - **Linux**: `.AppImage` and `.deb` in `frontend/src-tauri/target/release/bundle/`
   - **macOS**: `.dmg` in `frontend/src-tauri/target/release/bundle/dmg/`

### For Production Releases (Automated)

**You don't need to build installers manually.** CI automatically builds for all platforms:

1. Tag a release: `git tag -a v1.0.0 -m "Release v1.0.0" && git push origin v1.0.0`
2. GitHub Actions builds Windows/Linux/macOS installers
3. Download from the [Releases page](https://github.com/Ozymandros/Unity-Generator/releases)

## How it works

1. The Vue + Tauri UI collects prompts and settings.
2. The FastAPI backend routes each request to an agent.
3. Agents call provider wrappers (LLM, image, audio) using your keys.
4. Responses are normalized and returned to the UI.
5. Unity project requests are written to `output/` with Unity metadata.
6. **Active Projects**: Individual assets can be auto-saved to any active Unity project workspace. The UI keeps a session-scoped project name and path; when you create a scene, that path is sent to the backend and injected into the Unity agent so MCP tools (e.g. save_*, contract) receive the correct project path.

## Configuration

API keys are stored locally in `config/api_keys.json`. Use the **Settings** panel to configure keys and set preferred providers.
The UI uses dropdown menus to let you easily select from supported providers and models.

### Supported providers

LLM:

- `openai`
- `deepseek`
- `openrouter`
- `groq`
- `google`
- `anthropic`
- `huggingface`
- `replicate` (chat via [Replicate predictions API](https://replicate.com/docs/reference/http); default model `meta/llama-2-7b`)

Image:

- `stability`
- `flux`
- `openai`
- `replicate` (e.g. Flux)

Audio:

- `elevenlabs`
- `playht`
- `replicate` (e.g. MusicGen)

The backend selects providers by priority when no explicit provider is set.
Replicate LLM uses a custom Semantic Kernel adapter that calls the predictions API (create + poll) instead of an OpenAI-compatible endpoint. See [backend/app/services/providers/connectors/replicate.py](backend/app/services/providers/connectors/replicate.py).
Priority order is defined in the provider registry and in [services/llm_provider.py](services/llm_provider.py), [services/image_provider.py](services/image_provider.py), and [services/audio_provider.py](services/audio_provider.py).

### Preferences

The UI stores preferred providers in the local SQLite DB:

- `preferred_llm_provider`
- `preferred_image_provider`
- `preferred_audio_provider`

## Backend API

Base URL: `http://127.0.0.1:8000`

Health:

- `GET /health`

Generation:

- `POST /generate/code`
- `POST /generate/text`
- `POST /generate/image`
- `POST /generate/audio`
- `POST /generate/sprites`

Request body:

```json
{
  "prompt": "Generate a Unity player controller",
  "provider": "openai",
  "project_path": "C:/Projects/MyUnityGame",
  "options": {"model": "gpt-4o-mini", "temperature": 0.2}
}
```

Unity project generation:

- `POST /generate/unity-project`

Request body:

```json
{
  "project_name": "MyUnityProject",
  "code_prompt": "Create a player controller",
  "text_prompt": "Write a short quest description",
  "image_prompt": "Fantasy landscape",
  "audio_prompt": "Calm ambient loop",
  "provider_overrides": {"code": "openai", "image": "stability"},
  "options": {
    "code": {"model": "gpt-4o-mini"},
    "image": {"aspect_ratio": "1:1"}
  }
}
```

Configuration:

- `GET /config/keys`
- `POST /config/keys`

Preferences:

- `GET /prefs/{key}`
- `POST /prefs`

Output:

- `GET /output/latest`

## Outputs

- Generated assets and Unity projects land in `output/` by default.
- When an active project is set, files are saved directly to its `Assets/` subfolders:
  - Scripts: `Assets/Scripts/`
  - Text: `Assets/Text/`
  - Images/Sprites: `Assets/Sprites/`
  - Audio: `Assets/Audio/`
- Every saved asset includes an automatically generated `.meta` file.


## Test Isolation & Mocking

All tests in this repository are fully isolated from the real filesystem and network:

- **Frontend unit/integration tests**: All network requests are globally mocked using [MSW](https://mswjs.io/). No real HTTP requests are made; all dependencies must be mocked in each test.
- **Backend unit/integration tests**: All filesystem operations are globally mocked using [pyfakefs](https://github.com/jmcgeheeiv/pyfakefs). No real files or directories are created, modified, or deleted during tests. All network dependencies must be mocked in each test.
- **E2E tests**: All backend API endpoints are intercepted and mocked using Playwright’s route interception. No real backend or network is required for E2E tests; all dependencies are mocked for deterministic, fast, and safe runs.

> **Note:** Any test that attempts to access the real filesystem or network will fail by default. If you add new dependencies, ensure they are properly mocked in your tests.

See the test setup files in `frontend/src/test/setup.ts` and `backend/tests/conftest.py` for details.

---

## Tests

```bash
# Total validation (Lint + Typecheck + Test)
pnpm check:all

# All tests (Backend & Frontend)
pnpm run test:all

# Backend only
pnpm run test:backend

# Frontend unit tests
pnpm run test:frontend

# E2E tests
pnpm run test:e2e
```

## Packaging

See `docs/PACKAGING.md` for bundling the backend sidecar and building the
Tauri app.

## Docker

`docker-compose.yml` provides a dev/CI runner. See `docs/PACKAGING.md`.

## Troubleshooting

- If the UI cannot reach the backend, confirm the backend is running on port 8000.
- If generation fails, verify your provider keys in `config/api_keys.json`.
- If a provider request errors, check `logs/` for the failed request log.
- If a Docker build is slow, ensure `node_modules/` and venvs are ignored.

## Unity MCP Integration

See [docs/UNITY_MCP_INTEGRATION.md](docs/UNITY_MCP_INTEGRATION.md) for details on the Semantic Kernel MCP integration, configuration, and usage.

## Download

You can download prebuilt packages from GitHub:

- **Latest stable builds (recommended):**  
  https://github.com/Ozymandros/Unity-Generator/releases

- **CI artifacts from latest workflow runs:**  
  https://github.com/Ozymandros/Unity-Generator/actions/workflows/build.yml

> Note: GitHub Actions artifacts are tied to a workflow run and may expire.  
> For permanent downloads, use **Releases**.
