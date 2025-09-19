# Manual CORS Fix for API Gateway
$restApiId = "2kwe2ly8vh"
$region = "ap-southeast-2"

Write-Host "🔧 Manually fixing CORS configuration..."

# Function to configure CORS for a resource
function Fix-CorsForResource {
    param(
        [string]$ResourceId,
        [string]$ResourceName
    )
    
    Write-Host "Fixing CORS for $ResourceName (ID: $ResourceId)..."
    
    try {
        # Create OPTIONS method
        Write-Host "  Creating OPTIONS method..."
        aws apigateway put-method --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --authorization-type NONE --region $region
        
        # Create mock integration for OPTIONS
        Write-Host "  Creating mock integration..."
        aws apigateway put-integration --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --type MOCK --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $region
        
        # Create method response for OPTIONS
        Write-Host "  Creating method response..."
        aws apigateway put-method-response --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": true, "method.response.header.Access-Control-Allow-Methods": true, "method.response.header.Access-Control-Allow-Origin": true, "method.response.header.Access-Control-Allow-Credentials": true}' --region $region
        
        # Create integration response for OPTIONS
        Write-Host "  Creating integration response..."
        aws apigateway put-integration-response --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept'"'"'", "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'", "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'", "method.response.header.Access-Control-Allow-Credentials": "'"'"'true'"'"'"}' --region $region
        
        Write-Host "  ✅ CORS configured for $ResourceName"
    } catch {
        Write-Host "  ❌ Error configuring CORS for $ResourceName`: $_"
    }
}

# Configure CORS for all endpoints
$endpoints = @(
    @{Id="p6nzw7"; Name="/folders"},
    @{Id="c1gk0r"; Name="/nft/create"},
    @{Id="gi6h2y"; Name="/nft/list"},
    @{Id="1rendn"; Name="/transactions"},
    @{Id="jyvtu3"; Name="/balance"}
)

foreach ($endpoint in $endpoints) {
    Fix-CorsForResource -ResourceId $endpoint.Id -ResourceName $endpoint.Name
}

# Deploy the API
Write-Host "Deploying API Gateway..."
aws apigateway create-deployment --rest-api-id $restApiId --stage-name preprod --region $region

Write-Host "🎉 CORS configuration complete!"
