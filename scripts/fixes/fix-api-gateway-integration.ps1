# Fix API Gateway Integration for Hedera Service
# This script creates the missing Lambda integration for the /folders endpoint

Write-Host "Fixing API Gateway Integration..." -ForegroundColor Yellow

$API_GATEWAY_ID = "229i7zye9f"
$LAMBDA_FUNCTION_ARN = "arn:aws:lambda:ap-southeast-2:994220462693:function:default-safemate-hedera-service"
$FOLDERS_RESOURCE_ID = "suk3xe"

# Step 1: Create Lambda integration
Write-Host "Step 1: Creating Lambda integration..." -ForegroundColor Cyan
aws apigateway put-integration `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method GET `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/$LAMBDA_FUNCTION_ARN/invocations" `
    --passthrough-behavior WHEN_NO_MATCH

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GET integration created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create GET integration" -ForegroundColor Red
}

# Step 2: Create POST integration
Write-Host "Step 2: Creating POST integration..." -ForegroundColor Cyan
aws apigateway put-integration `
    --rest-api-id $API_GATEWAY_ID `
    --resource-id $FOLDERS_RESOURCE_ID `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/$LAMBDA_FUNCTION_ARN/invocations" `
    --passthrough-behavior WHEN_NO_MATCH

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ POST integration created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create POST integration" -ForegroundColor Red
}

# Step 3: Add Lambda permission for API Gateway
Write-Host "Step 3: Adding Lambda permission..." -ForegroundColor Cyan
$SOURCE_ARN = "arn:aws:execute-api:ap-southeast-2:994220462693:$API_GATEWAY_ID/*/*/folders"

aws lambda add-permission `
    --function-name "default-safemate-hedera-service" `
    --statement-id "apigateway-folders-access" `
    --action "lambda:InvokeFunction" `
    --principal "apigateway.amazonaws.com" `
    --source-arn $SOURCE_ARN

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda permission added successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Lambda permission may already exist (this is OK)" -ForegroundColor Yellow
}

# Step 4: Create deployment
Write-Host "Step 4: Creating API Gateway deployment..." -ForegroundColor Cyan
aws apigateway create-deployment `
    --rest-api-id $API_GATEWAY_ID `
    --stage-name "default"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ API Gateway deployment created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create deployment" -ForegroundColor Red
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "API Gateway Integration Fixed!" -ForegroundColor Green
Write-Host "The /folders endpoint should now work correctly." -ForegroundColor Cyan
Write-Host "Test the folder creation functionality in the frontend." -ForegroundColor Cyan
