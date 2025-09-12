# Fix Hedera Lambda Dependencies and Redeploy
# This script fixes the missing @smithy/util-middleware dependency

Write-Host "Fixing Hedera Lambda Dependencies..." -ForegroundColor Yellow

$LAMBDA_FUNCTION_NAME = "default-safemate-hedera-service"
$SERVICE_DIR = "services/hedera-service"

# Step 1: Navigate to service directory
Write-Host "Step 1: Navigating to service directory..." -ForegroundColor Cyan
Set-Location $SERVICE_DIR

# Step 2: Install dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Step 3: Create deployment package
Write-Host "Step 3: Creating deployment package..." -ForegroundColor Cyan

# Remove existing zip if it exists
if (Test-Path "hedera-service.zip") {
    Remove-Item "hedera-service.zip" -Force
}

# Create zip file with all necessary files including node_modules
Write-Host "Creating zip package with node_modules..." -ForegroundColor Gray
Compress-Archive -Path "index.js", "hedera-client.js", "auth-helper.js", "package.json", "node_modules" -DestinationPath "hedera-service.zip" -Force

# Step 4: Update Lambda function code
Write-Host "Step 4: Updating Lambda function code..." -ForegroundColor Cyan
aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file fileb://hedera-service.zip --output json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda function code updated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update Lambda function code" -ForegroundColor Red
    exit 1
}

# Step 5: Wait for update to complete
Write-Host "Step 5: Waiting for update to complete..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Step 6: Verify the update
Write-Host "Step 6: Verifying the update..." -ForegroundColor Cyan
$lambdaConfig = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query 'Configuration.LastUpdateStatus' --output text

if ($lambdaConfig -eq "Successful") {
    Write-Host "✅ Lambda function update completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Lambda function update status: $lambdaConfig" -ForegroundColor Yellow
}

# Step 7: Test the Lambda function
Write-Host "Step 7: Testing Lambda function..." -ForegroundColor Cyan
$testEvent = @{
    httpMethod = "GET"
    path = "/folders"
    headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer test-token"
    }
    requestContext = @{
        authorizer = @{
            claims = @{
                sub = "test-user-123"
            }
        }
    }
} | ConvertTo-Json -Depth 10

$testEvent | Out-File -FilePath "test-event.json" -Encoding UTF8

aws lambda invoke --function-name $LAMBDA_FUNCTION_NAME --payload file://test-event.json response.json

if ($LASTEXITCODE -eq 0) {
    $response = Get-Content response.json | ConvertFrom-Json
    Write-Host "✅ Lambda function test successful" -ForegroundColor Green
    Write-Host "Response status: $($response.statusCode)" -ForegroundColor Gray
} else {
    Write-Host "❌ Lambda function test failed" -ForegroundColor Red
}

# Step 8: Cleanup
Write-Host "Step 8: Cleaning up..." -ForegroundColor Cyan
if (Test-Path "hedera-service.zip") {
    Remove-Item "hedera-service.zip" -Force
}
if (Test-Path "test-event.json") {
    Remove-Item "test-event.json" -Force
}
if (Test-Path "response.json") {
    Remove-Item "response.json" -Force
}

# Step 9: Return to original directory
Set-Location ../..

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Hedera Lambda Dependencies Fixed and Deployed!" -ForegroundColor Green
Write-Host "The Lambda function should now work correctly." -ForegroundColor Cyan
Write-Host "Test the folder creation functionality in the frontend." -ForegroundColor Cyan
