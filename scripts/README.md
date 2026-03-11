# Scripts

## Port 35421 (backend)

- **diagnose-port-35421.ps1** – Shows which process is listening on the port (Get-NetTCPConnection or netstat).
- **kill-port-35421.ps1** – Kills only that process (without children or loops).

If the port doesn't free up: close the Electron app and stop the Launch in VS Code; run the script again. If needed, run PowerShell as Administrator.

### Alternative: use a different port

If 35421 remains occupied (or with ghost entries), you can use a different port:

1. Start the app with a different port, for example:
   ```powershell
   $env:BACKEND_PORT="35422"; pnpm run dev:electron:live
   ```
2. Inside the app: Settings → Backend URL → `http://127.0.0.1:35422`.
3. For VS Code Launch: in the "Backend (uvicorn)" config change `--port` to 35422 and, if you have preLaunchTask, create a task for port 35422 or disable it.

This way you don't depend on freeing port 35421.
