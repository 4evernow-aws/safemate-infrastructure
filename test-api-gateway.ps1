# Test API Gateway Configuration
$restApiId = "2kwe2ly8vh"
$region = "ap-southeast-2"

Write-Host "Testing API Gateway configuration..."

# Test 1: Check if API Gateway exists
Write-Host "1. Checking if API Gateway exists..."
try {
    $api = aws apigateway get-rest-api --rest-api-id $restApiId --region $region --output json
    if ($api) {
        Write-Host "✅ API Gateway exists: $($api | ConvertFrom-Json | Select-Object -ExpandProperty name)"
    }
} catch {
    Write-Host "❌ API Gateway not found or error: $_"
}

# Test 2: Check resources
Write-Host "2. Checking API Gateway resources..."
try {
    $resources = aws apigateway get-resources --rest-api-id $restApiId --region $region --output json
    if ($resources) {
        $resourceList = $resources | ConvertFrom-Json
        Write-Host "✅ Found $($resourceList.items.Count) resources:"
        foreach ($resource in $resourceList.items) {
            Write-Host "   - $($resource.path) (ID: $($resource.id))"
        }
    }
} catch {
    Write-Host "❌ Error getting resources: $_"
}

# Test 3: Test specific endpoint
Write-Host "3. Testing /folders endpoint..."
try {
    $response = Invoke-WebRequest -Uri "https://$restApiId.execute-api.$region.amazonaws.com/preprod/folders" -Method GET -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ /folders endpoint responded with status: $($response.StatusCode)"
} catch {
    Write-Host "❌ /folders endpoint error: $_"
}

# Test 4: Test CORS
Write-Host "4. Testing CORS preflight..."
try {
    $response = Invoke-WebRequest -Uri "https://$restApiId.execute-api.$region.amazonaws.com/preprod/folders" -Method OPTIONS -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ CORS preflight responded with status: $($response.StatusCode)"
} catch {
    Write-Host "❌ CORS preflight error: $_"
}

Write-Host "API Gateway test complete."
