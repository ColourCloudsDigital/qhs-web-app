#!/bin/bash

# Hostinger Deployment Script
# This script helps deploy the Next.js application to Hostinger

set -e  # Exit on any error

# Configuration
HOSTINGER_IP="89.117.229.102"
HOSTINGER_PORT="65002"
HOSTINGER_USER="u121926825"
HOSTINGER_PATH="public_html"

echo "🚀 Starting Hostinger Deployment Process..."

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
tar -czf qh-app-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=*.log \
  --exclude=.DS_Store \
  --exclude=__MACOSX \
  --exclude=qhs-*.zip \
  --exclude=*.sql \
  .

echo "✅ Deployment package created: qh-app-deploy.tar.gz"

# Step 2: Upload to server
echo "📤 Uploading to Hostinger server..."
scp -P $HOSTINGER_PORT qh-app-deploy.tar.gz $HOSTINGER_USER@$HOSTINGER_IP:~/$HOSTINGER_PATH/

echo "✅ Upload completed"

# Step 3: Deploy on server
echo "🔧 Deploying on server..."
ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_IP << 'ENDSSH'
cd public_html

# Backup existing files if any
if [ -f package.json ]; then
    echo "📋 Backing up existing files..."
    mkdir -p backup-$(date +%Y%m%d-%H%M%S)
    mv * backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
fi

# Extract new files
echo "📂 Extracting deployment package..."
tar -xzf qh-app-deploy.tar.gz
rm qh-app-deploy.tar.gz

# Install dependencies
echo "📥 Installing dependencies..."
npm install --production

# Build application
echo "🔨 Building application..."
npm run build

echo "✅ Deployment completed successfully!"
echo "🌐 You can now start the server with: npm start"
ENDSSH

# Cleanup local deployment package
rm qh-app-deploy.tar.gz

echo "🎉 Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. SSH into your server: ssh -p $HOSTINGER_PORT $HOSTINGER_USER@$HOSTINGER_IP"
echo "2. Navigate to public_html: cd public_html"
echo "3. Start the server: npm start"
echo ""
echo "Your application should be accessible at your domain once started."