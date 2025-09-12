# Fix CORS Configuration for Onboarding Endpoints
Write-Host "ðŸ”§ Fixing CORS Configuration for Onboarding Endpoints..." -ForegroundColor Green

$restApiId = "527ye7o1j0"
$region = "ap-southeast-2"

# Get the resource IDs for onboarding endpoints
Write-Host "ðŸ“‹ Getting resource IDs for onboarding endpoints..." -ForegroundColor Yellow

$resources = aws apigateway get-resources --rest-api-id $restApiId --region $region --output json | ConvertFrom-Json

# Find onboarding endpoints
$onboardingResources = $resources.items | Where-Object { $_.path -like "*/onboarding/*" }

Write-Host "Found onboarding resources:" -ForegroundColor Cyan
$onboardingResources | ForEach-Object {
    Write-Host "  - $($_.path) (ID: $($_.id))" -ForegroundColor White
}

# Apply CORS fix to each onboarding endpoint
foreach ($resource in $onboardingResources) {
    $resourceId = $resource.id
    $path = $resource.path
    
    Write-Host "ðŸ”§ Fixing CORS for $path..." -ForegroundColor Yellow
    
    # Get methods for this resource
    $methods = $resource.resourceMethods.PSObject.Properties.Name
    
    foreach ($method in $methods) {
        if ($method -eq "OPTIONS") {
            Write-Host "  - Skipping OPTIONS method (already handled)" -ForegroundColor Gray
            continue
        }
        
        Write-Host "  - Applying CORS fix to $method method..." -ForegroundColor Gray
        
        try {
            # Apply CORS patch
            aws apigateway update-integration-response `
                --rest-api-id $restApiId `
                --resource-id $resourceId `
                --http-method $method `
                --status-code 200 `
                --patch-operations file://fix-cors-api-gateway-specific.json `
                --region $region
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    âœ… Successfully applied CORS fix to $method" -ForegroundColor Green
            } else {
                Write-Host "    âŒ Failed to apply CORS fix to $method" -ForegroundColor Red
            }
        } catch {
            Write-Host "    âŒ Error applying CORS fix to $method" -ForegroundColor Red
        }
    }
}

Write-Host "ðŸŽ‰ CORS configuration fix completed!" -ForegroundColor Green
Write-Host "The onboarding endpoints should now properly handle CORS requests from localhost:5173" -ForegroundColor Yellow

