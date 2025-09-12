# Deploy Fixed Hedera Lambda Function
# This script deploys the fixed Lambda function with the corrected import

Write-Host "Deploying Fixed Hedera Lambda Function..." -ForegroundColor Yellow

$LAMBDA_FUNCTION_NAME = "default-safemate-hedera-service"
$SERVICE_DIR = "services/hedera-service"

# Step 1: Navigate to service directory
Write-Host "Step 1: Navigating to service directory..." -ForegroundColor Cyan
Set-Location $SERVICE_DIR

# Step 2: Create deployment package
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Cyan

# Remove existing zip if it exists
if (Test-Path "hedera-service.zip") {
    Remove-Item "hedera-service.zip" -Force
}

# Create zip file with all necessary files
Write-Host "Creating zip package..." -ForegroundColor Gray
Compress-Archive -Path "index.js", "hedera-client.js", "auth-helper.js", "package.json", "package-lock.json" -DestinationPath "hedera-service.zip" -Force

# Step 3: Update Lambda function code
Write-Host "Step 3: Updating Lambda function code..." -ForegroundColor Cyan
aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file fileb://hedera-service.zip --output json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda function code updated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update Lambda function code" -ForegroundColor Red
    exit 1
}

# Step 4: Wait for update to complete
Write-Host "Step 4: Waiting for update to complete..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Step 5: Verify the update
Write-Host "Step 5: Verifying the update..." -ForegroundColor Cyan
$lambdaConfig = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query 'Configuration.LastUpdateStatus' --output text

if ($lambdaConfig -eq "Successful") {
    Write-Host "✅ Lambda function update completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Lambda function update status: $lambdaConfig" -ForegroundColor Yellow
}

# Step 6: Cleanup
Write-Host "Step 6: Cleaning up..." -ForegroundColor Cyan
if (Test-Path "hedera-service.zip") {
    Remove-Item "hedera-service.zip" -Force
}

# Step 7: Return to original directory
Set-Location ../..

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Hedera Lambda Function Fix Deployed!" -ForegroundColor Green
Write-Host "The Lambda function should now work correctly." -ForegroundColor Cyan
Write-Host "Test the folder creation functionality in the frontend." -ForegroundColor Cyan
