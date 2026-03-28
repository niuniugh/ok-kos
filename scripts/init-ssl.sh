#!/bin/sh
# Initial SSL setup for okkos.web.id
# Run this ONCE on the VPS after DNS is pointing to the server.

set -e

DOMAIN="okkos.web.id"
EMAIL="${1:?Usage: ./scripts/init-ssl.sh your@email.com}"

echo "=== Step 1: Use HTTP-only nginx config ==="
cp nginx/conf.d/app.conf.init nginx/conf.d/app.conf

echo "=== Step 2: Start nginx + app ==="
sudo docker compose up -d nginx

echo "=== Step 3: Request SSL certificate ==="
sudo docker compose run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email

echo "=== Step 4: Switch to HTTPS nginx config ==="
cat > nginx/conf.d/app.conf << 'NGINX'
server {
    listen 80;
    server_name okkos.web.id www.okkos.web.id;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name okkos.web.id www.okkos.web.id;

    ssl_certificate /etc/letsencrypt/live/okkos.web.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/okkos.web.id/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

echo "=== Step 5: Reload nginx with HTTPS ==="
sudo docker compose exec nginx nginx -s reload

echo ""
echo "Done! Your site is now live at https://$DOMAIN"
echo ""
echo "To auto-renew certificates, add this cron job:"
echo "  0 3 * * * cd $(pwd) && sudo docker compose run --rm certbot renew && sudo docker compose exec nginx nginx -s reload"
