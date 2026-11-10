#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
#  MaterniTrack — MySQL Setup Script
#  Run once to create the database and user
# ═══════════════════════════════════════════════════════
set -e

DB_NAME="maternity_db"
DB_USER="maternity_user"
DB_PASS="Makori@254"

echo "📦 Creating MySQL database and user..."
mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ Database '${DB_NAME}' created."
echo "   User: ${DB_USER}"
echo "   Password: ${DB_PASS}"
echo ""
echo "⚡ Update your .env file:"
echo "   DB_NAME=${DB_NAME}"
echo "   DB_USER=${DB_USER}"
echo "   DB_PASSWORD=${DB_PASS}"
