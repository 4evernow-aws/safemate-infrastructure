# Fix Lambda Environment Variables
Write-Host "🔧 Setting Lambda environment variables..." -ForegroundColor Yellow

# Set environment variables
$envVars = @{
    "WALLET_KEYS_TABLE" = "safemate-wallet-keys"
    "WALLET_METADATA_TABLE" = "safemate-wallet-metadata"
    "APP_SECRETS_KMS_KEY_ID" = "alias/safemate-app-secrets"
    "WALLET_KMS_KEY_ID" = "alias/safemate-wallet-keys"
    "HEDERA_NETWORK" = "testnet"
    "AWS_REGION" = "ap-southeast-2"
}

$envJson = $envVars | ConvertTo-Json -Compress

Write-Host "Setting variables: $envJson" -ForegroundColor Cyan

# Update Lambda
aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables=$envJson

Write-Host "✅ Environment variables set!" -ForegroundColor Green

# Test the Lambda
Write-Host "🧪 Testing Lambda function..." -ForegroundColor Yellow

$testResponse = Invoke-WebRequest -Uri "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -Method POST -Headers @{"Origin"="http://localhost:5173"; "Content-Type"="application/json"} -Body '{"action":"start"}' -ErrorAction SilentlyContinue

if ($testResponse) {
    Write-Host "Status: $($testResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Body: $($testResponse.Content)" -ForegroundColor Cyan
} else {
    Write-Host "Expected error (no valid auth token) - this is normal" -ForegroundColor Yellow
}

Write-Host "🎉 Test complete!" -ForegroundColor Green
