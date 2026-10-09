#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  DV CARD — VPS deploy script
#  Run once manually on first setup, then `git pull && bash deploy.sh`
#  for every future update.
# ─────────────────────────────────────────────────────────────
set -e

APP_DIR="/var/www/dvcard"

echo "==> Pulling latest code..."
cd "$APP_DIR"
git pull origin master

echo "==> Installing dependencies..."
npm install --omit=dev

echo "==> Building app..."
npm run build

echo "==> Restarting PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ Deployed! App running at https://card.tzmicha.com"
