# Fix API Gateway Integration - Update to Ultimate Wallet Service
# This script updates the API Gateway to point to the correct Lambda function

Write-Host "🔧 Fixing API Gateway Integration..." -ForegroundColor Yellow

# API Gateway and Lambda details
$API_GATEWAY_ID = "527ye7o1j0"
$LAMBDA_FUNCTION_NAME = "default-safemate-ultimate-wallet"
$REGION = "ap-southeast-2"

Write-Host "API Gateway ID: $API_GATEWAY_ID" -ForegroundColor Cyan
Write-Host "Lambda Function: $LAMBDA_FUNCTION_NAME" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan

# Get Lambda function ARN
Write-Host "Getting Lambda function ARN..." -ForegroundColor Yellow
$LAMBDA_ARN = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get Lambda function ARN" -ForegroundColor Red
    exit 1
}

Write-Host "Lambda ARN: $LAMBDA_ARN" -ForegroundColor Green

# Get API Gateway resources
Write-Host "Getting API Gateway resources..." -ForegroundColor Yellow
$RESOURCES = aws apigateway get-resources --rest-api-id $API_GATEWAY_ID --region $REGION --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get API Gateway resources" -ForegroundColor Red
    exit 1
}

# Parse resources to find the ones we need to update
$RESOURCES_JSON = $RESOURCES | ConvertFrom-Json

Write-Host "Found resources:" -ForegroundColor Cyan
$RESOURCES_JSON.items | ForEach-Object {
    Write-Host "  - ID: $($_.id), Path: $($_.pathPart), Parent: $($_.parentId)" -ForegroundColor White
}

# Define the endpoints we need to update
$ENDPOINTS_TO_UPDATE = @(
    @{Path="/onboarding/status"; Method="GET"},
    @{Path="/onboarding/start"; Method="POST"},
    @{Path="/onboarding/retry"; Method="POST"},
    @{Path="/wallet/get"; Method="GET"},
    @{Path="/wallet/balance"; Method="GET"},
    @{Path="/wallet/delete"; Method="DELETE"},
    @{Path="/status"; Method="GET"}
)

# Function to find resource ID by path
function Find-ResourceIdByPath {
    param($Path)
    
    # Split path into parts
    $pathParts = $Path.Split('/') | Where-Object { $_ -ne "" }
    
    if ($pathParts.Count -eq 0) {
        return $RESOURCES_JSON.items | Where-Object { $_.parentId -eq $null } | Select-Object -First 1 -ExpandProperty id
    }
    
    $currentResource = $RESOURCES_JSON.items | Where-Object { $_.parentId -eq $null }
    
    foreach ($part in $pathParts) {
        $currentResource = $RESOURCES_JSON.items | Where-Object { 
            $_.parentId -eq $currentResource.id -and $_.pathPart -eq $part 
        }
        
        if (-not $currentResource) {
            Write-Host "❌ Could not find resource for path: $Path" -ForegroundColor Red
            return $null
        }
    }
    
    return $currentResource.id
}

# Update each endpoint
foreach ($endpoint in $ENDPOINTS_TO_UPDATE) {
    $path = $endpoint.Path
    $method = $endpoint.Method
    
    Write-Host "Updating endpoint: $method $path" -ForegroundColor Yellow
    
    # Find resource ID
    $resourceId = Find-ResourceIdByPath -Path $path
    
    if (-not $resourceId) {
        Write-Host "❌ Skipping $method $path - resource not found" -ForegroundColor Red
        continue
    }
    
    Write-Host "Resource ID: $resourceId" -ForegroundColor Cyan
    
    # Update the integration
    $updateCommand = @"
aws apigateway update-integration --rest-api-id $API_GATEWAY_ID --resource-id $resourceId --http-method $method --patch-operations op=replace,path=/uri,value="$LAMBDA_ARN" --region $REGION
"@
    
    Write-Host "Executing update command..." -ForegroundColor Gray
    Invoke-Expression $updateCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Updated $method $path" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to update $method $path" -ForegroundColor Red
    }
}

# Deploy the API
Write-Host "Deploying API Gateway..." -ForegroundColor Yellow
aws apigateway create-deployment --rest-api-id $API_GATEWAY_ID --stage-name default --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ API Gateway deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy API Gateway" -ForegroundColor Red
}

Write-Host "🔧 API Gateway integration fix completed!" -ForegroundColor Green
Write-Host "Test the endpoints now in your browser." -ForegroundColor Cyan
