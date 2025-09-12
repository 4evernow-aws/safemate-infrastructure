# Simple Lambda Fix Script
Write-Host "Testing and Deploying Lambda Function Fix..." -ForegroundColor Yellow

# Step 1: Test Lambda function
Write-Host "Testing Lambda function..." -ForegroundColor Cyan

$testPayload = @{
    httpMethod = "GET"
    path = "/onboarding/status"
    headers = @{
        Authorization = "Bearer test"
    }
} | ConvertTo-Json -Compress

# Save payload to file
$testPayload | Out-File -FilePath "test-payload.json" -Encoding UTF8

# Test Lambda function
Write-Host "Invoking Lambda function..." -ForegroundColor Cyan
aws lambda invoke --function-name "default-safemate-ultimate-wallet" --payload "file://test-payload.json" --region "ap-southeast-2" test-response.json

if ($LASTEXITCODE -eq 0) {
    Write-Host "Lambda function invoked successfully!" -ForegroundColor Green
    
    # Show response
    if (Test-Path "test-response.json") {
        Write-Host "Response:" -ForegroundColor Cyan
        Get-Content "test-response.json" | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
} else {
    Write-Host "Lambda function invocation failed" -ForegroundColor Red
}

# Step 2: Deploy the updated Lambda function
Write-Host "Deploying updated Lambda function..." -ForegroundColor Cyan

# Navigate to Lambda directory
Set-Location "services/ultimate-wallet-service"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFile = "ultimate-wallet-service-$timestamp.zip"

# Remove existing zip files
Get-ChildItem -Filter "*.zip" | Remove-Item -Force

# Create new zip file
Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath $zipFile -Force

Write-Host "Deployment package created: $zipFile" -ForegroundColor Green

# Deploy to AWS Lambda
Write-Host "Deploying to AWS Lambda..." -ForegroundColor Cyan
aws lambda update-function-code --function-name "default-safemate-ultimate-wallet" --zip-file "fileb://$zipFile" --region "ap-southeast-2"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Lambda function updated successfully!" -ForegroundColor Green
    Write-Host "You can now test the endpoints in your browser." -ForegroundColor Yellow
    Write-Host "Check CloudWatch logs for detailed error information." -ForegroundColor Yellow
} else {
    Write-Host "Failed to update Lambda function" -ForegroundColor Red
}

# Clean up
Remove-Item $zipFile -Force
Write-Host "Cleaned up deployment package" -ForegroundColor Cyan

# Return to original directory
Set-Location "../.."

# Clean up test files
Remove-Item "test-payload.json" -Force -ErrorAction SilentlyContinue
Remove-Item "test-response.json" -Force -ErrorAction SilentlyContinue

Write-Host "Complete! Test your application now." -ForegroundColor Green
