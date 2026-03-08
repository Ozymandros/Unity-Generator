#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test and debug the installed Unity Generator application.

.DESCRIPTION
    This script helps test the installed application by:
    1. Finding the installed app location
    2. Running the app and monitoring for crashes
    3. Checking log files for errors
    4. Verifying all required files are present

.EXAMPLE
    .\scripts\test-installed-app.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host "=== Unity Generator Installed App Test ===" -ForegroundColor Cyan
Write-Host ""

# Find installed app location
$possibleLocations = @(
    "$env:LOCALAPPDATA\Programs\unity-generator",
    "$env:LOCALAPPDATA\Programs\Unity Generator",
    "$env:ProgramFiles\Unity Generator",
    "$env:ProgramFiles(x86)\Unity Generator"
)

$installedPath = $null
foreach ($location in $possibleLocations) {
    if (Test-Path $location) {
        $installedPath = $location
        Write-Host "✅ Found installed app at: $installedPath" -ForegroundColor Green
        break
    }
}

if (-not $installedPath) {
    Write-Host "❌ Installed app not found!" -ForegroundColor Red
    Write-Host "Please install the app first using:" -ForegroundColor Yellow
    Write-Host "  dist-electron\Unity Generator Setup 0.10.0.exe" -ForegroundColor Yellow
    exit 1
}

# Find executable
$exePath = Join-Path $installedPath "Unity Generator.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "❌ Executable not found at: $exePath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Executable found: $exePath" -ForegroundColor Green
Write-Host ""

# Check for required files
Write-Host "Checking required files..." -ForegroundColor Cyan

$requiredFiles = @(
    "Unity Generator.exe",
    "resources\app.asar",
    "resources\backend\unity-generator-backend.exe"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $installedPath $file
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (MISSING)" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing files detected! Installation may be corrupted." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check log file location
$logPath = Join-Path $env:APPDATA "unity-generator\app.log"
Write-Host "Log file location: $logPath" -ForegroundColor Cyan

if (Test-Path $logPath) {
    Write-Host "✅ Log file exists" -ForegroundColor Green
    
    # Show last 20 lines of log
    Write-Host ""
    Write-Host "=== Last 20 lines of log ===" -ForegroundColor Cyan
    Get-Content $logPath -Tail 20 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "⚠️  Log file doesn't exist yet (app hasn't been run)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Starting installed app ===" -ForegroundColor Cyan
Write-Host "Monitoring for 10 seconds..." -ForegroundColor Yellow
Write-Host ""

# Start the app
$process = Start-Process -FilePath $exePath -PassThru

# Monitor for 10 seconds
$timeout = 10
$elapsed = 0
$crashed = $false

while ($elapsed -lt $timeout) {
    Start-Sleep -Seconds 1
    $elapsed++
    
    if ($process.HasExited) {
        $crashed = $true
        Write-Host "❌ App crashed after $elapsed seconds!" -ForegroundColor Red
        Write-Host "Exit code: $($process.ExitCode)" -ForegroundColor Red
        break
    }
    
    Write-Host "  ⏱️  $elapsed/$timeout seconds - App still running..." -ForegroundColor Gray
}

Write-Host ""

if ($crashed) {
    Write-Host "=== CRASH DETECTED ===" -ForegroundColor Red
    Write-Host ""
    
    # Show log file if it exists
    if (Test-Path $logPath) {
        Write-Host "=== Log file contents ===" -ForegroundColor Cyan
        Get-Content $logPath | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "⚠️  No log file found - app crashed before logging initialized" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "=== Troubleshooting Steps ===" -ForegroundColor Yellow
    Write-Host "1. Check Windows Event Viewer for crash logs:"
    Write-Host "   eventvwr.msc → Windows Logs → Application"
    Write-Host ""
    Write-Host "2. Try running from command line to see errors:"
    Write-Host "   cd `"$installedPath`""
    Write-Host "   .\`"Unity Generator.exe`""
    Write-Host ""
    Write-Host "3. Check if backend can start:"
    Write-Host "   cd `"$installedPath\resources\backend`""
    Write-Host "   .\unity-generator-backend.exe"
    Write-Host ""
    
    exit 1
} else {
    Write-Host "✅ App is running successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The app window should be visible now." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop monitoring, or close the app window." -ForegroundColor Yellow
    Write-Host ""
    
    # Continue monitoring until user stops or app closes
    Write-Host "Continuing to monitor... (Press Ctrl+C to stop)" -ForegroundColor Gray
    
    try {
        while (-not $process.HasExited) {
            Start-Sleep -Seconds 2
        }
        
        Write-Host ""
        Write-Host "App closed. Exit code: $($process.ExitCode)" -ForegroundColor Cyan
    } catch {
        Write-Host ""
        Write-Host "Monitoring stopped by user." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
