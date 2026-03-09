# Docker Quick Start Guide

Get your Qaras Hotel Management System running in Docker in 5 minutes!

## Prerequisites

1. **Docker Desktop** installed and running
   - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Mac: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: Install Docker Engine

2. **Environment Configuration**
   - Copy `.env.docker.example` to `.env`
   - Update database credentials and other settings

## Quick Deploy

### Option 1: Using Deployment Script (Recommended)

**Windows (PowerShell):**
```powershell
.\docker-deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### Option 2: Manual Commands

**Step 1: Build the image**
```bash
docker build -t qaras-hotel:latest .
```

**Step 2: Run the container**
```bash
docker run -d \
  --name qaras-hotel \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  qaras-hotel:latest
```

**Step 3: Check status**
```bash
docker ps
docker logs -f qaras-hotel
```

## Access Your Application

Once the container is running, access your application at:
- **Local:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## Common Commands

```bash
# View logs
docker logs -f qaras-hotel

# Stop container
docker stop qaras-hotel

# Start container
docker start qaras-hotel

# Restart container
docker restart qaras-hotel

# Remove container
docker rm -f qaras-hotel

# View container stats
docker stats qaras-hotel

# Execute command in container
docker exec -it qaras-hotel sh
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs qaras-hotel

# Check if port 3000 is already in use
# Windows:
netstat -ano | findstr :3000
# Linux/Mac:
lsof -i :3000
```

### Database connection issues
1. Verify `.env` file has correct database credentials
2. Ensure database is accessible from Docker container
3. Check database host (use `host.docker.internal` for local databases on Windows/Mac)

### Build fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t qaras-hotel:latest .
```

### Application not responding
```bash
# Wait 15-20 seconds after starting (Next.js needs time to initialize)
# Check health endpoint
curl http://localhost:3000/api/health

# If still not working, check logs
docker logs -f qaras-hotel
```

## Environment Variables

Key environment variables to configure in `.env`:

```env
# Database
DATABASE_HOST=your_database_host
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=your_database_name
DATABASE_URL=mysql://user:password@host:3306/database

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_minimum_32_characters

# Node Environment
NODE_ENV=production
```

## Production Deployment

For production deployment to cloud providers, see [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides on:
- Google Cloud Run
- AWS ECS/Fargate
- Render.com
- DigitalOcean
- Railway.app

## Docker Compose (Alternative)

If you prefer Docker Compose:

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

## Performance Tips

1. **Memory:** Container uses ~512MB-1GB RAM
2. **CPU:** Allocate at least 1 CPU core
3. **Storage:** Image size is ~5.2GB
4. **Startup Time:** Allow 15-20 seconds for full initialization

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database and NEXTAUTH_SECRET
- Keep Docker and dependencies updated
- Run security scans: `docker scan qaras-hotel:latest`

## Support

If you encounter issues:
1. Check the logs: `docker logs -f qaras-hotel`
2. Review environment variables in `.env`
3. Verify database connectivity
4. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting

## Next Steps

After successful deployment:
1. Access the application at http://localhost:3000
2. Complete initial setup/configuration
3. Test all features
4. Configure backups
5. Set up monitoring
6. Deploy to production (see DEPLOYMENT.md)

---

**Built with:** Next.js 14, Docker, Node.js 20
**Image Size:** ~5.2GB
**Build Time:** ~3-5 minutes
**Startup Time:** ~15-20 seconds
