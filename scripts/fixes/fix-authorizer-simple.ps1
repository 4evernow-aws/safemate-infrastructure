# Simple script to fix API Gateway Authorizer
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

Write-Host "ðŸ”§ Fixing API Gateway Authorizer..."
Write-Host "API ID: $apiId"
Write-Host "Authorizer ID: $authorizerId"
Write-Host "Correct User Pool ARN: $userPoolArn"

# Get current authorizer details
Write-Host "`nðŸ“‹ Getting current authorizer details..."
$currentAuthorizer = aws apigateway get-authorizer --rest-api-id $apiId --authorizer-id $authorizerId --region $region | ConvertFrom-Json

Write-Host "Current authorizer name: $($currentAuthorizer.name)"
Write-Host "Current provider ARNs: $($currentAuthorizer.providerARNs -join ', ')"

# Delete the old authorizer
Write-Host "`nðŸ—‘ï¸ Deleting old authorizer..."
aws apigateway delete-authorizer --rest-api-id $apiId --authorizer-id $authorizerId --region $region

# Create new authorizer
Write-Host "`nâž• Creating new authorizer..."
$newAuthorizer = aws apigateway create-authorizer --rest-api-id $apiId --name $currentAuthorizer.name --type COGNITO_USER_POOLS --provider-arns $userPoolArn --region $region | ConvertFrom-Json

Write-Host "âœ… New authorizer created with ID: $($newAuthorizer.id)"

# Deploy the API
Write-Host "`nðŸš€ Deploying API Gateway..."
aws apigateway create-deployment --rest-api-id $apiId --stage-name default --region $region

Write-Host "`nðŸŽ‰ API Gateway Authorizer fix completed!"
Write-Host "The authorizer should now accept tokens from User Pool: ap-southeast-2_uLgMRpWlw"

