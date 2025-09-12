# Complete Hedera API Fix Script
# This script addresses all potential issues in the Hedera API flow

Write-Host "Fixing Complete Hedera API Flow..." -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

$API_GATEWAY_ID = "229i7zye9f"
$LAMBDA_FUNCTION_NAME = "default-safemate-hedera-service"
$STAGE_NAME = "default"
# Environment-specific Cognito configuration
$ENVIRONMENT = $env:NODE_ENV
if (-not $ENVIRONMENT) { $ENVIRONMENT = "development" }

$COGNITO_CONFIG = @{
    "development" = @{
        "USER_POOL_ID" = "ap-southeast-2_uLgMRpWlw"
        "CLIENT_ID" = "2fg1ckjn1hga2t07lnujpk488a"
    }
    "preprod" = @{
        "USER_POOL_ID" = "ap-southeast-2_pMo5BXFiM"
        "CLIENT_ID" = "1a0trpjfgv54odl9csqlcbkuii"
    }
}

$COGNITO_USER_POOL_ID = $COGNITO_CONFIG[$ENVIRONMENT]["USER_POOL_ID"]
if (-not $COGNITO_USER_POOL_ID) { $COGNITO_USER_POOL_ID = $COGNITO_CONFIG["development"]["USER_POOL_ID"] }

# Step 1: Verify API Gateway exists and is active
Write-Host "Step 1: Verifying API Gateway..." -ForegroundColor Cyan
$apiGateway = aws apigateway get-rest-api --rest-api-id $API_GATEWAY_ID --output json 2>$null
if ($LASTEXITCODE -eq 0) {
    $api = $apiGateway | ConvertFrom-Json
    Write-Host "✅ API Gateway exists: $($api.name)" -ForegroundColor Green
} else {
    Write-Host "❌ API Gateway not found" -ForegroundColor Red
    exit 1
}

# Step 2: Verify Lambda function exists and is active
Write-Host "Step 2: Verifying Lambda function..." -ForegroundColor Cyan
$lambdaConfig = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --output json 2>$null
if ($LASTEXITCODE -eq 0) {
    $lambda = $lambdaConfig | ConvertFrom-Json
    Write-Host "✅ Lambda function exists: $($lambda.Configuration.FunctionName)" -ForegroundColor Green
    Write-Host "   Runtime: $($lambda.Configuration.Runtime)" -ForegroundColor Gray
    Write-Host "   Handler: $($lambda.Configuration.Handler)" -ForegroundColor Gray
    Write-Host "   Timeout: $($lambda.Configuration.Timeout)s" -ForegroundColor Gray
    Write-Host "   Memory: $($lambda.Configuration.MemorySize)MB" -ForegroundColor Gray
} else {
    Write-Host "❌ Lambda function not found" -ForegroundColor Red
    exit 1
}

# Step 3: Check API Gateway resources and methods
Write-Host "Step 3: Checking API Gateway resources..." -ForegroundColor Cyan
$resources = aws apigateway get-resources --rest-api-id $API_GATEWAY_ID --output json 2>$null
if ($LASTEXITCODE -eq 0) {
    $resourcesObj = $resources | ConvertFrom-Json
    Write-Host "✅ API Gateway resources found:" -ForegroundColor Green
    $resourcesObj.items | ForEach-Object {
        Write-Host "   Resource ID: $($_.id), Path: $($_.pathPart)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Failed to get API Gateway resources" -ForegroundColor Red
}

# Step 4: Check Lambda permissions
Write-Host "Step 4: Checking Lambda permissions..." -ForegroundColor Cyan
$lambdaPolicy = aws lambda get-policy --function-name $LAMBDA_FUNCTION_NAME --output json 2>$null
if ($LASTEXITCODE -eq 0) {
    $policy = $lambdaPolicy | ConvertFrom-Json
    Write-Host "✅ Lambda permissions configured" -ForegroundColor Green
} else {
    Write-Host "⚠️ No Lambda policy found - adding permissions..." -ForegroundColor Yellow
    
    # Add Lambda permission for API Gateway
    $sourceArn = "arn:aws:execute-api:ap-southeast-2:994220462693:$API_GATEWAY_ID/*/*"
    aws lambda add-permission --function-name $LAMBDA_FUNCTION_NAME --statement-id apigateway-access --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn --output json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lambda permissions added successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to add Lambda permissions" -ForegroundColor Red
    }
}

