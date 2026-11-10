
@echo off
REM MaterniTrack - Windows starter (PowerShell windows)
REM Runs migrations then opens PowerShell windows: backend, frontend, and Flutter app
REM All three talk to the same local Django backend on http://127.0.0.1:8000

pushd "%~dp0"
set "PROJECT_ROOT=%cd%"

REM Prefer virtualenv python if present (use absolute paths to avoid cwd issues)
if exist "%PROJECT_ROOT%\backend\.venv\Scripts\python.exe" (
  set "PYTHON=%PROJECT_ROOT%\backend\.venv\Scripts\python.exe"
) else if exist "%PROJECT_ROOT%\backend\venv\Scripts\python.exe" (
  set "PYTHON=%PROJECT_ROOT%\backend\venv\Scripts\python.exe"
) else (
  set "PYTHON=python"
)

REM If backend virtualenv doesn't exist, create it and install requirements
if not exist "%PROJECT_ROOT%\backend\.venv\Scripts\python.exe" (
  echo Creating virtual environment in %PROJECT_ROOT%\backend\.venv ...
  pushd "%PROJECT_ROOT%\backend"
  %PYTHON% -m venv .venv
  if exist "%cd%\.venv\Scripts\python.exe" (
    echo Activating and installing requirements...
    set "PYTHON=%cd%\.venv\Scripts\python.exe"
    "%PYTHON%" -m pip install --upgrade pip
    if exist "%cd%\requirements.txt" (
      "%PYTHON%" -m pip install -r requirements.txt
    )
  ) else (
    echo Failed to create virtualenv with %PYTHON% - continuing with system python.
  )
  popd
)

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo Starting MaterniTrack Stack
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo ⚙️  Starting Django backend on http://127.0.0.1:8000...
start "MaterniTrack - Backend" cmd /k "cd /d %PROJECT_ROOT%\backend && %PYTHON% manage.py migrate && %PYTHON% manage.py runserver 0.0.0.0:8000"

echo ⚛️  Starting React frontend on http://localhost:5173...
start "MaterniTrack - Frontend" cmd /k "cd /d %PROJECT_ROOT%\frontend && npm run dev"

REM Give the backend a moment to start before launching Flutter
timeout /t 2 /nobreak

echo 📱 Starting Flutter app in Chrome...
start "MaterniTrack - Flutter" cmd /k "cd /d %PROJECT_ROOT%\mother_app && flutter pub get && flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8000"

echo.
echo ✅ Stack startup initiated!
echo.
echo 🌐 Access Points:
echo    Web frontend:  http://localhost:5173
echo    Backend API:   http://127.0.0.1:8000
echo    Admin:         http://127.0.0.1:8000/admin
echo    Flutter:       Opening in Chrome...
echo.
echo ⏳ Give each window 3-5 seconds to start. If the Flutter app shows errors:
echo.
echo    1️⃣  Check the Backend window to ensure no errors occurred
echo    2️⃣  Run: powershell -File "%PROJECT_ROOT%\check_backend.ps1"
echo    3️⃣  Check the browser console for CORS errors (F12)
echo.
popd
exit /b 0

