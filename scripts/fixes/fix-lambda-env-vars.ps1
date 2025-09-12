# Fix Lambda Environment Variables
# This script adds the missing operator credentials to the Hedera service Lambda function

Write-Host "Fixing Lambda Environment Variables..." -ForegroundColor Yellow

$LAMBDA_FUNCTION_NAME = "default-safemate-hedera-service"

# Step 1: Get current environment variables
Write-Host "Step 1: Getting current environment variables..." -ForegroundColor Cyan
$currentConfig = aws lambda get-function-configuration --function-name $LAMBDA_FUNCTION_NAME --query 'Environment.Variables' --output json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Retrieved current environment variables" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to get current environment variables" -ForegroundColor Red
    exit 1
}

# Step 2: Add missing operator credentials
Write-Host "Step 2: Adding missing operator credentials..." -ForegroundColor Cyan

# Parse current variables and add missing ones
$currentVars = $currentConfig | ConvertFrom-Json

# Add the missing environment variables
$currentVars | Add-Member -MemberType NoteProperty -Name "OPERATOR_ACCOUNT_ID" -Value "0.0.6428427" -Force
$currentVars | Add-Member -MemberType NoteProperty -Name "OPERATOR_PRIVATE_KEY_KMS_KEY_ID" -Value "0df54397-e4ad-4d29-a2b7-edc474aa01d4" -Force

# Convert back to JSON
$updatedVars = $currentVars | ConvertTo-Json -Depth 10

# Step 3: Update Lambda function configuration
Write-Host "Step 3: Updating Lambda function configuration..." -ForegroundColor Cyan
aws lambda update-function-configuration `
    --function-name $LAMBDA_FUNCTION_NAME `
    --environment "Variables=$updatedVars"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda function configuration updated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update Lambda function configuration" -ForegroundColor Red
    exit 1
}

# Step 4: Wait for update to complete
Write-Host "Step 4: Waiting for update to complete..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Step 5: Verify the update
Write-Host "Step 5: Verifying the update..." -ForegroundColor Cyan
$verifyConfig = aws lambda get-function-configuration --function-name $LAMBDA_FUNCTION_NAME --query 'Environment.Variables.{OPERATOR_ACCOUNT_ID: OPERATOR_ACCOUNT_ID, OPERATOR_PRIVATE_KEY_KMS_KEY_ID: OPERATOR_PRIVATE_KEY_KMS_KEY_ID}' --output json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Environment variables verified:" -ForegroundColor Green
    Write-Host $verifyConfig -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to verify environment variables" -ForegroundColor Red
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Lambda Environment Variables Fixed!" -ForegroundColor Green
Write-Host "The Lambda function now has the required operator credentials." -ForegroundColor Cyan
Write-Host "Test the folder creation functionality in the frontend." -ForegroundColor Cyan
