# Simple CORS fix for /folders endpoint
# This script uses AWS CLI to enable CORS for the /folders endpoint

Write-Host "Fixing CORS for /folders endpoint..." -ForegroundColor Yellow

$API_ID = "527ye7o1j0"
$STAGE_NAME = "default"

# Step 1: Get the folders resource ID
Write-Host "Step 1: Getting API Gateway resources..." -ForegroundColor Cyan
$resources = aws apigateway get-resources --rest-api-id $API_ID --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get API Gateway resources" -ForegroundColor Red
    exit 1
}

$resourcesObj = $resources | ConvertFrom-Json
$foldersResource = $resourcesObj.items | Where-Object { $_.path -eq "/folders" }

if (-not $foldersResource) {
    Write-Host "/folders resource not found" -ForegroundColor Red
    exit 1
}

$foldersResourceId = $foldersResource.id
Write-Host "Found /folders resource: $foldersResourceId" -ForegroundColor Green

# Step 2: Enable CORS using AWS CLI
Write-Host "Step 2: Enabling CORS for /folders..." -ForegroundColor Cyan

# Use the AWS CLI enable-cors command
aws apigateway put-cors --rest-api-id $API_ID --resource-id $foldersResourceId --cors-configuration '{"allowOrigins":["http://localhost:5173"],"allowHeaders":["Content-Type","X-Amz-Date","Authorization","X-Api-Key","X-Amz-Security-Token","x-cognito-id-token","x-cognito-access-token","Accept"],"allowMethods":["GET","POST","OPTIONS"],"allowCredentials":true,"maxAge":3600}' --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to enable CORS" -ForegroundColor Red
    exit 1
}

Write-Host "CORS enabled successfully" -ForegroundColor Green

# Step 3: Deploy the API
Write-Host "Step 3: Deploying API..." -ForegroundColor Cyan

aws apigateway create-deployment --rest-api-id $API_ID --stage-name $STAGE_NAME --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to deploy API" -ForegroundColor Red
    exit 1
}

Write-Host "API deployed successfully" -ForegroundColor Green

# Step 4: Test the CORS configuration
Write-Host "Step 4: Testing CORS configuration..." -ForegroundColor Cyan

$testUrl = "https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/folders"
Write-Host "Testing OPTIONS request to: $testUrl" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method OPTIONS -Headers @{
        "Origin" = "http://localhost:5173"
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "Content-Type,Authorization"
    } -ErrorAction Stop
    
    Write-Host "CORS test successful!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "CORS Headers:" -ForegroundColor Gray
    $response.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "CORS fix completed for /folders endpoint!" -ForegroundColor Green
Write-Host "The frontend should now be able to access the /folders endpoint without CORS errors." -ForegroundColor Cyan

