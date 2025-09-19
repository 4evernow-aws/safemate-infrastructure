# CORS Fix Commands for SafeMate API Gateway
# Run these commands one by one in PowerShell

$restApiId = "2kwe2ly8vh"
$region = "ap-southeast-2"

Write-Host "🔧 CORS Fix Commands for SafeMate API Gateway"
Write-Host "=============================================="
Write-Host ""

# Step 1: Check current API Gateway status
Write-Host "Step 1: Check API Gateway status"
Write-Host "Command: aws apigateway get-rest-api --rest-api-id $restApiId --region $region"
Write-Host ""

# Step 2: Check current resources
Write-Host "Step 2: Check current resources"
Write-Host "Command: aws apigateway get-resources --rest-api-id $restApiId --region $region"
Write-Host ""

# Step 3: Fix CORS for /folders endpoint
Write-Host "Step 3: Fix CORS for /folders endpoint"
Write-Host "Command: aws apigateway put-method --rest-api-id $restApiId --resource-id p6nzw7 --http-method OPTIONS --authorization-type NONE --region $region"
Write-Host ""

# Step 4: Create mock integration for OPTIONS
Write-Host "Step 4: Create mock integration for OPTIONS"
Write-Host "Command: aws apigateway put-integration --rest-api-id $restApiId --resource-id p6nzw7 --http-method OPTIONS --type MOCK --request-templates '{\"application/json\": \"{\\\"statusCode\\\": 200}\"}' --region $region"
Write-Host ""

# Step 5: Create method response for OPTIONS
Write-Host "Step 5: Create method response for OPTIONS"
Write-Host "Command: aws apigateway put-method-response --rest-api-id $restApiId --resource-id p6nzw7 --http-method OPTIONS --status-code 200 --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\": true, \"method.response.header.Access-Control-Allow-Methods\": true, \"method.response.header.Access-Control-Allow-Origin\": true, \"method.response.header.Access-Control-Allow-Credentials\": true}' --region $region"
Write-Host ""

# Step 6: Create integration response for OPTIONS
Write-Host "Step 6: Create integration response for OPTIONS"
Write-Host "Command: aws apigateway put-integration-response --rest-api-id $restApiId --resource-id p6nzw7 --http-method OPTIONS --status-code 200 --response-parameters '{\"method.response.header.Access-Control-Allow-Headers\": \"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\", \"method.response.header.Access-Control-Allow-Methods\": \"GET,POST,PUT,DELETE,OPTIONS\", \"method.response.header.Access-Control-Allow-Origin\": \"*\", \"method.response.header.Access-Control-Allow-Credentials\": \"true\"}' --region $region"
Write-Host ""

# Step 7: Deploy the API
Write-Host "Step 7: Deploy the API"
Write-Host "Command: aws apigateway create-deployment --rest-api-id $restApiId --stage-name preprod --region $region"
Write-Host ""

# Step 8: Test CORS
Write-Host "Step 8: Test CORS"
Write-Host "Command: Invoke-WebRequest -Uri 'https://$restApiId.execute-api.$region.amazonaws.com/preprod/folders' -Method OPTIONS -Headers @{'Origin'='http://preprod-safemate-static-hosting.s3-website-ap-southeast-2.amazonaws.com'; 'Access-Control-Request-Method'='GET'; 'Access-Control-Request-Headers'='Content-Type,Authorization'} -UseBasicParsing"
Write-Host ""

Write-Host "🎉 Copy and paste these commands one by one into PowerShell!"
Write-Host "Start with Step 1 and work your way down."
