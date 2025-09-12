# Diagnose 500 Error Script
Write-Host "🔍 Diagnosing 500 Internal Server Error..." -ForegroundColor Yellow

# Test 1: Check if Lambda function exists
Write-Host "`n1. Checking Lambda function..." -ForegroundColor Cyan
try {
    $function = aws lambda get-function --function-name default-safemate-ultimate-wallet --query 'Configuration.FunctionName' --output text 2>$null
    if ($function) {
        Write-Host "✅ Lambda function exists: $function" -ForegroundColor Green
    } else {
        Write-Host "❌ Lambda function not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error checking Lambda function: $_" -ForegroundColor Red
}

# Test 2: Check environment variables
Write-Host "`n2. Checking environment variables..." -ForegroundColor Cyan
try {
    $envVars = aws lambda get-function-configuration --function-name default-safemate-ultimate-wallet --query 'Environment.Variables' --output json 2>$null
    if ($envVars -and $envVars -ne 'null') {
        Write-Host "✅ Environment variables found:" -ForegroundColor Green
        $envVars | ConvertFrom-Json | Format-Table
    } else {
        Write-Host "❌ No environment variables found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking environment variables: $_" -ForegroundColor Red
}

# Test 3: Test Lambda function directly
Write-Host "`n3. Testing Lambda function directly..." -ForegroundColor Cyan
$testPayload = @{
    httpMethod = "POST"
    path = "/onboarding/start"
    body = '{"action":"start"}'
    headers = @{
        "Content-Type" = "application/json"
    }
    requestContext = @{
        authorizer = @{
            claims = @{
                sub = "test-user-id"
                email = "test@example.com"
            }
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $testPayload | Out-File -FilePath "test-payload.json" -Encoding UTF8
    aws lambda invoke --function-name default-safemate-ultimate-wallet --payload file://test-payload.json direct-response.json 2>$null
    
    if (Test-Path "direct-response.json") {
        $response = Get-Content "direct-response.json" | ConvertFrom-Json
        Write-Host "✅ Direct Lambda response:" -ForegroundColor Green
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Body: $($response.Body)" -ForegroundColor Green
    } else {
        Write-Host "❌ No response file created" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing Lambda function: $_" -ForegroundColor Red
}

# Test 4: Check API Gateway integration
Write-Host "`n4. Testing API Gateway..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"action":"start"}' -UseBasicParsing
    Write-Host "✅ API Gateway Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ API Gateway Response: $($response.Content)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        Write-Host "❌ API Gateway Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "❌ API Gateway Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    } else {
        Write-Host "❌ API Gateway Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n🔍 Diagnosis Complete!" -ForegroundColor Yellow
