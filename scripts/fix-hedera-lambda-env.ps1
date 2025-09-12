# Fix Hedera Lambda Function Environment Variables
# This script sets the required environment variables for the Hedera service Lambda function

Write-Host "Fixing Hedera Lambda Function Environment Variables..." -ForegroundColor Yellow

$LAMBDA_FUNCTION_NAME = "default-safemate-hedera-service"

# Step 1: Get current environment variables
Write-Host "Step 1: Getting current environment variables..." -ForegroundColor Cyan
$currentEnv = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query 'Configuration.Environment.Variables' --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get current environment variables" -ForegroundColor Red
    exit 1
}

$currentEnvObj = $currentEnv | ConvertFrom-Json

# Step 2: Define required environment variables
Write-Host "Step 2: Setting required environment variables..." -ForegroundColor Cyan

$requiredEnvVars = @{
    "WALLET_KEYS_TABLE" = "safemate-wallet-keys"
    "WALLET_METADATA_TABLE" = "safemate-wallet-metadata"
    "APP_SECRETS_KMS_KEY_ID" = "alias/safemate-app-secrets"
    "WALLET_KMS_KEY_ID" = "alias/safemate-wallet-keys"
    "HEDERA_NETWORK" = "testnet"
    "SAFEMATE_FOLDERS_TABLE" = "default-safemate-folders"
    "SAFEMATE_FILES_TABLE" = "default-safemate-files"
}

# Step 3: Merge with existing environment variables
$mergedEnvVars = @{}

# Add existing variables
if ($currentEnvObj) {
    $currentEnvObj.PSObject.Properties | ForEach-Object {
        $mergedEnvVars[$_.Name] = $_.Value
    }
}

# Add/update required variables
$requiredEnvVars.GetEnumerator() | ForEach-Object {
    $mergedEnvVars[$_.Key] = $_.Value
}

# Step 4: Update Lambda function
Write-Host "Step 3: Updating Lambda function environment variables..." -ForegroundColor Cyan

# Convert to JSON format for AWS CLI
$envJson = $mergedEnvVars | ConvertTo-Json -Compress

aws lambda update-function-configuration --function-name $LAMBDA_FUNCTION_NAME --environment Variables=$envJson --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to update Lambda function environment variables" -ForegroundColor Red
    exit 1
}

Write-Host "Lambda function environment variables updated successfully" -ForegroundColor Green

# Step 5: Verify the update
Write-Host "Step 4: Verifying environment variables..." -ForegroundColor Cyan
$updatedEnv = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query 'Configuration.Environment.Variables' --output json

if ($LASTEXITCODE -eq 0) {
    $updatedEnvObj = $updatedEnv | ConvertFrom-Json
    Write-Host "Updated environment variables:" -ForegroundColor Green
    $updatedEnvObj.PSObject.Properties | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
} else {
    Write-Host "Failed to verify environment variables" -ForegroundColor Red
}

Write-Host "Hedera Lambda function environment variables fix completed!" -ForegroundColor Green
Write-Host "The Lambda function should now have all required environment variables." -ForegroundColor Cyan
