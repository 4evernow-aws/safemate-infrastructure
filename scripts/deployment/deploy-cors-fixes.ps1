# Simple CORS Fix Deployment Script
Write-Host "Deploying CORS fixes to AWS Lambda functions..." -ForegroundColor Green

# Function mappings - using actual function names from AWS
$functions = @{
    "default-safemate-user-onboarding" = "services/user-onboarding/index-rest-api.js"
    "default-safemate-post-confirmation-wallet-creator" = "services/wallet-creator/index.js"
    "default-safemate-group-manager" = "services/group-manager/index.js"
    "default-safemate-token-vault" = "services/token-vault/index.js"
}

foreach ($functionName in $functions.Keys) {
    $sourceFile = $functions[$functionName]
    $functionDir = Split-Path $sourceFile -Parent
    
    Write-Host "Processing $functionName..." -ForegroundColor Cyan
    
    # Create ZIP file
    $zipFile = "$functionName-cors-fix.zip"
    if (Test-Path $zipFile) {
        Remove-Item $zipFile
    }
    
    # Create ZIP with the function file
    Compress-Archive -Path $sourceFile -DestinationPath $zipFile -Force
    
    # Deploy to Lambda
    Write-Host "Deploying $functionName..." -ForegroundColor Yellow
    aws lambda update-function-code --function-name $functionName --zip-file "fileb://$zipFile" --region ap-southeast-2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully deployed $functionName" -ForegroundColor Green
    } else {
        Write-Host "Failed to deploy $functionName" -ForegroundColor Red
    }
    
    # Clean up
    Remove-Item $zipFile
}

Write-Host "CORS configuration deployment completed!" -ForegroundColor Green
