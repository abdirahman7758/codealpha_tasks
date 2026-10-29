# Velarina Custom Domain Setup Guide

This guide details the procedure for binding your custom domain (e.g., `velarina.com` and `www.velarina.com`) to the Velarina application.

## 1. Domain Registration and DNS Records

Configure the following records with your domain registrar (e.g., Cloudflare, Namecheap, Google Domains / Squarespace):

| Type  | Host / Name | Target / Value            | TTL  | Purpose                    |
|-------|-------------|---------------------------|------|----------------------------|
| A     | `@`         | `YOUR_SERVER_PUBLIC_IP`   | Auto | Directs apex domain to host |
| CNAME | `www`       | `velarina.com`            | Auto | Directs www subdomain to apex|

If using platforms like Vercel, Render, or Railway:
- In the platform dashboard: Navigate to **Settings > Custom Domains**.
- Add `velarina.com` and `www.velarina.com`.
- Follow the provided CNAME or ALIAS records.

## 2. Environment Configuration

Add the canonical domain to your `.env` file:

```env
PORT=3000
CUSTOM_DOMAIN=velarina.com
NODE_ENV=production
```

The Express server includes canonical host middleware to redirect incoming HTTP requests to HTTPS and canonicalize traffic to the primary domain.

## 3. Reverse Proxy Configuration (Nginx Example)

When deploying on an Ubuntu/Debian Linux VPS:

```nginx
server {
    listen 80;
    server_name velarina.com www.velarina.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name velarina.com www.velarina.com;

    ssl_certificate /etc/letsencrypt/live/velarina.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/velarina.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 4. SSL / TLS Certificate (Let's Encrypt Certbot)

Run the following command on your server to generate free, auto-renewing SSL certificates:

```bash
sudo certbot --nginx -d velarina.com -d www.velarina.com
```

Once executed, verify your domain by opening `https://velarina.com` in your browser.

