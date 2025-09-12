# SafeMate CloudFront and S3 Configuration Fix Script
# This script fixes the CloudFront distribution to properly work with S3 website hosting

Write-Host "Starting CloudFront and S3 configuration fix..." -ForegroundColor Green

# Step 1: Verify S3 bucket exists and is configured for website hosting
Write-Host "Step 1: Checking S3 bucket configuration..." -ForegroundColor Yellow

try {
    $bucketExists = aws s3api head-bucket --bucket default-safemate-static-hosting 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "S3 bucket exists" -ForegroundColor Green
    } else {
        Write-Host "S3 bucket does not exist or is not accessible" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error checking S3 bucket: $_" -ForegroundColor Red
}

# Step 2: Configure S3 bucket for website hosting
Write-Host "Step 2: Configuring S3 bucket for website hosting..." -ForegroundColor Yellow

$websiteConfig = @{
    IndexDocument = @{Suffix = "index.html"}
    ErrorDocument = @{Key = "index.html"}
} | ConvertTo-Json

try {
    aws s3api put-bucket-website --bucket default-safemate-static-hosting --website-configuration $websiteConfig
    if ($LASTEXITCODE -eq 0) {
        Write-Host "S3 website configuration updated" -ForegroundColor Green
    } else {
        Write-Host "Failed to update S3 website configuration" -ForegroundColor Red
    }
} catch {
    Write-Host "Error configuring S3 website: $_" -ForegroundColor Red
}

# Step 3: Set S3 bucket policy for public read access
Write-Host "Step 3: Setting S3 bucket policy..." -ForegroundColor Yellow

$bucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::default-safemate-static-hosting/*"
        }
    )
} | ConvertTo-Json

try {
    aws s3api put-bucket-policy --bucket default-safemate-static-hosting --policy $bucketPolicy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "S3 bucket policy updated" -ForegroundColor Green
    } else {
        Write-Host "Failed to update S3 bucket policy" -ForegroundColor Red
    }
} catch {
    Write-Host "Error setting bucket policy: $_" -ForegroundColor Red
}

# Step 4: Get current CloudFront distribution configuration
Write-Host "Step 4: Getting current CloudFront configuration..." -ForegroundColor Yellow

try {
    aws cloudfront get-distribution-config --id EBZOQYI8VCOCW --output json > current-cloudfront-config.json
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Current CloudFront configuration retrieved" -ForegroundColor Green
    } else {
        Write-Host "Failed to get CloudFront configuration" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error getting CloudFront configuration: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Update CloudFront configuration with corrected settings
Write-Host "Step 5: Updating CloudFront configuration..." -ForegroundColor Yellow

try {
    # Use the corrected configuration
    aws cloudfront update-distribution --id EBZOQYI8VCOCW --distribution-config file://corrected-cloudfront-config.json --if-match $(aws cloudfront get-distribution-config --id EBZOQYI8VCOCW --query 'ETag' --output text)
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CloudFront configuration updated successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to update CloudFront configuration" -ForegroundColor Red
    }
} catch {
    Write-Host "Error updating CloudFront: $_" -ForegroundColor Red
}

# Step 6: Wait for CloudFront deployment
Write-Host "Step 6: Waiting for CloudFront deployment..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes..." -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0

do {
    Start-Sleep -Seconds 20
    $attempt++
    
    try {
        $status = aws cloudfront get-distribution --id EBZOQYI8VCOCW --query 'Distribution.Status' --output text
        Write-Host "Attempt $attempt/$maxAttempts - Status: $status" -ForegroundColor Yellow
        
        if ($status -eq "Deployed") {
            Write-Host "CloudFront deployment completed!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "Error checking deployment status: $_" -ForegroundColor Red
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "Deployment timeout - please check manually" -ForegroundColor Red
}

# Step 7: Invalidate CloudFront cache
Write-Host "Step 7: Invalidating CloudFront cache..." -ForegroundColor Yellow

try {
    aws cloudfront create-invalidation --distribution-id EBZOQYI8VCOCW --paths "/*"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CloudFront cache invalidation initiated" -ForegroundColor Green
    } else {
        Write-Host "Failed to invalidate CloudFront cache" -ForegroundColor Red
    }
} catch {
    Write-Host "Error invalidating cache: $_" -ForegroundColor Red
}

# Step 8: Display final URLs
Write-Host "`nConfiguration fix completed!" -ForegroundColor Green
Write-Host "Your app should be available at:" -ForegroundColor Cyan
Write-Host "CloudFront: https://d19a5c2wn4mtdt.cloudfront.net" -ForegroundColor Cyan
Write-Host "S3 Website: http://default-safemate-static-hosting.s3-website-ap-southeast-2.amazonaws.com" -ForegroundColor Cyan

Write-Host "`nKey fixes applied:" -ForegroundColor Yellow
Write-Host "- Changed CloudFront origin to use S3 website endpoint" -ForegroundColor White
Write-Host "- Updated origin configuration to use CustomOriginConfig" -ForegroundColor White
Write-Host "- Set proper S3 bucket website configuration" -ForegroundColor White
Write-Host "- Applied public read bucket policy" -ForegroundColor White
Write-Host "- Updated CloudFront cache behavior for SPA routing" -ForegroundColor White
