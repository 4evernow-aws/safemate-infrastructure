#!/bin/bash

# SafeMate Production Build Script
# This script builds the frontend for production deployment to CloudFront

echo "🚀 Building SafeMate for Production..."

# Set production environment
export NODE_ENV=production

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Production build completed successfully!"
    echo "📁 Build output: dist/"
    echo "🌐 Ready for deployment to: https://d19a5c2wn4mtdt.cloudfront.net/"
    
    # Show build size
    echo "📊 Build size:"
    du -sh dist/
else
    echo "❌ Build failed!"
    exit 1
fi