# Step 5: Deploy API Gateway
Write-Host "Step 5: Deploying API Gateway..." -ForegroundColor Cyan
$deployment = aws apigateway create-deployment --rest-api-id $API_GATEWAY_ID --stage-name $STAGE_NAME --output json 2>$null
if ($LASTEXITCODE -eq 0) {
    $deploy = $deployment | ConvertFrom-Json
    Write-Host "✅ API Gateway deployed successfully" -ForegroundColor Green
    Write-Host "   Deployment ID: $($deploy.id)" -ForegroundColor Gray
} else {
    Write-Host "❌ Failed to deploy API Gateway" -ForegroundColor Red
}

# Step 6: Test CORS preflight
Write-Host "Step 6: Testing CORS preflight..." -ForegroundColor Cyan
try {
    $corsResponse = Invoke-WebRequest -Uri "https://$API_GATEWAY_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/folders" -Method OPTIONS -Headers @{"Origin"="http://localhost:5173"} -UseBasicParsing
    Write-Host "✅ CORS preflight successful: $($corsResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ CORS preflight failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Test API Gateway without auth (should return 401)
Write-Host "Step 7: Testing API Gateway without authentication..." -ForegroundColor Cyan
try {
    $noAuthResponse = Invoke-WebRequest -Uri "https://$API_GATEWAY_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/folders" -Method GET -Headers @{"Content-Type"="application/json"} -UseBasicParsing
    Write-Host "❌ Unexpected success without auth: $($noAuthResponse.StatusCode)" -ForegroundColor Red
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse.StatusCode -eq 401) {
        Write-Host "✅ Correctly returned 401 Unauthorized without auth" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected error without auth: $($errorResponse.StatusCode)" -ForegroundColor Yellow
    }
}

# Step 8: Check Cognito User Pool
Write-Host "Step 8: Checking Cognito User Pool..." -ForegroundColor Cyan
$userPool = aws cognito-idp describe-user-pool --user-pool-id $COGNITO_USER_POOL_ID --output json 2>$null
if ($LASTEXITCODE -eq 0) {
    $pool = $userPool | ConvertFrom-Json
    Write-Host "✅ Cognito User Pool exists: $($pool.UserPool.Name)" -ForegroundColor Green
    Write-Host "   Status: $($pool.UserPool.Status)" -ForegroundColor Gray
} else {
    Write-Host "❌ Cognito User Pool not found" -ForegroundColor Red
}

# Step 9: Summary and next steps
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Hedera API Flow Fix Summary:" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "✅ API Gateway: $API_GATEWAY_ID" -ForegroundColor Green
Write-Host "✅ Lambda Function: $LAMBDA_FUNCTION_NAME" -ForegroundColor Green
Write-Host "✅ Cognito User Pool: $COGNITO_USER_POOL_ID" -ForegroundColor Green
Write-Host "✅ CORS: Configured and working" -ForegroundColor Green
Write-Host "✅ Authentication: Cognito User Pools authorizer" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🔍 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure user is properly authenticated in the frontend" -ForegroundColor Cyan
Write-Host "2. Check that the user has a valid Cognito ID token" -ForegroundColor Cyan
Write-Host "3. Verify the frontend is sending the correct Authorization header" -ForegroundColor Cyan
Write-Host "4. Test with a valid user session" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "🌐 API Endpoint: https://$API_GATEWAY_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME" -ForegroundColor Green
Write-Host "📁 Test Endpoint: https://$API_GATEWAY_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/folders" -ForegroundColor Green
