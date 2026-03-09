# Qaras Hotel Docker Deployment Script (PowerShell)
# This script helps you build and deploy the Docker container

$ErrorActionPreference = "Stop"

Write-Host "🏨 Qaras Hotel Management System - Docker Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
} catch {
    Write-Host "❌ Docker is not installed or not running. Please install/start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    if (Test-Path .env.docker.example) {
        Write-Host "Creating .env from .env.docker.example..." -ForegroundColor Yellow
        Copy-Item .env.docker.example .env
        Write-Host "✅ .env file created. Please edit it with your configuration." -ForegroundColor Green
        Write-Host "   Then run this script again." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "❌ .env.docker.example not found. Please create .env manually." -ForegroundColor Red
        exit 1
    }
}

# Build the Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
docker build -t qaras-hotel:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Check if container is already running
    $existingContainer = docker ps -a --filter "name=qaras-hotel" --format "{{.Names}}"
    if ($existingContainer) {
        Write-Host "🔄 Stopping and removing existing container..." -ForegroundColor Yellow
        docker stop qaras-hotel 2>$null
        docker rm qaras-hotel 2>$null
    }
    
    # Run the container
    Write-Host "🚀 Starting container..." -ForegroundColor Cyan
    docker run -d `
        --name qaras-hotel `
        -p 3000:3000 `
        --env-file .env `
        --restart unless-stopped `
        qaras-hotel:latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Container started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Container Status:" -ForegroundColor Cyan
        docker ps --filter "name=qaras-hotel"
        Write-Host ""
        Write-Host "🌐 Application should be available at: http://localhost:3000" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Useful commands:" -ForegroundColor Cyan
        Write-Host "   View logs:    docker logs -f qaras-hotel"
        Write-Host "   Stop:         docker stop qaras-hotel"
        Write-Host "   Restart:      docker restart qaras-hotel"
        Write-Host "   Remove:       docker rm -f qaras-hotel"
        Write-Host ""
        Write-Host "⏳ Waiting for application to start (this may take 10-15 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        
        # Check health
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Application is healthy and responding!" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  Application may still be starting. Check logs with: docker logs -f qaras-hotel" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to start container" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}
