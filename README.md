# Unity Generator

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

## How it works

1. The Vue + Tauri UI collects prompts and settings.
2. The FastAPI backend routes each request to an agent.
3. Agents call provider wrappers (LLM, image, audio) using your keys.
4. Responses are normalized and returned to the UI.
5. Unity project requests are written to `output/` with Unity metadata.

## Configuration

API keys are stored locally in `config/api_keys.json`. Use the Settings panel,
or copy `config/api_keys.example.json` and fill it in manually.

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

- Generated assets and Unity projects land in `output/`.
- The Unity project output includes minimal `ProjectSettings` and `.meta` files.
- Scripts are written to `Assets/Scripts/GeneratedScript.cs`.
- Text is written to `Assets/Text/generated_text.txt`.
- Images are written to `Assets/Textures/`.
- Audio is written to `Assets/Audio/`.

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

## Troubleshooting

- If the UI cannot reach the backend, confirm the backend is running on port 8000.
- If generation fails, verify your provider keys in `config/api_keys.json`.
- If a provider request errors, check `logs/` for the failed request log.
- If a Docker build is slow, ensure `node_modules/` and venvs are ignored.
