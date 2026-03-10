# Kills only the process listening on port 35421 (without killing children or looping).
# Execute: .\scripts\kill-port-35421.ps1
$port = 35421

$pid = $null
try {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
  if ($conn) { $pid = $conn[0].OwningProcess }
} catch { }

if (-not $pid) {
  netstat -ano | Select-String ":$port\s+.*LISTENING" | ForEach-Object {
    $parts = ($_.Line -split "\s+") | Where-Object { $_ -ne "" }
    if ($parts[-1] -match '^\d+$') { $pid = [int]$parts[-1]; break }
  }
}

if (-not $pid) {
  Write-Host "No process found on port $port."
  exit 0
}

$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
if (-not $proc) {
  Write-Host "PID $pid doesn't exist (ghost entry). Close Electron and Launch and try opening the app again."
  exit 0
}

Write-Host "Killing PID $pid ($($proc.ProcessName))..."
taskkill /PID $pid /F
if ($LASTEXITCODE -eq 0) {
  Write-Host "Done."
} else {
  Write-Host "taskkill failed. Try: open Task Manager, find 'Python' or 'uvicorn', end the task. Or run this script from PowerShell as Administrator."
  exit 1
}
