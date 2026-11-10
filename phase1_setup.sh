#!/bin/bash
# Phase 1 setup script — install deps + run migrations
set -e

BACKEND_DIR="$(dirname "$0")/backend"
cd "$BACKEND_DIR"

echo "=== Installing Python dependencies ==="
./venv/bin/pip install django-simple-history django-filter 2>&1 || echo "[WARN] pip install failed — you may need to install manually"

echo ""
echo "=== Running makemigrations ==="
./venv/bin/python manage.py makemigrations alerts 2>&1
./venv/bin/python manage.py makemigrations patients 2>&1
./venv/bin/python manage.py makemigrations appointments 2>&1
./venv/bin/python manage.py makemigrations postnatal 2>&1

echo ""
echo "=== Running migrate ==="
./venv/bin/python manage.py migrate 2>&1

echo ""
echo "=== Phase 1 setup complete ==="
