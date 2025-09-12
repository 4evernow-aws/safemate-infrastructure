# Fix API Gateway Authorizer Configuration
# This script updates the API Gateway authorizers to use the correct User Pool ARN

$region = "ap-southeast-2"
$userPoolId = "ap-southeast-2_uLgMRpWlw"
$userPoolArn = "arn:aws:cognito-idp:$region`:994220462693:userpool/$userPoolId"

Write-Host "🔧 Fixing API Gateway Authorizer Configuration..."
Write-Host "User Pool ID: $userPoolId"
Write-Host "User Pool ARN: $userPoolArn"

# List all API Gateways
Write-Host "`n📋 Listing API Gateways..."
$apis = aws apigateway get-rest-apis --region $region | ConvertFrom-Json

foreach ($api in $apis.items) {
    Write-Host "API: $($api.name) (ID: $($api.id))"
    
    # Get authorizers for this API
    $authorizers = aws apigateway get-authorizers --rest-api-id $api.id --region $region | ConvertFrom-Json
    
    foreach ($authorizer in $authorizers.items) {
        Write-Host "  Authorizer: $($authorizer.name) (ID: $($authorizer.id))"
        Write-Host "  Current Provider ARNs: $($authorizer.providerARNs -join ', ')"
        
        # Check if this authorizer needs to be updated
        if ($authorizer.providerARNs -contains "arn:aws:cognito-idp:ap-southeast-2:994220462693:userpool/ap-southeast-2_Mh0GMnzXL") {
            Write-Host "  🔧 Updating authorizer to use correct User Pool ARN..."
            
            # Create the patch document
            $patchDoc = @{
                op = "replace"
                path = "/providerARNs"
                value = @($userPoolArn)
            } | ConvertTo-Json -Depth 3
            
            # Update the authorizer
            try {
                aws apigateway update-authorizer --rest-api-id $api.id --authorizer-id $authorizer.id --patch-operations $patchDoc --region $region
                Write-Host "  ✅ Successfully updated authorizer"
            }
            catch {
                Write-Host "  ❌ Failed to update authorizer: $_"
            }
        }
        else {
            Write-Host "  ✅ Authorizer already has correct configuration"
        }
    }
}

Write-Host "`n🎉 API Gateway Authorizer fix completed!"
Write-Host "The authorizers should now accept tokens from User Pool: $userPoolId"
