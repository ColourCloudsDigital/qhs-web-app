#!/bin/bash

# Docker run script for local testing

set -e

IMAGE_NAME="qaras-hotels"

echo "🚀 Starting Qaras Hospitality Solutions container..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with required environment variables."
    exit 1
fi

# Stop and remove existing container if running
docker stop $IMAGE_NAME 2>/dev/null || true
docker rm $IMAGE_NAME 2>/dev/null || true

# Run the container
docker run -d \
  --name $IMAGE_NAME \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  $IMAGE_NAME:latest

echo "✅ Container started successfully!"
echo ""
echo "📊 Container status:"
docker ps | grep $IMAGE_NAME

echo ""
echo "🌐 Application available at: http://localhost:3000"
echo ""
echo "📝 View logs:"
echo "  docker logs -f $IMAGE_NAME"
echo ""
echo "🛑 Stop container:"
echo "  docker stop $IMAGE_NAME"
