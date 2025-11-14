#!/bin/bash
set -e

echo "🧰 Installing base dependencies..."
apt update -y
apt install -y nginx ufw unzip openjdk-17-jre rsync certbot python3-certbot-nginx

ufw allow OpenSSH
ufw allow 80
ufw allow 8080
ufw allow 8443
ufw allow 443
ufw allow 9933/tcp # SmartFox default port
ufw --force enable


tar xf SFS2X.tar.gz
