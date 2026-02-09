# Packaging

This app bundles the Python backend as a Tauri sidecar. The expected binary is:

- `backend/dist/unity-generator-backend` (macOS/Linux)
- `backend/dist/unity-generator-backend.exe` (Windows)

## Build Backend Sidecar

```bash
./scripts/build_backend.sh
```

Windows:

```powershell
.\scripts\build_backend.ps1
```

## Build Tauri App

```bash
cd frontend
npm install
npm run tauri build
```

The built app will start the backend sidecar automatically.

## Docker Compose (Dev/CI)

```bash
docker-compose up --build
```

This starts the backend at `http://localhost:8000` and the frontend dev server
at `http://localhost:5173`.

Dockerfiles:
- `backend/Dockerfile`
- `frontend/Dockerfile`

## Devcontainer

Open the repo in VS Code and use:

```
Dev Containers: Reopen in Container
```

The devcontainer uses `docker-compose.yml` and boots the backend service. Run
the frontend service with docker-compose or locally. `runServices` starts both
backend and frontend containers automatically.
