# Fix Missing OPTIONS Methods for CORS
# This script adds OPTIONS methods to all onboarding resources

Write-Host "ðŸ”§ Adding Missing OPTIONS Methods for CORS..." -ForegroundColor Yellow

$API_ID = "527ye7o1j0"
$STAGE_NAME = "default"

# Resource IDs from the AWS CLI output
$RESOURCES = @{
    "start" = "mavtjd"    # /onboarding/start
    "status" = "gyps3r"   # /onboarding/status  
    "retry" = "tyidn1"    # /onboarding/retry
}

# CORS Configuration
$CORS_CONFIG = @{
    "Access-Control-Allow-Origin" = "`"http://localhost:5173`""
    "Access-Control-Allow-Headers" = "`"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept`""
    "Access-Control-Allow-Methods" = "`"GET,POST,OPTIONS`""
    "Access-Control-Allow-Credentials" = "`"true`""
    "Access-Control-Max-Age" = "`"3600`""
}

function Add-OPTIONSMethod {
    param($ResourceId, $ResourcePath)
    
    Write-Host "`nðŸ”§ Adding OPTIONS method for $ResourcePath (ID: $ResourceId)..." -ForegroundColor Cyan
    
    # Step 1: Add OPTIONS method
    Write-Host "  ðŸ“‹ Step 1: Adding OPTIONS method..." -ForegroundColor Yellow
    $methodCmd = "aws apigateway put-method --rest-api-id $API_ID --resource-id $ResourceId --http-method OPTIONS --authorization-type NONE"
    Write-Host "    Executing: $methodCmd" -ForegroundColor Gray
    Invoke-Expression $methodCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    âœ… OPTIONS method added successfully" -ForegroundColor Green
    } else {
        Write-Host "    âŒ Failed to add OPTIONS method" -ForegroundColor Red
        return $false
    }
    
    # Step 2: Add MOCK integration
    Write-Host "  ðŸ“‹ Step 2: Adding MOCK integration..." -ForegroundColor Yellow
    $integrationCmd = "aws apigateway put-integration --rest-api-id $API_ID --resource-id $ResourceId --http-method OPTIONS --type MOCK --request-templates '{\"application/json\":\"{\\\"statusCode\\\": 200}\"}'"
    Write-Host "    Executing: $integrationCmd" -ForegroundColor Gray
    Invoke-Expression $integrationCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    âœ… MOCK integration added successfully" -ForegroundColor Green
    } else {
        Write-Host "    âŒ Failed to add MOCK integration" -ForegroundColor Red
        return $false
    }
    
    # Step 3: Add CORS headers to method response
    Write-Host "  ðŸ“‹ Step 3: Adding CORS headers to method response..." -ForegroundColor Yellow
    $responseParams = @{}
    foreach ($header in $CORS_CONFIG.GetEnumerator()) {
        $responseParams["method.response.header.$($header.Key)"] = $true
    }
    $responseParamsJson = $responseParams | ConvertTo-Json -Compress
    
    $methodResponseCmd = "aws apigateway put-method-response --rest-api-id $API_ID --resource-id $ResourceId --http-method OPTIONS --status-code 200 --response-parameters '$responseParamsJson'"
    Write-Host "    Executing: $methodResponseCmd" -ForegroundColor Gray
    Invoke-Expression $methodResponseCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    âœ… Method response headers added successfully" -ForegroundColor Green
    } else {
        Write-Host "    âŒ Failed to add method response headers" -ForegroundColor Red
        return $false
    }
    
    # Step 4: Add CORS header values to integration response
    Write-Host "  ðŸ“‹ Step 4: Adding CORS header values to integration response..." -ForegroundColor Yellow
    $integrationParams = @{}
    foreach ($header in $CORS_CONFIG.GetEnumerator()) {
        $integrationParams["method.response.header.$($header.Key)"] = $header.Value
    }
    $integrationParamsJson = $integrationParams | ConvertTo-Json -Compress
    
    $integrationResponseCmd = "aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $ResourceId --http-method OPTIONS --status-code 200 --response-parameters '$integrationParamsJson'"
    Write-Host "    Executing: $integrationResponseCmd" -ForegroundColor Gray
    Invoke-Expression $integrationResponseCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    âœ… Integration response headers added successfully" -ForegroundColor Green
    } else {
        Write-Host "    âŒ Failed to add integration response headers" -ForegroundColor Red
        return $false
    }
    
    Write-Host "    âœ… OPTIONS method configuration completed for $ResourcePath" -ForegroundColor Green
    return $true
}

# Add OPTIONS methods to all resources
$successCount = 0
foreach ($resource in $RESOURCES.GetEnumerator()) {
    $success = Add-OPTIONSMethod -ResourceId $resource.Value -ResourcePath "/onboarding/$($resource.Key)"
    if ($success) {
        $successCount++
    }
}

# Step 5: Configure Gateway Responses for CORS
Write-Host "`nðŸ“‹ Step 5: Configuring Gateway Responses for CORS..." -ForegroundColor Cyan

$gatewayResponses = @("DEFAULT_4XX", "DEFAULT_5XX", "UNAUTHORIZED", "ACCESS_DENIED")

foreach ($response in $gatewayResponses) {
    Write-Host "  ðŸ”§ Configuring $response..." -ForegroundColor Yellow
    
    foreach ($header in $CORS_CONFIG.GetEnumerator()) {
        $gatewayCmd = "aws apigateway update-gateway-response --rest-api-id $API_ID --response-type $response --patch-operations op=add,path='/responseParameters/gatewayresponse.header.$($header.Key)',value='$($header.Value)'"
        Write-Host "    Adding $($header.Key) to $response" -ForegroundColor Gray
        Invoke-Expression $gatewayCmd
    }
    
    Write-Host "    âœ… $response configured" -ForegroundColor Green
}

# Step 6: Deploy the API
Write-Host "`nðŸ“‹ Step 6: Deploying API Gateway changes..." -ForegroundColor Cyan

$deployCmd = "aws apigateway create-deployment --rest-api-id $API_ID --stage-name $STAGE_NAME --description 'Add OPTIONS methods for CORS'"
Write-Host "Executing: $deployCmd" -ForegroundColor Yellow
Invoke-Expression $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ… API Gateway deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "âŒ Failed to deploy API Gateway" -ForegroundColor Red
}

# Summary
Write-Host "`nðŸŽ‰ OPTIONS Methods Fix Summary:" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "âœ… Resources processed: $($RESOURCES.Count)" -ForegroundColor Green
Write-Host "âœ… OPTIONS methods added: $successCount" -ForegroundColor Green
Write-Host "âœ… Gateway responses configured: $($gatewayResponses.Count)" -ForegroundColor Green

Write-Host "`nðŸ“‹ Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test the frontend to see if CORS error is resolved" -ForegroundColor White
Write-Host "   2. If you still get 500 errors, the Lambda needs environment variables" -ForegroundColor White
Write-Host "   3. If you get 401 errors, that's expected (need valid auth token)" -ForegroundColor White

Write-Host "`nðŸ”— Test URL: https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/onboarding/start" -ForegroundColor Yellow

