# SafeMate Preprod Static Hosting Deployment Script
# This script builds and deploys the React app to preprod S3 static hosting

Write-Host "🚀 Starting SafeMate preprod static deployment..." -ForegroundColor Green

# Navigate to the React app directory
Set-Location "apps/web/safemate"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the React app
Write-Host "🔨 Building React app for preprod..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Upload to preprod S3 bucket
Write-Host "☁️ Uploading to preprod S3..." -ForegroundColor Yellow
aws s3 sync dist/ s3://preprod-safemate-static-hosting --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 upload failed!" -ForegroundColor Red
    exit 1
}

# Invalidate CloudFront cache (if you have preprod CloudFront)
# Uncomment and update the distribution ID if you have CloudFront for preprod
# Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Yellow
# aws cloudfront create-invalidation --distribution-id YOUR_PREPROD_DISTRIBUTION_ID --paths "/*"

Write-Host "✅ Preprod deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your preprod app is available at: http://preprod-safemate-static-hosting.s3-website-ap-southeast-2.amazonaws.com" -ForegroundColor Cyan

# Return to original directory
Set-Location "../../.."
