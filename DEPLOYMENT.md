# Deployment Guide

This guide covers deploying the Qaras Hotel Management System to production using Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- MySQL database (or use the included Docker Compose setup)
- Domain name (optional, for production)
- SSL certificate (recommended for production)

## Quick Start with Docker Compose

The easiest way to deploy is using Docker Compose, which sets up both the application and database:

### 1. Build the Docker Image

```bash
docker build -t qaras-hotel:latest .
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password
DATABASE_NAME=qaras_hotel
DATABASE_USER=qaras_user
DATABASE_PASSWORD=your_secure_password

# NextAuth Configuration (REQUIRED)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_secret_key_minimum_32_characters_long_random_string

# Application URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com

# Payment Gateway Configuration (Optional)
PAYSTACK_SECRET_KEY=sk_live_your_paystack_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_flutterwave_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_flutterwave_key
```

### 3. Start the Services

```bash
docker-compose up -d
```

This will:
- Start a MySQL 8.0 database container
- Initialize the database with the schema from `qaras_combined.sql`
- Start the Next.js application container
- Set up health checks for both services

### 4. Verify Deployment

Check if services are running:

```bash
docker-compose ps
```

View application logs:

```bash
docker-compose logs -f app
```

Access the application at `http://localhost:3000`

### 5. Stop the Services

```bash
docker-compose down
```

To also remove the database volume:

```bash
docker-compose down -v
```

## Manual Docker Deployment

If you prefer to manage the database separately:

### 1. Build the Image

```bash
docker build -t qaras-hotel:latest .
```

### 2. Run the Container

```bash
docker run -d \
  --name qaras-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mysql://user:password@host:3306/database" \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  -e NEXTAUTH_SECRET="your_secret_key" \
  --restart unless-stopped \
  qaras-hotel:latest
```

## Deployment to Cloud Platforms

### Google Cloud Run

1. Build and push to Google Container Registry:

```bash
gcloud builds submit --config cloudbuild.yaml
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy qaras-hotel \
  --image gcr.io/YOUR_PROJECT_ID/qaras-hotel \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=mysql://..." \
  --set-secrets="NEXTAUTH_SECRET=nextauth-secret:latest"
```

### Render.com

1. Push your code to GitHub

2. Create a new Web Service on Render:
   - Connect your GitHub repository
   - Select "Docker" as the environment
   - Set environment variables in the Render dashboard
   - Deploy

3. Add a MySQL database:
   - Create a new PostgreSQL or MySQL database on Render
   - Update the `DATABASE_URL` environment variable

### AWS ECS/Fargate

1. Push image to ECR:

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
docker tag qaras-hotel:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/qaras-hotel:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/qaras-hotel:latest
```

2. Create an ECS task definition and service using the AWS Console or CLI

### DigitalOcean App Platform

1. Push your code to GitHub

2. Create a new App:
   - Connect your GitHub repository
   - Select "Dockerfile" as the build method
   - Configure environment variables
   - Add a managed MySQL database
   - Deploy

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `DATABASE_URL` | Full database connection string | `mysql://user:pass@host:3306/db` |
| `NEXTAUTH_URL` | Public URL of your application | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Secret for NextAuth (min 32 chars) | Generate with `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | Database host | `localhost` |
| `DATABASE_PORT` | Database port | `3306` |
| `DATABASE_USER` | Database username | - |
| `DATABASE_PASSWORD` | Database password | - |
| `DATABASE_NAME` | Database name | - |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `SMTP_FROM` | From email address | - |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | - |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | - |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key | - |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key | - |

## Database Setup

### Using Docker Compose (Recommended)

The included `docker-compose.yml` automatically sets up MySQL and initializes the schema.

### Manual Setup

1. Create a MySQL database:

```sql
CREATE DATABASE qaras_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qaras_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON qaras_hotel.* TO 'qaras_user'@'%';
FLUSH PRIVILEGES;
```

2. Import the schema:

```bash
mysql -u qaras_user -p qaras_hotel < qaras_combined.sql
```

## Health Checks

The application exposes a health check endpoint at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Monitoring and Logs

### View Docker Logs

```bash
# All services
docker-compose logs -f

# Application only
docker-compose logs -f app

# Database only
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 app
```

### Container Stats

```bash
docker stats qaras-app qaras-mysql
```

## Scaling

### Horizontal Scaling

To run multiple application instances behind a load balancer:

```bash
docker-compose up -d --scale app=3
```

Note: You'll need to configure a load balancer (nginx, HAProxy, etc.) to distribute traffic.

### Vertical Scaling

Adjust resource limits in `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Backup and Restore

### Database Backup

```bash
docker exec qaras-mysql mysqldump -u root -p qaras_hotel > backup_$(date +%Y%m%d).sql
```

### Database Restore

```bash
docker exec -i qaras-mysql mysql -u root -p qaras_hotel < backup_20240101.sql
```

### Volume Backup

```bash
docker run --rm -v qaras_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

## Troubleshooting

### Application Won't Start

1. Check logs:
```bash
docker-compose logs app
```

2. Verify environment variables:
```bash
docker-compose config
```

3. Check database connection:
```bash
docker-compose exec app wget -O- http://localhost:3000/api/health
```

### Database Connection Issues

1. Verify database is running:
```bash
docker-compose ps db
```

2. Test database connection:
```bash
docker-compose exec db mysql -u qaras_user -p -e "SELECT 1"
```

3. Check network connectivity:
```bash
docker-compose exec app ping db
```

### Build Warnings

The build may show warnings about missing `formatDate` and `cn` utility functions. These are non-critical and the application will still function correctly.

### Permission Issues

If you encounter permission errors:

```bash
docker-compose exec app chown -R nextjs:nodejs /app
```

## Security Considerations

1. **Use Strong Secrets**: Generate secure random strings for `NEXTAUTH_SECRET` and database passwords
2. **Enable HTTPS**: Use a reverse proxy (nginx, Caddy) with SSL certificates
3. **Firewall Rules**: Restrict database access to application containers only
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **Environment Variables**: Never commit `.env` files to version control
6. **Database Backups**: Set up automated daily backups
7. **Monitoring**: Implement logging and monitoring solutions

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `NEXTAUTH_SECRET`
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper database credentials
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Configure firewall rules
- [ ] Test health check endpoints
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and DNS
- [ ] Test payment gateway integration
- [ ] Configure email service
- [ ] Set up error tracking (Sentry, etc.)

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f`
- Review environment variables: `docker-compose config`
- Verify health checks: `curl http://localhost:3000/api/health`
