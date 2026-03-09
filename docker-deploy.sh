#!/bin/bash

# Qaras Hotel Docker Deployment Script
# This script helps you build and deploy the Docker container

set -e

echo "🏨 Qaras Hotel Management System - Docker Deployment"
echo "=================================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.docker.example..."
    if [ -f .env.docker.example ]; then
        cp .env.docker.example .env
        echo "✅ .env file created. Please edit it with your configuration."
        echo "   Then run this script again."
        exit 0
    else
        echo "❌ .env.docker.example not found. Please create .env manually."
        exit 1
    fi
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t qaras-hotel:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    
    # Check if container is already running
    if docker ps -a | grep -q qaras-hotel; then
        echo "🔄 Stopping and removing existing container..."
        docker stop qaras-hotel 2>/dev/null || true
        docker rm qaras-hotel 2>/dev/null || true
    fi
    
    # Run the container
    echo "🚀 Starting container..."
    docker run -d \
        --name qaras-hotel \
        -p 3000:3000 \
        --env-file .env \
        --restart unless-stopped \
        qaras-hotel:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo ""
        echo "📊 Container Status:"
        docker ps | grep qaras-hotel
        echo ""
        echo "🌐 Application should be available at: http://localhost:3000"
        echo ""
        echo "📝 Useful commands:"
        echo "   View logs:    docker logs -f qaras-hotel"
        echo "   Stop:         docker stop qaras-hotel"
        echo "   Restart:      docker restart qaras-hotel"
        echo "   Remove:       docker rm -f qaras-hotel"
        echo ""
        echo "⏳ Waiting for application to start (this may take 10-15 seconds)..."
        sleep 15
        
        # Check health
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            echo "✅ Application is healthy and responding!"
        else
            echo "⚠️  Application may still be starting. Check logs with: docker logs -f qaras-hotel"
        fi
    else
        echo "❌ Failed to start container"
        exit 1
    fi
else
    echo "❌ Failed to build Docker image"
    exit 1
fi
