#!/bin/bash
# SkyPay / Nitrogen Store — VPS Deployment Script
# Run this on the VPS as root: bash deploy.sh
set -e

echo "=== Nitrogen Store Deployment ==="

# 1. Install dependencies (skip if already installed)
if ! command -v node &> /dev/null; then
  echo "→ Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
  echo "→ Installing PM2..."
  npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
  echo "→ Installing Nginx..."
  apt-get install -y nginx
fi

if ! command -v certbot &> /dev/null; then
  echo "→ Installing Certbot..."
  apt-get install -y certbot python3-certbot-nginx
fi

# 2. Create app directory
mkdir -p /var/www/nitrogenstore
cd /var/www/nitrogenstore

# 3. If this is a fresh deploy, clone the project
# (if already there, we assume files were uploaded via scp/rsync)
echo "→ Installing backend dependencies..."
cd /var/www/nitrogenstore/backend
npm install --production

echo "→ Installing frontend dependencies and building..."
cd /var/www/nitrogenstore/frontend
npm install
npm run build

# 4. Set up Nginx configs
echo "→ Configuring Nginx..."
cp /var/www/nitrogenstore/nginx.nitrogenstore.in.conf /etc/nginx/sites-available/nitrogenstore.in
cp /var/www/nitrogenstore/nginx.nitrogenstore.cloud.conf /etc/nginx/sites-available/nitrogenstore.cloud
ln -sf /etc/nginx/sites-available/nitrogenstore.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/nitrogenstore.cloud /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
echo "✓ Nginx configured"

# 5. Start/restart backend with PM2
echo "→ Starting backend..."
cd /var/www/nitrogenstore/backend
pm2 delete nitrogenstore 2>/dev/null || true
pm2 start server.js --name nitrogenstore --env production
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || true
echo "✓ Backend running with PM2"

echo ""
echo "=== Next: Get SSL certificates ==="
echo "Run: certbot --nginx -d nitrogenstore.in -d www.nitrogenstore.in"
echo "Run: certbot --nginx -d nitrogenstore.cloud -d www.nitrogenstore.cloud"
