# Fix CORS Configuration for API Gateway
# This script configures proper CORS settings for the /folders endpoint

Write-Host "Fixing CORS Configuration..." -ForegroundColor Yellow

$API_GATEWAY_ID = "229i7zye9f"
$FOLDERS_RESOURCE_ID = "suk3xe"

# Step 1: Configure OPTIONS method response
Write-Host "Step 1: Configuring OPTIONS method response..." -ForegroundColor Cyan
aws apigateway put-method-response `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Credentials": true
    }'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ OPTIONS method response configured successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure OPTIONS method response" -ForegroundColor Red
}

# Step 2: Configure OPTIONS integration response
Write-Host "Step 2: Configuring OPTIONS integration response..." -ForegroundColor Cyan
aws apigateway put-integration-response `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": "'"'*'"'",
        "method.response.header.Access-Control-Allow-Headers": "'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'",
        "method.response.header.Access-Control-Allow-Methods": "'"'GET,POST,PUT,DELETE,OPTIONS'"'",
        "method.response.header.Access-Control-Allow-Credentials": "'"'true'"'"
    }'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ OPTIONS integration response configured successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure OPTIONS integration response" -ForegroundColor Red
}

# Step 3: Configure GET method response headers
Write-Host "Step 3: Configuring GET method response headers..." -ForegroundColor Cyan
aws apigateway put-method-response `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method GET `
    --status-code 200 `
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Credentials": true
    }'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GET method response headers configured successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure GET method response headers" -ForegroundColor Red
}

# Step 4: Configure POST method response headers
Write-Host "Step 4: Configuring POST method response headers..." -ForegroundColor Cyan
aws apigateway put-method-response `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method POST `
    --status-code 200 `
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Credentials": true
    }'

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ POST method response headers configured successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure POST method response headers" -ForegroundColor Red
}

# Step 5: Create deployment
Write-Host "Step 5: Creating deployment..." -ForegroundColor Cyan
aws apigateway create-deployment `
    --rest-api-id $API_GATEWAY_ID `
    --stage-name "default"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create deployment" -ForegroundColor Red
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "CORS Configuration Fixed!" -ForegroundColor Green
Write-Host "The API Gateway should now handle CORS properly." -ForegroundColor Cyan
Write-Host "Test the folder creation functionality in the frontend." -ForegroundColor Cyan
