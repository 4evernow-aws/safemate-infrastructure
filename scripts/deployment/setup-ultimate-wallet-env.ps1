# Setup UltimateWalletService Environment Variables
# This script configures the required environment variables for the full UltimateWalletService

Write-Host "🔧 Setting up UltimateWalletService environment variables..." -ForegroundColor Yellow

# Get existing environment variables
Write-Host "📋 Getting current environment variables..." -ForegroundColor Cyan
$currentEnv = aws lambda get-function-configuration --function-name default-safemate-ultimate-wallet --query 'Environment.Variables' --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get current environment variables" -ForegroundColor Red
    exit 1
}

# Parse current variables or create empty object
if ($currentEnv -eq "null") {
    $currentVars = @{}
} else {
    $currentVars = $currentEnv | ConvertFrom-Json -AsHashtable
}

# Required environment variables for UltimateWalletService
$requiredVars = @{
    "WALLET_KEYS_TABLE" = "safemate-wallet-keys"
    "WALLET_METADATA_TABLE" = "safemate-wallet-metadata"
    "APP_SECRETS_KMS_KEY_ID" = "alias/safemate-app-secrets"
    "WALLET_KMS_KEY_ID" = "alias/safemate-wallet-keys"
    "HEDERA_NETWORK" = "testnet"
    "AWS_REGION" = "ap-southeast-2"
}

# Merge with existing variables
$mergedVars = $currentVars.Clone()
foreach ($key in $requiredVars.Keys) {
    $mergedVars[$key] = $requiredVars[$key]
}

# Convert to JSON
$envJson = $mergedVars | ConvertTo-Json -Compress

Write-Host "📝 Setting environment variables..." -ForegroundColor Cyan
Write-Host "Variables to set:" -ForegroundColor Green
foreach ($key in $mergedVars.Keys) {
    Write-Host "  $key = $($mergedVars[$key])" -ForegroundColor Gray
}

# Update Lambda function configuration
$updateCmd = "aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables=$envJson"

Write-Host "🚀 Executing: $updateCmd" -ForegroundColor Yellow
Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Environment variables updated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update environment variables" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Verifying update..." -ForegroundColor Cyan
$verifyEnv = aws lambda get-function-configuration --function-name default-safemate-ultimate-wallet --query 'Environment.Variables' --output json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Verification successful!" -ForegroundColor Green
    Write-Host "Current environment variables:" -ForegroundColor Cyan
    $verifyEnv | ConvertFrom-Json | ConvertTo-Json
} else {
    Write-Host "❌ Verification failed" -ForegroundColor Red
}

Write-Host "🎉 UltimateWalletService environment setup complete!" -ForegroundColor Green
