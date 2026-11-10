# Diagnostic script to check if the backend is running
Write-Host "🏥 Checking MaterniTrack backend status..." -ForegroundColor Cyan

# Test connection to backend
$backendUrl = "http://127.0.0.1:8000"
$healthCheckUrl = "$backendUrl/api/v1/health/"

Write-Host "Testing connection to: $backendUrl" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $healthCheckUrl -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running and responding!" -ForegroundColor Green
        Write-Host "Response: $($response.Content)" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend returned status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend is NOT responding!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying to start the backend automatically..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try to start the backend
    $projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $backendPath = Join-Path $projectRoot "backend"
    
    # Find Python
    $pythonPath = "$backendPath\.venv\Scripts\python.exe"
    if (-not (Test-Path $pythonPath)) {
        $pythonPath = "$backendPath\venv\Scripts\python.exe"
    }
    if (-not (Test-Path $pythonPath)) {
        $pythonPath = "python"
    }
    
    Write-Host "Starting Django backend..." -ForegroundColor Yellow
    Set-Location $backendPath
    & $pythonPath manage.py migrate
    & $pythonPath manage.py runserver 0.0.0.0:8000
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
