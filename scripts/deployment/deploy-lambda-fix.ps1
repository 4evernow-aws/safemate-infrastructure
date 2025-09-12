# Deploy Lambda Function Fix
Write-Host "Deploying Lambda Function Fix..." -ForegroundColor Yellow

# Navigate to Lambda directory
Set-Location "services/ultimate-wallet-service"

# Install dependencies (including the missing @smithy/util-middleware)
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
aws lambda update-function-code --function-name default-safemate-ultimate-wallet --zip-file "fileb://$zipFile" --region ap-southeast-2

if ($LASTEXITCODE -eq 0) {
    Write-Host "Lambda function updated successfully!" -ForegroundColor Green
    Write-Host "You can now test the endpoints in your browser." -ForegroundColor Yellow
} else {
    Write-Host "Failed to update Lambda function" -ForegroundColor Red
}

# Clean up
Remove-Item $zipFile -Force
Write-Host "Cleaned up deployment package" -ForegroundColor Cyan

# Return to original directory
Set-Location "../.."

Write-Host "Deployment completed!" -ForegroundColor Green
