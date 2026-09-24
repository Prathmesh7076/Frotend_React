# Project setup for Windows PowerShell users
# Usage:  .\run.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Product Admin Dashboard - Run (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path "node_modules\next\dist\bin\next")) {
    Write-Host "[1/2] Installing dependencies..." -ForegroundColor Yellow
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Initial install exited $LASTEXITCODE. Repairing Next.js scoped packages..."
        & node scripts/ensure-next-deps.cjs
    }
}

if (-not (Test-Path "node_modules\@next\env\dist\index.js")) {
    Write-Host "[1.5/2] Ensuring Next.js scoped packages..." -ForegroundColor Yellow
    & node scripts/ensure-next-deps.cjs
}

Write-Host "[2/2] Starting dev server on http://localhost:3000" -ForegroundColor Green
npm run dev
