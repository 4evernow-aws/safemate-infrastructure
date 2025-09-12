# Fix CORS Configuration for API Gateway - Simple Version
# This script configures proper CORS settings for the /folders endpoint

Write-Host "Fixing CORS Configuration..." -ForegroundColor Yellow

$API_GATEWAY_ID = "229i7zye9f"
$FOLDERS_RESOURCE_ID = "suk3xe"

# Step 1: Configure OPTIONS method response with proper JSON
Write-Host "Step 1: Configuring OPTIONS method response..." -ForegroundColor Cyan
$responseParams = '{"method.response.header.Access-Control-Allow-Origin":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Credentials":true}'

aws apigateway put-method-response `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters $responseParams

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ OPTIONS method response configured successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure OPTIONS method response" -ForegroundColor Red
}

# Step 2: Configure OPTIONS integration response
Write-Host "Step 2: Configuring OPTIONS integration response..." -ForegroundColor Cyan
$integrationParams = '{"method.response.header.Access-Control-Allow-Origin":"*","method.response.header.Access-Control-Allow-Headers":"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token","method.response.header.Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","method.response.header.Access-Control-Allow-Credentials":"true"}'

aws apigateway put-integration-response `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters $integrationParams

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ OPTIONS integration response configured successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to configure OPTIONS integration response" -ForegroundColor Red
}

# Step 3: Create deployment
Write-Host "Step 3: Creating deployment..." -ForegroundColor Cyan
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
