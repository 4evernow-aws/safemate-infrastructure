# Fix CORS for Hedera API Gateway
# This script configures CORS for the Hedera API endpoints

Write-Host "Fixing CORS for Hedera API Gateway..." -ForegroundColor Yellow

$API_ID = "229i7zye9f"
$STAGE_NAME = "default"

# Step 1: Get all resources
Write-Host "Step 1: Getting API Gateway resources..." -ForegroundColor Cyan
$resources = aws apigateway get-resources --rest-api-id $API_ID --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get API Gateway resources" -ForegroundColor Red
    exit 1
}

$resourcesObj = $resources | ConvertFrom-Json

# Step 2: Configure CORS for each resource that has OPTIONS method
Write-Host "Step 2: Configuring CORS for resources..." -ForegroundColor Cyan

foreach ($resource in $resourcesObj.items) {
    if ($resource.resourceMethods -and $resource.resourceMethods.OPTIONS) {
        Write-Host "Configuring CORS for: $($resource.path)" -ForegroundColor Green
        
        $resourceId = $resource.id
        
        # Configure OPTIONS method response
        aws apigateway put-method-response --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Max-Age":true}' --output json
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to configure method response for $($resource.path)" -ForegroundColor Red
            continue
        }
        
        # Configure OPTIONS integration response
        aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $resourceId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"'"'"'http://localhost:5173'"'"'","method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,POST,DELETE,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Credentials":"'"'"'true'"'"'","method.response.header.Access-Control-Max-Age":"'"'"'3600'"'"'"}' --output json
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to configure integration response for $($resource.path)" -ForegroundColor Red
            continue
        }
        
        Write-Host "CORS configured for $($resource.path)" -ForegroundColor Green
    }
}

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

$testUrls = @(
    "https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/folders",
    "https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/files"
)

foreach ($testUrl in $testUrls) {
    Write-Host "Testing OPTIONS request to: $testUrl" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $testUrl -Method OPTIONS -Headers @{
            "Origin" = "http://localhost:5173"
            "Access-Control-Request-Method" = "GET"
            "Access-Control-Request-Headers" = "Content-Type,Authorization"
        } -ErrorAction Stop
        
        Write-Host "CORS test successful for $testUrl!" -ForegroundColor Green
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "CORS Headers:" -ForegroundColor Gray
        $response.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
            Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "CORS test failed for $testUrl : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "CORS fix completed for Hedera API Gateway!" -ForegroundColor Green
Write-Host "The frontend should now be able to access the Hedera API endpoints without CORS errors." -ForegroundColor Cyan
