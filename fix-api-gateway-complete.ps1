# Complete API Gateway Fix Script
# This script will ensure all endpoints are properly configured with CORS

$restApiId = "2kwe2ly8vh"
$region = "ap-southeast-2"
$lambdaArn = "arn:aws:lambda:ap-southeast-2:994220462693:function:preprod-safemate-hedera-service"

Write-Host "🔧 Starting complete API Gateway configuration fix..."

# Function to create or update a resource
function Ensure-Resource {
    param(
        [string]$Path,
        [string]$ParentId,
        [string]$PathPart
    )
    
    Write-Host "Ensuring resource: $Path"
    
    # Check if resource exists
    $existingResource = aws apigateway get-resources --rest-api-id $restApiId --region $region --query "items[?path=='$Path']" --output json
    
    if ($existingResource -eq "[]" -or $existingResource -eq $null) {
        Write-Host "Creating resource: $Path"
        $resource = aws apigateway create-resource --rest-api-id $restApiId --parent-id $ParentId --path-part $PathPart --region $region --output json
        $resourceId = ($resource | ConvertFrom-Json).id
    } else {
        $resourceId = ($existingResource | ConvertFrom-Json)[0].id
        Write-Host "Resource exists: $Path (ID: $resourceId)"
    }
    
    return $resourceId
}

# Function to ensure method exists
function Ensure-Method {
    param(
        [string]$ResourceId,
        [string]$HttpMethod,
        [string]$ResourceName
    )
    
    Write-Host "Ensuring $HttpMethod method for $ResourceName"
    
    # Check if method exists
    $existingMethod = aws apigateway get-method --rest-api-id $restApiId --resource-id $ResourceId --http-method $HttpMethod --region $region 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating $HttpMethod method for $ResourceName"
        aws apigateway put-method --rest-api-id $restApiId --resource-id $ResourceId --http-method $HttpMethod --authorization-type "NONE" --region $region
        
        # Create integration
        aws apigateway put-integration --rest-api-id $restApiId --resource-id $ResourceId --http-method $HttpMethod --type "AWS_PROXY" --integration-http-method "POST" --uri "arn:aws:apigateway:$region`:lambda:path/2015-03-31/functions/$lambdaArn/invocations" --region $region
        
        Write-Host "✅ $HttpMethod method created for $ResourceName"
    } else {
        Write-Host "✅ $HttpMethod method already exists for $ResourceName"
    }
}

# Function to ensure OPTIONS method with CORS
function Ensure-OptionsMethod {
    param(
        [string]$ResourceId,
        [string]$ResourceName
    )
    
    Write-Host "Ensuring OPTIONS method with CORS for $ResourceName"
    
    # Check if OPTIONS method exists
    $existingOptions = aws apigateway get-method --rest-api-id $restApiId --resource-id $ResourceId --http-method "OPTIONS" --region $region 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating OPTIONS method for $ResourceName"
        
        # Create OPTIONS method
        aws apigateway put-method --rest-api-id $restApiId --resource-id $ResourceId --http-method "OPTIONS" --authorization-type "NONE" --region $region
        
        # Create mock integration for OPTIONS
        aws apigateway put-integration --rest-api-id $restApiId --resource-id $ResourceId --http-method "OPTIONS" --type "MOCK" --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region $region
        
        # Create method response for OPTIONS
        aws apigateway put-method-response --rest-api-id $restApiId --resource-id $ResourceId --http-method "OPTIONS" --status-code "200" --response-parameters '{"method.response.header.Access-Control-Allow-Headers": true, "method.response.header.Access-Control-Allow-Methods": true, "method.response.header.Access-Control-Allow-Origin": true, "method.response.header.Access-Control-Allow-Credentials": true}' --region $region
        
        # Create integration response for OPTIONS
        aws apigateway put-integration-response --rest-api-id $restApiId --resource-id $ResourceId --http-method "OPTIONS" --status-code "200" --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept'"'"'", "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'", "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'", "method.response.header.Access-Control-Allow-Credentials": "'"'"'true'"'"'"}' --region $region
        
        Write-Host "✅ OPTIONS method with CORS created for $ResourceName"
    } else {
        Write-Host "✅ OPTIONS method already exists for $ResourceName"
    }
}

# Get root resource ID
Write-Host "Getting root resource ID..."
$rootResource = aws apigateway get-resources --rest-api-id $restApiId --region $region --query "items[?path=='/']" --output json
$rootId = ($rootResource | ConvertFrom-Json)[0].id
Write-Host "Root resource ID: $rootId"

# Define all endpoints we need
$endpoints = @(
    @{Path="/folders"; PathPart="folders"; Methods=@("GET","POST","OPTIONS")},
    @{Path="/nft"; PathPart="nft"; Methods=@("GET","OPTIONS")},
    @{Path="/nft/create"; PathPart="create"; Methods=@("POST","OPTIONS")},
    @{Path="/nft/list"; PathPart="list"; Methods=@("GET","OPTIONS")},
    @{Path="/transactions"; PathPart="transactions"; Methods=@("GET","OPTIONS")},
    @{Path="/balance"; PathPart="balance"; Methods=@("GET","OPTIONS")}
)

# Create all resources and methods
foreach ($endpoint in $endpoints) {
    $parentId = $rootId
    
    # Handle nested resources
    if ($endpoint.Path -eq "/nft/create" -or $endpoint.Path -eq "/nft/list") {
        # First ensure /nft resource exists
        $nftResourceId = Ensure-Resource -Path "/nft" -ParentId $rootId -PathPart "nft"
        $parentId = $nftResourceId
    }
    
    # Create the resource
    $resourceId = Ensure-Resource -Path $endpoint.Path -ParentId $parentId -PathPart $endpoint.PathPart
    
    # Create all methods for this resource
    foreach ($method in $endpoint.Methods) {
        if ($method -eq "OPTIONS") {
            Ensure-OptionsMethod -ResourceId $resourceId -ResourceName $endpoint.Path
        } else {
            Ensure-Method -ResourceId $resourceId -HttpMethod $method -ResourceName $endpoint.Path
        }
    }
}

# Ensure Lambda permissions
Write-Host "Ensuring Lambda permissions..."
$statementId = "apigateway-invoke-$(Get-Date -Format 'yyyyMMddHHmmss')"

try {
    aws lambda add-permission --function-name "preprod-safemate-hedera-service" --statement-id $statementId --action "lambda:InvokeFunction" --principal "apigateway.amazonaws.com" --source-arn "arn:aws:execute-api:$region`:*:$restApiId/*/*" --region $region
    Write-Host "✅ Lambda permission added"
} catch {
    Write-Host "⚠️ Lambda permission may already exist"
}

# Deploy the API
Write-Host "Deploying API Gateway..."
aws apigateway create-deployment --rest-api-id $restApiId --stage-name "preprod" --region $region

Write-Host "🎉 API Gateway configuration complete!"
Write-Host "All endpoints should now be properly configured with CORS support."
