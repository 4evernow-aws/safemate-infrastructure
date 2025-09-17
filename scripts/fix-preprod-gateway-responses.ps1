# Fix Preprod API Gateway Responses with CORS Headers
# This script copies the CORS configuration from dev to preprod

Write-Host "🔧 Fixing Preprod API Gateway Responses with CORS Headers..." -ForegroundColor Yellow

$API_ID = "ol212feqdl"

Write-Host "API ID: $API_ID" -ForegroundColor Cyan

# CORS headers configuration
$corsHeaders = @{
    "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept,x-cognito-id-token,x-cognito-access-token'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'*'"
}

# List of response types to fix
$responseTypes = @(
    "DEFAULT_4XX",
    "DEFAULT_5XX", 
    "UNAUTHORIZED",
    "ACCESS_DENIED",
    "INVALID_API_KEY",
    "EXPIRED_TOKEN",
    "MISSING_AUTHENTICATION_TOKEN",
    "INVALID_SIGNATURE",
    "AUTHORIZER_FAILURE",
    "AUTHORIZER_CONFIGURATION_ERROR",
    "API_CONFIGURATION_ERROR",
    "INTEGRATION_FAILURE",
    "INTEGRATION_TIMEOUT",
    "BAD_REQUEST_PARAMETERS",
    "BAD_REQUEST_BODY",
    "REQUEST_TOO_LARGE",
    "THROTTLED",
    "QUOTA_EXCEEDED",
    "WAF_FILTERED",
    "RESOURCE_NOT_FOUND",
    "UNSUPPORTED_MEDIA_TYPE"
)

Write-Host "Updating gateway responses with CORS headers..." -ForegroundColor Cyan

foreach ($responseType in $responseTypes) {
    Write-Host "Updating $responseType..." -ForegroundColor Yellow
    
    # Convert hashtable to JSON string for AWS CLI
    $responseParamsJson = ($corsHeaders | ConvertTo-Json -Compress).Replace('"', '\"')
    
    # Update the gateway response
    aws apigateway put-gateway-response `
        --rest-api-id $API_ID `
        --response-type $responseType `
        --response-parameters $responseParamsJson `
        --response-templates '{"application/json": "{\"message\":$context.error.messageString}"}'
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to update $responseType" -ForegroundColor Red
    } else {
        Write-Host "✅ Updated $responseType" -ForegroundColor Green
    }
}

# Special handling for UNAUTHORIZED response
Write-Host "Updating UNAUTHORIZED response with specific message..." -ForegroundColor Cyan
aws apigateway put-gateway-response `
    --rest-api-id $API_ID `
    --response-type UNAUTHORIZED `
    --status-code 401 `
    --response-parameters ($corsHeaders | ConvertTo-Json -Compress).Replace('"', '\"') `
    --response-templates '{"application/json": "{\"message\":\"Unauthorized\"}"}'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to update UNAUTHORIZED response" -ForegroundColor Red
} else {
    Write-Host "✅ Updated UNAUTHORIZED response" -ForegroundColor Green
}

# Special handling for ACCESS_DENIED response
Write-Host "Updating ACCESS_DENIED response with specific message..." -ForegroundColor Cyan
aws apigateway put-gateway-response `
    --rest-api-id $API_ID `
    --response-type ACCESS_DENIED `
    --status-code 403 `
    --response-parameters ($corsHeaders | ConvertTo-Json -Compress).Replace('"', '\"') `
    --response-templates '{"application/json": "{\"message\":\"Access Denied\"}"}'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to update ACCESS_DENIED response" -ForegroundColor Red
} else {
    Write-Host "✅ Updated ACCESS_DENIED response" -ForegroundColor Green
}

# Deploy the changes
Write-Host "Deploying changes to preprod stage..." -ForegroundColor Cyan
aws apigateway create-deployment `
    --rest-api-id $API_ID `
    --stage-name preprod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to deploy changes" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Gateway responses fix completed successfully!" -ForegroundColor Green
Write-Host "🔗 API Endpoint: https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/preprod" -ForegroundColor Cyan
Write-Host "📋 Test the endpoint: https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/preprod/onboarding/status" -ForegroundColor Cyan
