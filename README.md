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
- Save and reuse provider settings and preferences locally
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

## Integrated Tooling

Unity Generator is optimized for development with **VS Code**:

- **Native Workflow**: Use the `Dev: Backend + Frontend` launch configuration to debug both stacks simultaneously.
- **Docker Support**: Integrated tasks for `docker-compose` and remote machine debugging are provided for isolated testing.
- **Editor Setup**: Configured for **Volar (Vue 3)** and **TypeScript**, with type checking mapped to internal monorepo paths.
- **Architecture**: While Docker is used for dev/CI, the final product uses the **Tauri Sidecar pattern** (NOT Docker) for a zero-dependency installation experience.

All contributions must follow the **SRP**, **KISS**, and **Clean Architecture** principles outlined in the development guide.

## Quick Start

1. **Setup**: Install all dependencies (Backend & Frontend)

   ```bash
   pnpm run setup
   ```

2. **Run**: Start the Tauri development environment

   ```bash
   pnpm run dev
   ```

## How it works

1. The Vue + Tauri UI collects prompts and settings.
2. The FastAPI backend routes each request to an agent.
3. Agents call provider wrappers (LLM, image, audio) using your keys.
4. Responses are normalized and returned to the UI.
5. Unity project requests are written to `output/` with Unity metadata.

## Configuration

API keys are stored locally in `config/api_keys.json`. Use the **Settings** panel to configure keys and set preferred providers.
The UI uses dropdown menus to let you easily select from supported providers and models.

### Supported providers

LLM:

- `openai`
- `deepseek`
- `openrouter`
- `groq`

Image:

- `stability`
- `flux`

Audio:

- `elevenlabs`
- `playht`

The backend selects providers by priority when no explicit provider is set.
Priority order is defined in [services/llm_provider.py](services/llm_provider.py),
[services/image_provider.py](services/image_provider.py), and
[services/audio_provider.py](services/audio_provider.py).

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

Request body:

```json
{
  "prompt": "Generate a Unity player controller",
  "provider": "openai",
  "options": {"model": "gpt-4o-mini", "temperature": 0.2, "max_tokens": 2048}
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

- Generated assets and Unity projects land in `output/`.
- The Unity project output includes minimal `ProjectSettings` and `.meta` files.
- Scripts are written to `Assets/Scripts/GeneratedScript.cs`.
- Text is written to `Assets/Text/generated_text.txt`.
- Images are written to `Assets/Textures/`.
- Audio is written to `Assets/Audio/`.

## Tests

```bash
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
