# Test CORS directly
$restApiId = "2kwe2ly8vh"
$region = "ap-southeast-2"
$baseUrl = "https://$restApiId.execute-api.$region.amazonaws.com/preprod"

Write-Host "Testing CORS configuration..."

# Test 1: OPTIONS request (CORS preflight)
Write-Host "1. Testing OPTIONS request (CORS preflight)..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/folders" -Method OPTIONS -Headers @{
        "Origin" = "http://preprod-safemate-static-hosting.s3-website-ap-southeast-2.amazonaws.com"
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "Content-Type,Authorization"
    } -UseBasicParsing -TimeoutSec 10
    
    Write-Host "✅ OPTIONS request successful:"
    Write-Host "   Status: $($response.StatusCode)"
    Write-Host "   Headers:"
    foreach ($header in $response.Headers.GetEnumerator()) {
        if ($header.Key -like "*Access-Control*") {
            Write-Host "     $($header.Key): $($header.Value)"
        }
    }
} catch {
    Write-Host "❌ OPTIONS request failed: $($_.Exception.Message)"
}

# Test 2: GET request
Write-Host "2. Testing GET request..."
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/folders" -Method GET -UseBasicParsing -TimeoutSec 10
    
    Write-Host "✅ GET request successful:"
    Write-Host "   Status: $($response.StatusCode)"
    Write-Host "   Headers:"
    foreach ($header in $response.Headers.GetEnumerator()) {
        if ($header.Key -like "*Access-Control*") {
            Write-Host "     $($header.Key): $($header.Value)"
        }
    }
} catch {
    Write-Host "❌ GET request failed: $($_.Exception.Message)"
}

Write-Host "CORS test complete."
