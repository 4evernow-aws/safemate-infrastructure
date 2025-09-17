# Fix CORS for Preprod Onboarding API
# This script enables CORS for the preprod onboarding API Gateway

Write-Host "🔧 Fixing CORS for Preprod Onboarding API..." -ForegroundColor Yellow

$API_ID = "ol212feqdl"
$STAGE_NAME = "preprod"

Write-Host "API ID: $API_ID" -ForegroundColor Cyan
Write-Host "Stage: $STAGE_NAME" -ForegroundColor Cyan

# Step 1: Enable CORS for the root resource
Write-Host "Step 1: Enabling CORS for root resource..." -ForegroundColor Cyan
aws apigateway put-method-response `
    --rest-api-id $API_ID `
    --resource-id shuvf9n4j6 `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to put method response for OPTIONS" -ForegroundColor Red
    exit 1
}

# Step 2: Add CORS headers to method response
Write-Host "Step 2: Adding CORS headers to method response..." -ForegroundColor Cyan
aws apigateway put-method-response `
    --rest-api-id $API_ID `
    --resource-id shuvf9n4j6 `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add CORS headers to method response" -ForegroundColor Red
    exit 1
}

# Step 3: Create integration for OPTIONS method
Write-Host "Step 3: Creating integration for OPTIONS method..." -ForegroundColor Cyan
aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id shuvf9n4j6 `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates '{"application/json": "{\"statusCode\": 200}"}'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create integration for OPTIONS" -ForegroundColor Red
    exit 1
}

# Step 4: Add integration response
Write-Host "Step 4: Adding integration response..." -ForegroundColor Cyan
aws apigateway put-integration-response `
    --rest-api-id $API_ID `
    --resource-id shuvf9n4j6 `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,x-cognito-id-token,x-cognito-access-token'"'"'","method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"}'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add integration response" -ForegroundColor Red
    exit 1
}

# Step 5: Enable CORS for /onboarding resource
Write-Host "Step 5: Enabling CORS for /onboarding resource..." -ForegroundColor Cyan

# Get the onboarding resource ID
$resources = aws apigateway get-resources --rest-api-id $API_ID --output json
$resourcesObj = $resources | ConvertFrom-Json
$onboardingResource = $resourcesObj.items | Where-Object { $_.path -eq "/onboarding" }

if ($onboardingResource) {
    $onboardingResourceId = $onboardingResource.id
    Write-Host "Found /onboarding resource: $onboardingResourceId" -ForegroundColor Green
    
    # Enable CORS for /onboarding
    aws apigateway put-method-response `
        --rest-api-id $API_ID `
        --resource-id $onboardingResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false

    aws apigateway put-method-response `
        --rest-api-id $API_ID `
        --resource-id $onboardingResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true

    aws apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $onboardingResourceId `
        --http-method OPTIONS `
        --type MOCK `
        --request-templates '{"application/json": "{\"statusCode\": 200}"}'

    aws apigateway put-integration-response `
        --rest-api-id $API_ID `
        --resource-id $onboardingResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,x-cognito-id-token,x-cognito-access-token'"'"'","method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"}'
} else {
    Write-Host "/onboarding resource not found, skipping..." -ForegroundColor Yellow
}

# Step 6: Enable CORS for /onboarding/status resource
Write-Host "Step 6: Enabling CORS for /onboarding/status resource..." -ForegroundColor Cyan

$statusResource = $resourcesObj.items | Where-Object { $_.path -eq "/onboarding/status" }

if ($statusResource) {
    $statusResourceId = $statusResource.id
    Write-Host "Found /onboarding/status resource: $statusResourceId" -ForegroundColor Green
    
    # Enable CORS for /onboarding/status
    aws apigateway put-method-response `
        --rest-api-id $API_ID `
        --resource-id $statusResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false

    aws apigateway put-method-response `
        --rest-api-id $API_ID `
        --resource-id $statusResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters method.response.header.Access-Control-Allow-Headers=true,method.response.header.Access-Control-Allow-Methods=true,method.response.header.Access-Control-Allow-Origin=true

    aws apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $statusResourceId `
        --http-method OPTIONS `
        --type MOCK `
        --request-templates '{"application/json": "{\"statusCode\": 200}"}'

    aws apigateway put-integration-response `
        --rest-api-id $API_ID `
        --resource-id $statusResourceId `
        --http-method OPTIONS `
        --status-code 200 `
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,x-cognito-id-token,x-cognito-access-token'"'"'","method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"}'
} else {
    Write-Host "/onboarding/status resource not found, skipping..." -ForegroundColor Yellow
}

# Step 7: Deploy the changes
Write-Host "Step 7: Deploying changes to preprod stage..." -ForegroundColor Cyan
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
