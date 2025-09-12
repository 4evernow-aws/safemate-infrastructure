# Complete API Gateway Authorizer Fix
$region = "ap-southeast-2"
$apiId = "527ye7o1j0"
$authorizerId = "kwkq99"
# Environment-specific Cognito configuration
$ENVIRONMENT = $env:NODE_ENV
if (-not $ENVIRONMENT) { $ENVIRONMENT = "development" }

$COGNITO_CONFIG = @{
    "development" = @{
        "USER_POOL_ID" = "ap-southeast-2_uLgMRpWlw"
        "USER_POOL_ARN" = "arn:aws:cognito-idp:ap-southeast-2:994220462693:userpool/ap-southeast-2_uLgMRpWlw"
    }
    "preprod" = @{
        "USER_POOL_ID" = "ap-southeast-2_pMo5BXFiM"
        "USER_POOL_ARN" = "arn:aws:cognito-idp:ap-southeast-2:994220462693:userpool/ap-southeast-2_pMo5BXFiM"
    }
}

$userPoolArn = $COGNITO_CONFIG[$ENVIRONMENT]["USER_POOL_ARN"]
if (-not $userPoolArn) { $userPoolArn = $COGNITO_CONFIG["development"]["USER_POOL_ARN"] }

Write-Host "ðŸ”§ Complete API Gateway Authorizer Fix..."
Write-Host "API ID: $apiId"
Write-Host "Authorizer ID: $authorizerId"
Write-Host "Correct User Pool ARN: $userPoolArn"

# Step 1: Remove authorization from all methods
Write-Host "`nðŸ“‹ Step 1: Removing authorization from methods..."
$resources = aws apigateway get-resources --rest-api-id $apiId --region $region | ConvertFrom-Json

foreach ($resource in $resources.items) {
    $methods = aws apigateway get-methods --rest-api-id $apiId --resource-id $resource.id --region $region | ConvertFrom-Json
    
    if ($methods.items) {
        foreach ($method in $methods.items) {
            if ($method.authorizationType -eq "COGNITO_USER_POOLS") {
                Write-Host "  Removing authorization from $($method.httpMethod) $($resource.pathPart)"
                
                aws apigateway update-method `
                    --rest-api-id $apiId `
                    --resource-id $resource.id `
                    --http-method $method.httpMethod `
                    --patch-operations op=remove,path=/authorizationType `
                    --region $region
            }
        }
    }
}

# Step 2: Delete the old authorizer
Write-Host "`nðŸ—‘ï¸ Step 2: Deleting old authorizer..."
aws apigateway delete-authorizer --rest-api-id $apiId --authorizer-id $authorizerId --region $region

# Step 3: Create new authorizer
Write-Host "`nâž• Step 3: Creating new authorizer..."
$newAuthorizer = aws apigateway create-authorizer `
    --rest-api-id $apiId `
    --name "default-safemate-onboarding-cognito-authorizer" `
    --type COGNITO_USER_POOLS `
    --provider-arns $userPoolArn `
    --region $region | ConvertFrom-Json

Write-Host "âœ… New authorizer created with ID: $($newAuthorizer.id)"

# Step 4: Re-add authorization to methods
Write-Host "`nðŸ” Step 4: Re-adding authorization to methods..."
foreach ($resource in $resources.items) {
    $methods = aws apigateway get-methods --rest-api-id $apiId --resource-id $resource.id --region $region | ConvertFrom-Json
    
    if ($methods.items) {
        foreach ($method in $methods.items) {
            # Re-add authorization to methods that should have it
            if ($resource.pathPart -eq "onboarding" -or $resource.pathPart -eq "status") {
                Write-Host "  Adding authorization to $($method.httpMethod) $($resource.pathPart)"
                
                aws apigateway update-method `
                    --rest-api-id $apiId `
                    --resource-id $resource.id `
                    --http-method $method.httpMethod `
                    --patch-operations op=add,path=/authorizationType,value=COGNITO_USER_POOLS `
                    --region $region
                
                aws apigateway update-method `
                    --rest-api-id $apiId `
                    --resource-id $resource.id `
                    --http-method $method.httpMethod `
                    --patch-operations op=add,path=/authorizerId,value=$($newAuthorizer.id) `
                    --region $region
            }
        }
    }
}

# Step 5: Deploy the API
Write-Host "`nðŸš€ Step 5: Deploying API Gateway..."
aws apigateway create-deployment --rest-api-id $apiId --stage-name default --region $region

Write-Host "`nðŸŽ‰ Complete API Gateway Authorizer fix completed!"
Write-Host "The authorizer should now accept tokens from User Pool: ap-southeast-2_uLgMRpWlw"

