# Fix Lambda Environment Variables
Write-Host "Setting Lambda environment variables..." -ForegroundColor Yellow

$envVars = @{
    "WALLET_KEYS_TABLE" = "safemate-wallet-keys"
    "WALLET_METADATA_TABLE" = "safemate-wallet-metadata"
    "APP_SECRETS_KMS_KEY_ID" = "alias/safemate-app-secrets"
    "WALLET_KMS_KEY_ID" = "alias/safemate-wallet-keys"
    "HEDERA_NETWORK" = "testnet"
    "AWS_REGION" = "ap-southeast-2"
}

$envJson = $envVars | ConvertTo-Json -Compress
Write-Host "JSON: $envJson" -ForegroundColor Cyan

# Use the JSON string directly in the command
$command = "aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables='$envJson'"
Write-Host "Command: $command" -ForegroundColor Gray

Invoke-Expression $command

Write-Host "Done!" -ForegroundColor Green
