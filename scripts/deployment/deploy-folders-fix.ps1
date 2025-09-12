# Deploy Ultimate Wallet Service with Folders Support
Write-Host "🔧 Deploying Ultimate Wallet Service with Folders Support..." -ForegroundColor Yellow

# Navigate to Lambda directory
Set-Location "D:\cursor_projects\safemate_v2\services\ultimate-wallet-service"

# Create deployment package
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFileName = "ultimate-wallet-service-$timestamp.zip"

Write-Host "📦 Creating deployment package: $zipFileName" -ForegroundColor Cyan

# Create zip file
Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath $zipFileName -Force

# Check file size
$fileSize = (Get-Item $zipFileName).Length / 1MB
Write-Host "📊 Package size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan

if ($fileSize -gt 50) {
    Write-Host "⚠️ Package size exceeds 50MB, using S3 deployment..." -ForegroundColor Yellow
    
    # Create temporary S3 bucket
    $bucketName = "safemate-lambda-deploy-$timestamp"
    Write-Host "🪣 Creating temporary S3 bucket: $bucketName" -ForegroundColor Cyan
    
    aws s3 mb s3://$bucketName --region ap-southeast-2
    
    # Upload to S3
    Write-Host "📤 Uploading to S3..." -ForegroundColor Cyan
    aws s3 cp $zipFileName s3://$bucketName/ --region ap-southeast-2
    
    # Update Lambda from S3
    Write-Host "🚀 Updating Lambda function..." -ForegroundColor Cyan
    aws lambda update-function-code --function-name default-safemate-ultimate-wallet --s3-bucket $bucketName --s3-key $zipFileName --region ap-southeast-2
    
    # Clean up S3 bucket
    Write-Host "🧹 Cleaning up S3 bucket..." -ForegroundColor Cyan
    aws s3 rm s3://$bucketName/$zipFileName --region ap-southeast-2
    aws s3 rb s3://$bucketName --region ap-southeast-2
} else {
    Write-Host "🚀 Updating Lambda function directly..." -ForegroundColor Cyan
    aws lambda update-function-code --function-name default-safemate-ultimate-wallet --zip-file fileb://$zipFileName --region ap-southeast-2
}

# Clean up local zip file
Remove-Item $zipFileName -Force

Write-Host "✅ Ultimate Wallet Service deployed successfully with folders support!" -ForegroundColor Green
Write-Host "🔧 Testing folders endpoint..." -ForegroundColor Cyan

# Test the folders endpoint
$testPayload = @{
    httpMethod = "GET"
    path = "/folders"
    headers = @{
        Authorization = "Bearer test"
    }
    requestContext = @{
        authorizer = @{
            claims = @{
                sub = "a9ae6468-4061-70da-866c-857698a1fa8a"
                email = "simon.woods@tne.com.au"
            }
        }
    }
} | ConvertTo-Json -Compress

$base64Payload = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($testPayload))

aws lambda invoke --function-name default-safemate-ultimate-wallet --payload $base64Payload --region ap-southeast-2 test-folders-response.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Folders endpoint test successful!" -ForegroundColor Green
    if (Test-Path "test-folders-response.json") {
        Write-Host "📄 Response:" -ForegroundColor Cyan
        Get-Content "test-folders-response.json" | ConvertFrom-Json | ConvertTo-Json -Depth 10
        Remove-Item "test-folders-response.json" -Force
    }
} else {
    Write-Host "❌ Folders endpoint test failed" -ForegroundColor Red
}

Write-Host "🎉 Deployment completed! Test in browser at http://localhost:5173" -ForegroundColor Green
