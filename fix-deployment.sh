#!/bin/bash

echo "🔧 Fixing deployment issues..."

# Step 1: Check if we need to switch to CommonJS
echo "📋 Checking module configuration..."

if [ "$1" = "commonjs" ]; then
    echo "🔄 Switching to CommonJS configuration..."
    
    # Backup current files
    cp package.json package-esm.json.bak
    cp server.js server-esm.js.bak
    
    # Use CommonJS versions
    cp package-commonjs.json package.json
    cp server-commonjs.js server.js
    
    echo "✅ Switched to CommonJS configuration"
else
    echo "📦 Using ES Modules configuration (default)"
fi

# Step 2: Clean and reinstall dependencies
echo "🧹 Cleaning dependencies..."
rm -rf node_modules package-lock.json .next

echo "📥 Installing dependencies..."
npm install

# Step 3: Verify UI components
echo "🔍 Verifying UI components..."
if [ ! -d "components/ui" ]; then
    echo "❌ UI components directory missing!"
    exit 1
fi

if [ ! -f "components/ui/index.ts" ]; then
    echo "❌ UI components index file missing!"
    exit 1
fi

echo "✅ UI components verified"

# Step 4: Run build
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Ready for deployment!"
    echo "You can now:"
    echo "1. Commit and push to Git"
    echo "2. Deploy to your hosting platform"
    echo "3. Start the server with: npm start"
else
    echo "❌ Build failed!"
    echo ""
    echo "🔧 Troubleshooting options:"
    echo "1. Try CommonJS mode: ./fix-deployment.sh commonjs"
    echo "2. Check the error messages above"
    echo "3. Verify all required files are present"
    exit 1
fi