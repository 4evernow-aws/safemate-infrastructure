# Comprehensive Diagnostic Script for SafeMate Issues
Write-Host "🔍 SafeMate Diagnostic Script" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# 1. Check Lambda Environment Variables
Write-Host "`n1. Checking Lambda Environment Variables..." -ForegroundColor Cyan
try {
    $envVars = aws lambda get-function-configuration --function-name default-safemate-ultimate-wallet --query 'Environment.Variables' --output json
    Write-Host "✅ Environment Variables: $envVars" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get environment variables: $_" -ForegroundColor Red
}

# 2. Test Lambda Directly
Write-Host "`n2. Testing Lambda Function Directly..." -ForegroundColor Cyan
$testPayload = @{
    httpMethod = "POST"
    path = "/onboarding/start"
    body = '{"action":"start"}'
    headers = @{
        "Content-Type" = "application/json"
    }
} | ConvertTo-Json -Compress

try {
    aws lambda invoke --function-name default-safemate-ultimate-wallet --payload $testPayload lambda-response.json --cli-binary-format raw-in-base64-out
    if (Test-Path lambda-response.json) {
        $lambdaResponse = Get-Content lambda-response.json -Raw
        Write-Host "✅ Lambda Response: $lambdaResponse" -ForegroundColor Green
    } else {
        Write-Host "❌ No Lambda response file created" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Lambda test failed: $_" -ForegroundColor Red
}

# 3. Test API Gateway CORS
Write-Host "`n3. Testing API Gateway CORS..." -ForegroundColor Cyan
try {
    $corsResponse = Invoke-WebRequest -Uri "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -Method OPTIONS -Headers @{"Origin"="http://localhost:5173"} -UseBasicParsing
    Write-Host "✅ CORS Response Status: $($corsResponse.StatusCode)" -ForegroundColor Green
    Write-Host "✅ CORS Headers: $($corsResponse.Headers | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ CORS test failed: $_" -ForegroundColor Red
}

# 4. Test API Gateway POST
Write-Host "`n4. Testing API Gateway POST..." -ForegroundColor Cyan
try {
    $postResponse = Invoke-WebRequest -Uri "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"action":"start"}' -UseBasicParsing
    Write-Host "✅ POST Response Status: $($postResponse.StatusCode)" -ForegroundColor Green
    Write-Host "✅ POST Response: $($postResponse.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ POST test failed: $_" -ForegroundColor Red
}

Write-Host "`n🔍 Diagnostic Complete!" -ForegroundColor Yellow
