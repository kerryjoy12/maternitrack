#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
#  MaterniTrack — One-command stack starter
#  Boots: Django backend  (http://127.0.0.1:8000)
#         React frontend  (http://localhost:5173)
#         Flutter app     (auto-runs against the backend above)
# ═══════════════════════════════════════════════════════════════════════

echo "🏥 Starting MaterniTrack — full stack..."
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Detect the LAN IP of this machine so a physical phone on the same Wi-Fi
# can reach the backend without any extra flags.
LAN_IP=""
if command -v hostname >/dev/null 2>&1; then
  LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi
if [ -z "$LAN_IP" ]; then
  LAN_IP="127.0.0.1"
fi
echo "🌐 Detected LAN IP: $LAN_IP"

# ─── 1. Start Django backend ─────────────────────────────────────
echo "⚙️  Starting Django backend on http://127.0.0.1:8000 ..."
cd "$ROOT_DIR/backend"
PY_CMD="python3"
if command -v python3 >/dev/null 2>&1; then
  PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
  PY_CMD="python"
fi

# Prefer .venv, but accept venv for older setups. Create if missing.
if [ -d ".venv" ]; then
  source .venv/bin/activate
elif [ -d "venv" ]; then
  source venv/bin/activate
else
  echo "No virtualenv found in backend; creating .venv with $PY_CMD..."
  $PY_CMD -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install --upgrade pip
  if [ -f requirements.txt ]; then
    pip install -r requirements.txt
  fi
fi

python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!
echo "   Django PID: $DJANGO_PID"

# Give the backend a moment so the very first Flutter request doesn't
# race the runserver boot.
sleep 2

# ─── 2. Start React frontend ─────────────────────────────────────
echo "⚛️  Starting React frontend on http://localhost:5173 ..."
cd "$ROOT_DIR/frontend"
npm run dev &
VITE_PID=$!
echo "   Vite PID: $VITE_PID"

# ─── 3. Start Flutter app ────────────────────────────────────────
echo "📱 Starting Flutter app in Chrome against the local backend..."
cd "$ROOT_DIR/mother_app"
if command -v flutter >/dev/null 2>&1; then
  flutter pub get
  flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:8000 &
  FLUTTER_PID=$!
  echo "   Flutter PID: $FLUTTER_PID"
  echo "   (For a physical device on the same Wi-Fi, use:"
  echo "      cd mother_app && flutter run -d chrome --dart-define=API_BASE_URL=http://$LAN_IP:8000)"
else
  echo "   ⚠️  Flutter CLI not found on PATH — skipping. Open the project in"
  echo "      Android Studio / VS Code and run with:"
  echo "        flutter pub get"
  echo "        flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:8000"
fi

echo ""
echo "✅ MaterniTrack stack is running!"
echo "   Web frontend:  http://localhost:5173"
echo "   Backend API:   http://127.0.0.1:8000  (also reachable at http://$LAN_IP:8000)"
echo "   Admin:         http://127.0.0.1:8000/admin"
echo "   Flutter:       talks to backend automatically"
echo ""
echo "Press Ctrl+C to stop all servers."

trap "kill $DJANGO_PID $VITE_PID $FLUTTER_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
