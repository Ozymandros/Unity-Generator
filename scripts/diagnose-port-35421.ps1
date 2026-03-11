# Diagnoses who is listening on port 35421.
# Most reliable: Get-NetTCPConnection (OwningProcess). Fallback: netstat.
# Execute: & "C:\Projects\Unity-Generator\scripts\diagnose-port-35421.ps1"
$port = 35421
Write-Host "Port $port - who is listening (LISTEN):"
Write-Host ""

# 1) Try Get-NetTCPConnection (most reliable on Windows)
$conn = $null
try {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
} catch {
  # Module not available or permissions issue
}

if ($conn) {
  foreach ($c in $conn) {
    $pid = $c.OwningProcess
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
      $path = $proc.Path
      if (-not $path) { $path = "(not accessible)" }
      Write-Host "  PID $pid  EXISTS  -> $($proc.ProcessName)"
      Write-Host "      Path: $path"
      Write-Host "      To kill: taskkill /PID $pid /F"
    } else {
      Write-Host "  PID $pid  (process not found by Get-Process)"
    }
  }
  Write-Host ""
  Write-Host "Summary: Get-NetTCPConnection found the listening process. Kill the PID above."
  exit 0
}

# 2) Fallback: netstat
Write-Host "  (Get-NetTCPConnection found nothing; using netstat)"
Write-Host ""
$lines = netstat -ano | Select-String ":$port\s+.*LISTENING"
if (-not $lines) {
  Write-Host "  No LISTENING entries. Port should be free."
  Write-Host "  If http://127.0.0.1:$port/health still responds, might be cache or another port."
  exit 0
}
foreach ($line in $lines) {
  $parts = ($line.Line -split "\s+") | Where-Object { $_ -ne "" }
  $procId = $parts[-1]
  if ($procId -match '^\d+$') {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
      $path = $proc.Path
      if (-not $path) { $path = "(not accessible)" }
      Write-Host "  PID $procId  EXISTS  -> $($proc.ProcessName)  $path"
      Write-Host "      taskkill /PID $procId /F"
    } else {
      Write-Host "  PID $procId  GHOST  -> process doesn't exist (obsolete netstat)"
      Write-Host "      Restart PC or wait a few minutes might clean up."
    }
  }
}
Write-Host ""
Write-Host "If all are GHOST but something responds on port: close Electron/VS Code Launch and run this script again."
Write-Host "Check: Invoke-WebRequest -Uri http://127.0.0.1:$port/health -UseBasicParsing | Select-Object -ExpandProperty Content"
