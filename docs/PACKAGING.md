# Packaging

Unity Generator bundles the Python backend with the Electron application. The expected
backend binary names are:

- `backend/dist/unity-generator-backend` (macOS/Linux)
- `backend/dist/unity-generator-backend.exe` (Windows)

## Cleaning build artifacts

To remove previous build artifacts and binaries:

```bash
pnpm run clean
```

## Build backend sidecar

To compile the Python backend into a sidecar binary:

```bash
pnpm run build:backend
```

The script places the executable in `backend/dist/`.

## Build the Electron app (Installer)

To build the complete Electron desktop application:

```bash
pnpm run electron:build
```

## Complete Packaging

To clean, build the sidecar, and bundle the app in one command:

```bash
pnpm run package
```

The built app will start the backend sidecar automatically when launched.

## Docker Compose (Dev/CI)

```bash
docker-compose up --build
```

This starts:

- Backend at `http://localhost:35421`
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
- Build the Electron app and run it once to validate backend startup.
