# UniOne Node.js - Production Deployment Guide

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- At least 2GB RAM
- PostgreSQL 16+ and Redis 7+ (or use Docker services)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your production values
nano .env
```

**Required Environment Variables:**
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=unione_production
DB_USER=unione
DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# JWT
JWT_SECRET=CHANGE_ME_SECURE_JWT_SECRET

# Sentry (optional)
SENTRY_DSN=https://your-sentry-dsn

# Email (optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
```

### 2. Start Services

```bash
# Start all services (PostgreSQL, Redis, API, Worker)
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
```

### 3. Run Migrations

```bash
# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npx knex migrate:latest

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec api npm run seed
```

### 4. Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {
#   "status": "healthy",
#   "services": {
#     "database": { "status": "healthy" },
#     "redis": { "status": "healthy" },
#     ...
#   }
# }
```

---

## 📦 Deployment Options

### Option A: Docker Compose (Recommended)

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# With Nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile nginx up -d

# With automated backups
docker-compose -f docker-compose.prod.yml --profile backup up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

### Option B: PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs unione-api
pm2 logs unione-worker

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### Option C: Systemd (Linux)

```bash
# Create service file
sudo nano /etc/systemd/system/unione-api.service

[Unit]
Description=UniOne Node.js API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/unione_node
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable unione-api
sudo systemctl start unione-api
sudo systemctl status unione-api
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Set strong `JWT_SECRET` (at least 32 characters)
- [ ] Configure `SENTRY_DSN` for error tracking
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up firewall rules (only allow 80, 443, 5432)
- [ ] Regular security updates
- [ ] Enable Docker secrets for sensitive data
- [ ] Set up database backups
- [ ] Monitor logs for suspicious activity

---

## 📊 Monitoring

### Health Check Endpoint

```bash
# Public health check
curl http://localhost:3000/health

# Detailed health check (admin only)
curl http://localhost:3000/api/v1/admin/monitoring/health \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Log Files

```bash
# View application logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# View error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# View PM2 logs
pm2 logs unione-api
pm2 logs unione-worker
```

### Metrics

```bash
# Get system metrics
curl http://localhost:3000/api/v1/admin/monitoring/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 💾 Backup & Restore

### Database Backup

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U unione unione_production > backup.sql

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U unione unione_production < backup.sql
```

### Automated Backups

The backup service runs daily and retains backups for 7 days:

```bash
# Start backup service
docker-compose -f docker-compose.prod.yml --profile backup up -d

# View backups
ls -la backups/
```

---

## 🔄 Zero-Downtime Deployment

```bash
# Build new image
docker-compose -f docker-compose.prod.yml build

# Rolling update
docker-compose -f docker-compose.prod.yml up -d --no-deps api

# Verify new deployment
curl http://localhost:3000/health

# Rollback if needed
docker-compose -f docker-compose.prod.yml up -d --no-deps api
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api

# Verify environment
docker-compose -f docker-compose.prod.yml exec api env

# Check database connection
docker-compose -f docker-compose.prod.yml exec api npx knex migrate:status
```

### High Memory Usage

```bash
# Check memory
docker stats

# Restart service
docker-compose -f docker-compose.prod.yml restart api

# Increase memory limit in docker-compose.prod.yml
```

### Database Connection Issues

```bash
# Test database connectivity
docker-compose -f docker-compose.prod.yml exec api node -e "require('./src/config/knex').default.raw('SELECT 1').then(console.log)"

# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres
```

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale API instances
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale worker=4
```

### Resource Limits

Edit `docker-compose.prod.yml` to adjust resource limits:

```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '2.0'
```

---

**Last Updated**: April 12, 2026  
**Maintained By**: UniOne Development Team
