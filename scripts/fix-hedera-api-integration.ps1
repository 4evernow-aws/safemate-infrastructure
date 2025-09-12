# Fix API Gateway Integration for Hedera API
# This script ensures the API Gateway is properly integrated with the Lambda function

Write-Host "Fixing API Gateway Integration for Hedera API..." -ForegroundColor Yellow

$API_ID = "229i7zye9f"
$STAGE_NAME = "default"
$LAMBDA_FUNCTION_NAME = "default-safemate-hedera-service"

# Step 1: Get Lambda function ARN
Write-Host "Step 1: Getting Lambda function ARN..." -ForegroundColor Cyan
$lambdaArn = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query 'Configuration.FunctionArn' --output text

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get Lambda function ARN" -ForegroundColor Red
    exit 1
}

Write-Host "Lambda ARN: $lambdaArn" -ForegroundColor Green

# Step 2: Get API Gateway resources
Write-Host "Step 2: Getting API Gateway resources..." -ForegroundColor Cyan
$resources = aws apigateway get-resources --rest-api-id $API_ID --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get API Gateway resources" -ForegroundColor Red
    exit 1
}

$resourcesObj = $resources | ConvertFrom-Json

# Step 3: Fix integration for each resource
Write-Host "Step 3: Fixing integrations..." -ForegroundColor Cyan

foreach ($resource in $resourcesObj.items) {
    if ($resource.resourceMethods) {
        foreach ($method in $resource.resourceMethods.PSObject.Properties) {
            $httpMethod = $method.Name
            if ($httpMethod -ne "OPTIONS") {
                Write-Host "Fixing integration for: $($resource.path) $httpMethod" -ForegroundColor Green
                
                $resourceId = $resource.id
                
                # Update integration to use Lambda function
                aws apigateway put-integration --rest-api-id $API_ID --resource-id $resourceId --http-method $httpMethod --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/$lambdaArn/invocations" --output json
                
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "Failed to update integration for $($resource.path) $httpMethod" -ForegroundColor Red
                    continue
                }
                
                Write-Host "Integration updated for $($resource.path) $httpMethod" -ForegroundColor Green
            }
        }
    }
}

# Step 4: Add Lambda permission for API Gateway
Write-Host "Step 4: Adding Lambda permission..." -ForegroundColor Cyan

$sourceArn = "arn:aws:execute-api:ap-southeast-2:994220462693:$API_ID/*/*/*"

aws lambda add-permission --function-name $LAMBDA_FUNCTION_NAME --statement-id "apigateway-access" --action "lambda:InvokeFunction" --principal "apigateway.amazonaws.com" --source-arn $sourceArn --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add Lambda permission (might already exist)" -ForegroundColor Yellow
} else {
    Write-Host "Lambda permission added successfully" -ForegroundColor Green
}

# Step 5: Deploy the API
Write-Host "Step 5: Deploying API..." -ForegroundColor Cyan

aws apigateway create-deployment --rest-api-id $API_ID --stage-name $STAGE_NAME --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to deploy API" -ForegroundColor Red
    exit 1
}

Write-Host "API deployed successfully" -ForegroundColor Green

# Step 6: Test the integration
Write-Host "Step 6: Testing integration..." -ForegroundColor Cyan

$testUrl = "https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/folders"
Write-Host "Testing GET request to: $testUrl" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -Headers @{
        "Authorization" = "Bearer test"
    } -ErrorAction Stop
    
    Write-Host "Test successful!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This is expected if authentication is required" -ForegroundColor Yellow
}

Write-Host "API Gateway integration fix completed!" -ForegroundColor Green
Write-Host "The Hedera API should now be properly integrated with the Lambda function." -ForegroundColor Cyan
