# Comprehensive Fix for SafeMate Issues
Write-Host "ðŸ”§ SafeMate Comprehensive Fix Script" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

# 1. Update Lambda Layer
Write-Host "`n1. Updating Lambda Layer..." -ForegroundColor Cyan
try {
    # Create new layer version
    aws lambda publish-layer-version --layer-name hedera-sdk-layer --description "Updated Hedera SDK Layer with all dependencies" --zip-file fileb://lambda-layer/hedera-layer-updated.zip --compatible-runtimes nodejs18.x
    Write-Host "âœ… Lambda layer updated successfully" -ForegroundColor Green
} catch {
    Write-Host "âŒ Lambda layer update failed: $_" -ForegroundColor Red
}

# 2. Update Lambda Function to use new layer
Write-Host "`n2. Updating Lambda Function..." -ForegroundColor Cyan
try {
    # Get the latest layer version
    $layerArn = aws lambda list-layer-versions --layer-name hedera-sdk-layer --query 'LayerVersions[0].LayerVersionArn' --output text
    Write-Host "Using layer: $layerArn" -ForegroundColor Cyan
    
    # Update Lambda function
    aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --layers $layerArn
    Write-Host "âœ… Lambda function updated successfully" -ForegroundColor Green
} catch {
    Write-Host "âŒ Lambda function update failed: $_" -ForegroundColor Red
}

# 3. Test Lambda Function
Write-Host "`n3. Testing Lambda Function..." -ForegroundColor Cyan
try {
    aws lambda invoke --function-name default-safemate-ultimate-wallet --payload file://test-lambda-payload.json lambda-response.json --cli-binary-format raw-in-base64-out
    if (Test-Path lambda-response.json) {
        $response = Get-Content lambda-response.json -Raw
        Write-Host "âœ… Lambda Response: $response" -ForegroundColor Green
    } else {
        Write-Host "âŒ No Lambda response file created" -ForegroundColor Red
    }
} catch {
    Write-Host "âŒ Lambda test failed: $_" -ForegroundColor Red
}

# 4. Test API Gateway CORS
Write-Host "`n4. Testing API Gateway CORS..." -ForegroundColor Cyan
try {
    $corsResponse = Invoke-WebRequest -Uri "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -Method OPTIONS -Headers @{"Origin"="http://localhost:5173"} -UseBasicParsing
    Write-Host "âœ… CORS Response Status: $($corsResponse.StatusCode)" -ForegroundColor Green
    Write-Host "âœ… CORS Headers: $($corsResponse.Headers | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "âŒ CORS test failed: $_" -ForegroundColor Red
}

# 5. Test API Gateway POST
Write-Host "`n5. Testing API Gateway POST..." -ForegroundColor Cyan
try {
    $postResponse = Invoke-WebRequest -Uri "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"action":"start"}' -UseBasicParsing
    Write-Host "âœ… POST Response Status: $($postResponse.StatusCode)" -ForegroundColor Green
    Write-Host "âœ… POST Response: $($postResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "âŒ POST test failed: $_" -ForegroundColor Red
}

Write-Host "`nðŸ”§ Fix Complete!" -ForegroundColor Yellow

