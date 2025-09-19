# Manual API Gateway Configuration Fix
# This script addresses the specific CORS and endpoint mapping issues

$restApiId = "2kwe2ly8vh"
$region = "ap-southeast-2"
$lambdaArn = "arn:aws:lambda:ap-southeast-2:994220462693:function:preprod-safemate-hedera-service"

Write-Host "🔧 Fixing API Gateway configuration for SafeMate..."

# Step 1: Ensure Lambda permissions
Write-Host "1. Ensuring Lambda permissions..."
aws lambda add-permission --function-name "preprod-safemate-hedera-service" --statement-id "apigateway-invoke-$(Get-Date -Format 'yyyyMMddHHmmss')" --action "lambda:InvokeFunction" --principal "apigateway.amazonaws.com" --source-arn "arn:aws:execute-api:$region`:*:$restApiId/*/*" --region $region

# Step 2: Create/Update CORS configuration for each endpoint
$endpoints = @(
    @{ResourceId="p6nzw7"; Path="/folders"; Methods=@("GET","POST")},
    @{ResourceId="c1gk0r"; Path="/nft/create"; Methods=@("POST")},
    @{ResourceId="gi6h2y"; Path="/nft/list"; Methods=@("GET")},
    @{ResourceId="1rendn"; Path="/transactions"; Methods=@("GET")},
    @{ResourceId="jyvtu3"; Path="/balance"; Methods=@("GET")}
)

foreach ($endpoint in $endpoints) {
    Write-Host "2. Configuring $($endpoint.Path)..."
    
    foreach ($method in $endpoint.Methods) {
        # Create/Update method
        aws apigateway put-method --rest-api-id $restApiId --resource-id $endpoint.ResourceId --http-method $method --authorization-type "NONE" --region $region
        
        # Create/Update integration
        aws apigateway put-integration --rest-api-id $restApiId --resource-id $endpoint.ResourceId --http-method $method --type "AWS_PROXY" --integration-http-method "POST" --uri "arn:aws:apigateway:$region`:lambda:path/2015-03-31/functions/$lambdaArn/invocations" --region $region
        
        Write-Host "   ✅ $method method configured"
    }
    
    # Ensure OPTIONS method for CORS
    Write-Host "3. Configuring CORS for $($endpoint.Path)..."
    
    # Create OPTIONS method
    aws apigateway put-method --rest-api-id $restApiId --resource-id $endpoint.ResourceId --http-method "OPTIONS" --authorization-type "NONE" --region $region
    
    # Create mock integration for OPTIONS
    aws apigateway put-integration --rest-api-id $restApiId --resource-id $endpoint.ResourceId --http-method "OPTIONS" --type "MOCK" --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $region
    
    # Create method response for OPTIONS
    aws apigateway put-method-response --rest-api-id $restApiId --resource-id $endpoint.ResourceId --http-method "OPTIONS" --status-code "200" --response-parameters '{"method.response.header.Access-Control-Allow-Headers": true, "method.response.header.Access-Control-Allow-Methods": true, "method.response.header.Access-Control-Allow-Origin": true, "method.response.header.Access-Control-Allow-Credentials": true}' --region $region
    
    # Create integration response for OPTIONS
    aws apigateway put-integration-response --rest-api-id $restApiId --resource-id $endpoint.ResourceId --http-method "OPTIONS" --status-code "200" --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept'"'"'", "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'", "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'", "method.response.header.Access-Control-Allow-Credentials": "'"'"'true'"'"'"}' --region $region
    
    Write-Host "   ✅ CORS configured"
}

# Step 4: Deploy the API
Write-Host "4. Deploying API Gateway..."
aws apigateway create-deployment --rest-api-id $restApiId --stage-name "preprod" --region $region

Write-Host "🎉 API Gateway configuration complete!"
Write-Host "All endpoints should now work properly with CORS support."
