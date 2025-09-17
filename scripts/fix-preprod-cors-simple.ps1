# Simple CORS fix for Preprod Onboarding API
# This script creates OPTIONS methods and CORS headers for the preprod API

Write-Host "🔧 Fixing CORS for Preprod Onboarding API (Simple approach)..." -ForegroundColor Yellow

$API_ID = "ol212feqdl"
$STAGE_NAME = "preprod"

Write-Host "API ID: $API_ID" -ForegroundColor Cyan
Write-Host "Stage: $STAGE_NAME" -ForegroundColor Cyan

# Get the resource ID for /onboarding/status
Write-Host "Getting resource information..." -ForegroundColor Cyan
$resources = aws apigateway get-resources --rest-api-id $API_ID --output json
$resourcesObj = $resources | ConvertFrom-Json
$statusResource = $resourcesObj.items | Where-Object { $_.path -eq "/onboarding/status" }

if (-not $statusResource) {
    Write-Host "/onboarding/status resource not found" -ForegroundColor Red
    exit 1
}

$statusResourceId = $statusResource.id
Write-Host "Found /onboarding/status resource: $statusResourceId" -ForegroundColor Green

# Create OPTIONS method if it doesn't exist
Write-Host "Creating OPTIONS method for /onboarding/status..." -ForegroundColor Cyan
aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $statusResourceId `
    --http-method OPTIONS `
    --authorization-type NONE

if ($LASTEXITCODE -ne 0) {
    Write-Host "OPTIONS method may already exist, continuing..." -ForegroundColor Yellow
}

# Create method response for OPTIONS
Write-Host "Creating method response for OPTIONS..." -ForegroundColor Cyan
aws apigateway put-method-response `
    --rest-api-id $API_ID `
    --resource-id $statusResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false

if ($LASTEXITCODE -ne 0) {
    Write-Host "Method response may already exist, continuing..." -ForegroundColor Yellow
}

# Update method response with CORS headers
Write-Host "Adding CORS headers to method response..." -ForegroundColor Cyan
aws apigateway put-method-response `
    --rest-api-id $API_ID `
    --resource-id $statusResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add CORS headers to method response" -ForegroundColor Red
    exit 1
}

# Create integration for OPTIONS
Write-Host "Creating integration for OPTIONS..." -ForegroundColor Cyan
aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $statusResourceId `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates '{"application/json": "{\"statusCode\": 200}"}'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Integration may already exist, continuing..." -ForegroundColor Yellow
}

# Create integration response with CORS headers
Write-Host "Creating integration response with CORS headers..." -ForegroundColor Cyan
aws apigateway put-integration-response `
    --rest-api-id $API_ID `
    --resource-id $statusResourceId `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,x-cognito-id-token,x-cognito-access-token'"'"'","method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"}'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create integration response" -ForegroundColor Red
    exit 1
}

# Deploy the changes
Write-Host "Deploying changes to preprod stage..." -ForegroundColor Cyan
aws apigateway create-deployment `
    --rest-api-id $API_ID `
    --stage-name $STAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to deploy changes" -ForegroundColor Red
    exit 1
}

Write-Host "✅ CORS fix completed successfully!" -ForegroundColor Green
Write-Host "🔗 API Endpoint: https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME" -ForegroundColor Cyan
Write-Host "📋 Test the endpoint: https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/onboarding/status" -ForegroundColor Cyan
