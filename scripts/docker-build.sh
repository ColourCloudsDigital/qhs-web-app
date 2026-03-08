#!/bin/bash

# Docker build script for Qaras Hotels

set -e

echo "🐳 Building Docker image for Qaras Hotels..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
IMAGE_NAME="qaras-hotels"

echo "📦 Version: $VERSION"

# Build the image
docker build -t $IMAGE_NAME:latest -t $IMAGE_NAME:$VERSION .

echo "✅ Build complete!"
echo ""
echo "To run the container:"
echo "  docker run -p 3000:3000 --env-file .env $IMAGE_NAME:latest"
echo ""
echo "To push to registry:"
echo "  docker tag $IMAGE_NAME:latest your-registry/$IMAGE_NAME:$VERSION"
echo "  docker push your-registry/$IMAGE_NAME:$VERSION"
