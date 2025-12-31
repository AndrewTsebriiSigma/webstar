$ErrorActionPreference = "Continue"
Set-Location "C:\Users\andri\Desktop\myProjects\creator_OS_v1\CreatorOS_V1\backend"

Write-Host "=== Testing Backend Startup ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Testing Python import..." -ForegroundColor Yellow
try {
    $output = & .\venv\Scripts\python.exe -c "from app.main import app; print('SUCCESS')" 2>&1
    if ($output -match "SUCCESS") {
        Write-Host "   ✓ Import successful" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Import failed:" -ForegroundColor Red
        Write-Host $output
        exit 1
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Creating database..." -ForegroundColor Yellow
try {
    $output = & .\venv\Scripts\python.exe -c "from app.db.base import create_db_and_tables; create_db_and_tables(); print('DB_CREATED')" 2>&1
    if ($output -match "DB_CREATED") {
        Write-Host "   ✓ Database created" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Database creation output:" -ForegroundColor Red
        Write-Host $output
    }
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Starting Uvicorn server..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

& .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000














