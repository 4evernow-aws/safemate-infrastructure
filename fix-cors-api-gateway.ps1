# Fix CORS Configuration for API Gateway
$restApiId = "2kwe2ly8vh"
$region = "ap-southeast-2"

Write-Host "🔧 Fixing CORS configuration for API Gateway..."

# Function to add CORS to a resource
function Add-CorsToResource {
    param(
        [string]$ResourceId,
        [string]$ResourceName
    )
    
    Write-Host "Adding CORS to $ResourceName (ID: $ResourceId)..."
    
    # Add CORS configuration to the resource
    $corsConfig = @{
        "allowOrigins" = @("*")
        "allowHeaders" = @("Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "x-cognito-id-token", "x-cognito-access-token", "Accept")
        "allowMethods" = @("GET", "POST", "PUT", "DELETE", "OPTIONS")
        "allowCredentials" = $true
        "maxAge" = 86400
    }
    
    # Convert to JSON
    $corsJson = $corsConfig | ConvertTo-Json -Depth 3
    
    # Add CORS to resource
    aws apigateway put-method --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --authorization-type "NONE" --region $region
    
    # Create mock integration for OPTIONS
    aws apigateway put-integration --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --type "MOCK" --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $region
    
    # Create method response for OPTIONS
    aws apigateway put-method-response --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": true, "method.response.header.Access-Control-Allow-Methods": true, "method.response.header.Access-Control-Allow-Origin": true, "method.response.header.Access-Control-Allow-Credentials": true}' --region $region
    
    # Create integration response for OPTIONS
    aws apigateway put-integration-response --rest-api-id $restApiId --resource-id $ResourceId --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept'"'"'", "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'", "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'", "method.response.header.Access-Control-Allow-Credentials": "'"'"'true'"'"'"}' --region $region
    
    Write-Host "✅ CORS added to $ResourceName"
}

# Add CORS to all resources
$resources = @(
    @{Id="p6nzw7"; Name="/folders"},
    @{Id="c1gk0r"; Name="/nft/create"},
    @{Id="gi6h2y"; Name="/nft/list"},
    @{Id="1rendn"; Name="/transactions"},
    @{Id="jyvtu3"; Name="/balance"}
)

foreach ($resource in $resources) {
    Add-CorsToResource -ResourceId $resource.Id -ResourceName $resource.Name
}

Write-Host "✅ CORS configuration completed!"
Write-Host "Deploying API Gateway..."

# Deploy the API
aws apigateway create-deployment --rest-api-id $restApiId --stage-name "preprod" --region $region

Write-Host "🎉 API Gateway deployment complete!"
