Set-Location "$PSScriptRoot\.."

Write-Host "Starting backend..."
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-ExecutionPolicy Bypass -File scripts\run_backend.ps1"

Write-Host "Starting frontend (Tauri dev)..."
Set-Location "$PSScriptRoot\..\frontend"
npm install
npm run dev:tauri
