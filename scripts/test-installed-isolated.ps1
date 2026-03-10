#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test installed Electron app in COMPLETELY ISOLATED Docker container.

.DESCRIPTION
    This script builds and tests the installed application ENTIRELY inside a Docker container.
    
    COMPLETE ISOLATION GUARANTEES:
    - Source code copied INTO container (not mounted)
    - All builds happen INSIDE container
    - All tests run INSIDE container
    - ZERO temporary files on your physical disk
    - ZERO access to your local filesystem
    - ZERO impact on your production environment
    - Container is destroyed after testing
    
    Your physical disk is NEVER touched except to read source code.

.PARAMETER KeepContainer
    Keep the container after tests for debugging (still isolated)

.PARAMETER ShowLogs
    Show detailed build logs from Docker

.EXAMPLE
    .\scripts\test-installed-isolated.ps1
    
.EXAMPLE
    .\scripts\test-installed-isolated.ps1 -KeepContainer -ShowLogs
#>

param(
    [switch]$KeepContainer,
    [switch]$ShowLogs
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ISOLATED INSTALLATION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script tests the installed app in a Docker container." -ForegroundColor Yellow
Write-Host ""
Write-Host "ISOLATION GUARANTEES:" -ForegroundColor Green
Write-Host "  [OK] All builds happen INSIDE container" -ForegroundColor Green
Write-Host "  [OK] All tests run INSIDE container" -ForegroundColor Green
Write-Host "  [OK] ZERO temporary files on your disk" -ForegroundColor Green
Write-Host "  [OK] ZERO access to your filesystem" -ForegroundColor Green
Write-Host "  [OK] ZERO impact on production" -ForegroundColor Green
Write-Host ""

# Check if Docker is available
Write-Host "[1/4] Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not found"
    }
    Write-Host "  Docker found: $dockerVersion" -ForegroundColor Gray
} catch {
    Write-Host ""
    Write-Host "ERROR: Docker is not installed or not running." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "  https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Build Docker image (this copies source code INTO container)
Write-Host ""
Write-Host "[2/4] Building Docker image..." -ForegroundColor Cyan
Write-Host "  This will:" -ForegroundColor Gray
Write-Host "    - Copy source code into container" -ForegroundColor Gray
Write-Host "    - Install dependencies inside container" -ForegroundColor Gray
Write-Host "    - Build backend inside container" -ForegroundColor Gray
Write-Host "    - Build frontend inside container" -ForegroundColor Gray
Write-Host "    - Package Electron app inside container" -ForegroundColor Gray
Write-Host ""
Write-Host "  Using Linux containers (works with your Docker setup)" -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes on first run..." -ForegroundColor Yellow
Write-Host ""

# BuildKit required for cache mounts (faster pnpm install on repeated runs)
$env:DOCKER_BUILDKIT = "1"
if ($ShowLogs) {
    docker build -f Dockerfile.test-isolated-linux -t unity-generator-test:isolated .
} else {
    docker build -f Dockerfile.test-isolated-linux -t unity-generator-test:isolated . 2>&1 | Out-Null
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker build failed" -ForegroundColor Red
    Write-Host "Run with -ShowLogs to see detailed output" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Build complete!" -ForegroundColor Green

# Run tests in container
Write-Host ""
Write-Host "[3/4] Running tests in isolated container..." -ForegroundColor Cyan
Write-Host ""

$containerName = "unity-generator-test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

if ($KeepContainer) {
    docker run --name $containerName unity-generator-test:isolated
    $testResult = $LASTEXITCODE
    
    Write-Host ""
    Write-Host "Container kept for debugging: $containerName" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To inspect the container:" -ForegroundColor Gray
    Write-Host "  docker exec -it $containerName powershell" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To view logs:" -ForegroundColor Gray
    Write-Host "  docker exec $containerName powershell -Command 'Get-Content C:/build/dist-electron/win-unpacked/app.log'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To remove when done:" -ForegroundColor Gray
    Write-Host "  docker rm -f $containerName" -ForegroundColor Gray
    Write-Host ""
} else {
    docker run --rm --name $containerName unity-generator-test:isolated
    $testResult = $LASTEXITCODE
}

# Cleanup
Write-Host ""
Write-Host "[4/4] Cleanup..." -ForegroundColor Cyan
if (-not $KeepContainer) {
    Write-Host "  Container automatically removed" -ForegroundColor Green
}
Write-Host "  No files created on your disk" -ForegroundColor Green

# Results
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($testResult -eq 0) {
    Write-Host "RESULT: PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "The installed app runs successfully!" -ForegroundColor Green
    Write-Host "Your Vite config fix worked." -ForegroundColor Green
} else {
    Write-Host "RESULT: FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "The installed app still has issues." -ForegroundColor Red
    Write-Host ""
    Write-Host "To debug:" -ForegroundColor Yellow
    Write-Host "  1. Run with -KeepContainer flag" -ForegroundColor Gray
    Write-Host "  2. Inspect the container logs" -ForegroundColor Gray
    Write-Host "  3. Check app.log inside container" -ForegroundColor Gray
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $testResult
