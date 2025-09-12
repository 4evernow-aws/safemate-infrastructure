# SafeMate Static Hosting Deployment Script
# This script builds and deploys the React app to S3 static hosting

Write-Host "Starting SafeMate static deployment..." -ForegroundColor Green

# Navigate to the React app directory
Set-Location "apps/web/safemate"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the React app
Write-Host "Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Upload to S3
Write-Host "Uploading to S3..." -ForegroundColor Yellow
aws s3 sync dist/ s3://default-safemate-static-hosting --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 upload failed!" -ForegroundColor Red
    exit 1
}

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id E3U5WV0TJVXFOT --paths "/*"

if ($LASTEXITCODE -ne 0) {
    Write-Host "CloudFront invalidation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your app is available at: https://d19a5c2wn4mtdt.cloudfront.net" -ForegroundColor Cyan
Write-Host "S3 website URL: http://default-safemate-static-hosting.s3-website-ap-southeast-2.amazonaws.com" -ForegroundColor Cyan

# Return to original directory
Set-Location "../../.." 