# Packaging

Unity Generator bundles the Python backend as a Tauri sidecar. The expected
backend binary names are:

- `backend/dist/unity-generator-backend` (macOS/Linux)
- `backend/dist/unity-generator-backend.exe` (Windows)

## Build backend sidecar

```bash
./scripts/build_backend.sh
```

Windows:

```powershell
.\scripts\build_backend.ps1
```

The build scripts should place the executable in `backend/dist/`.

## Build the Tauri app

```bash
cd frontend
pnpm install
pnpm run tauri build
```

The built app will start the backend sidecar automatically when launched.

## Docker Compose (Dev/CI)

```bash
docker-compose up --build
```

This starts:

- Backend at `http://localhost:8000`
- Frontend dev server at `http://localhost:5173`

Dockerfiles:
- `backend/Dockerfile`
- `frontend/Dockerfile`

### Notes

- The compose file mounts repo folders as volumes for live reload.
- API keys should be provided via `config/api_keys.json` on the host.
- For repeatable builds, ensure `node_modules/` and venvs are ignored.

## Release checklist (manual)

- Update dependencies in `frontend/package.json` and `backend/requirements.txt`.
- Run tests for backend and frontend.
- Build the backend sidecar and verify the binary exists in `backend/dist/`.
- Build the Tauri app and run it once to validate sidecar startup.
