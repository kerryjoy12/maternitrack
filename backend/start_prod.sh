#!/usr/bin/env bash
# Production startup script for Render Free Tier (combines Daphne & Celery)

echo "🚀 Starting Celery background worker..."
celery -A config worker --loglevel=info &

echo "🌐 Starting Daphne ASGI server..."
daphne -b 0.0.0.0 -p $PORT config.asgi:application
