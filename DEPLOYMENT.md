# Docker Deployment Guide

This guide covers deploying the Qaras Hotels application using Docker to various hosting providers.

## Prerequisites

- Docker installed locally
- Docker Hub or Container Registry account
- Environment variables configured

## Local Development with Docker

### Build the Docker image:
```bash
docker build -t qaras-hotels .
```

### Run the container locally:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your_secret" \
  qaras-hotels
```

### Using Docker Compose:
```bash
# Create .env file with your environment variables
cp .env.example .env

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Deployment Options

### 1. Render.com Deployment

Render automatically detects the `render.yaml` file.

**Steps:**
1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically use the `render.yaml` configuration
4. Set environment variables in Render dashboard
5. Deploy!

**Environment Variables to Set:**
- `DATABASE_URL`
- `DATABASE_HOST`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `NEXTAUTH_URL` (your Render URL)
- `NEXTAUTH_SECRET` (auto-generated or custom)

### 2. Google Cloud Run Deployment

**Prerequisites:**
- Google Cloud SDK installed
- Project created in Google Cloud Console
- Billing enabled

**Steps:**

1. **Authenticate with Google Cloud:**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Enable required APIs:**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

3. **Build and deploy using Cloud Build:**
```bash
gcloud builds submit --config cloudbuild.yaml
```

4. **Or deploy manually:**
```bash
# Build the image
docker build -t gcr.io/YOUR_PROJECT_ID/qaras-hotels .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/qaras-hotels

# Deploy to Cloud Run
gcloud run deploy qaras-hotels \
  --image gcr.io/YOUR_PROJECT_ID/qaras-hotels \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --set-env-vars DATABASE_URL="your_db_url",NEXTAUTH_URL="your_url",NEXTAUTH_SECRET="your_secret"
```

5. **Set environment variables:**
```bash
gcloud run services update qaras-hotels \
  --set-env-vars DATABASE_URL="your_db_url" \
  --set-env-vars NEXTAUTH_URL="your_cloud_run_url" \
  --set-env-vars NEXTAUTH_SECRET="your_secret"
```

### 3. AWS ECS/Fargate Deployment

**Steps:**

1. **Create ECR repository:**
```bash
aws ecr create-repository --repository-name qaras-hotels
```

2. **Authenticate Docker to ECR:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

3. **Build and push:**
```bash
docker build -t qaras-hotels .
docker tag qaras-hotels:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/qaras-hotels:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/qaras-hotels:latest
```

4. **Create ECS task definition and service** (use AWS Console or CLI)

### 4. DigitalOcean App Platform

**Steps:**
1. Push code to GitHub
2. Create new app in DigitalOcean
3. Select "Docker" as the source
4. Configure environment variables
5. Deploy

### 5. Railway.app Deployment

**Steps:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`
5. Set environment variables: `railway variables set KEY=value`

## Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database
DATABASE_HOST=your_host
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret_key_min_32_chars

# Email (if using)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password

# Payment Gateways (if using)
PAYSTACK_SECRET_KEY=your_key
FLUTTERWAVE_SECRET_KEY=your_key

# Other
NODE_ENV=production
```

## Health Checks

The application includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

## Monitoring

### View logs:
```bash
# Docker
docker logs -f container_id

# Cloud Run
gcloud run services logs read qaras-hotels --limit 50

# Render
# Use Render dashboard
```

## Scaling

### Cloud Run:
```bash
gcloud run services update qaras-hotels \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 2 \
  --memory 1Gi
```

### Render:
- Upgrade plan in dashboard for more resources
- Enable auto-scaling

## Troubleshooting

### Container won't start:
1. Check logs: `docker logs container_id`
2. Verify environment variables are set
3. Ensure database is accessible
4. Check port 3000 is not in use

### Database connection issues:
1. Verify DATABASE_URL format
2. Check firewall rules
3. Ensure database accepts connections from container IP

### Build failures:
1. Clear Docker cache: `docker system prune -a`
2. Check Dockerfile syntax
3. Verify all dependencies in package.json

## Security Best Practices

1. Never commit `.env` files
2. Use secrets management (Cloud Secret Manager, AWS Secrets Manager)
3. Enable HTTPS/SSL
4. Set up proper CORS policies
5. Use non-root user in container (already configured)
6. Regularly update dependencies
7. Scan images for vulnerabilities: `docker scan qaras-hotels`

## Performance Optimization

1. Use CDN for static assets
2. Enable caching headers
3. Optimize images
4. Use connection pooling for database
5. Monitor memory usage and adjust container resources

## Backup and Recovery

1. Regular database backups
2. Store environment variables securely
3. Version control all configuration files
4. Document deployment procedures
5. Test disaster recovery procedures

## Support

For issues or questions:
- Check logs first
- Review environment variables
- Verify database connectivity
- Contact hosting provider support if needed
