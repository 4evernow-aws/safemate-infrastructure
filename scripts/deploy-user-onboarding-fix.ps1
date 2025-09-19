# Deploy User Onboarding Lambda Fix
# This script deploys the updated user-onboarding Lambda function with KMS + DynamoDB integration

Write-Host "🚀 Deploying User Onboarding Lambda Fix..." -ForegroundColor Green

# Set variables
$FUNCTION_NAME = "preprod-safemate-user-onboarding"
$REGION = "ap-southeast-2"
$SERVICE_DIR = "D:\safemate-infrastructure\services\user-onboarding"

Write-Host "📁 Service Directory: $SERVICE_DIR" -ForegroundColor Yellow
Write-Host "🔧 Function Name: $FUNCTION_NAME" -ForegroundColor Yellow
Write-Host "🌍 Region: $REGION" -ForegroundColor Yellow

# Navigate to service directory
Set-Location $SERVICE_DIR

# Remove existing zip file if it exists
if (Test-Path "user-onboarding.zip") {
    Remove-Item "user-onboarding.zip" -Force
    Write-Host "🗑️ Removed existing zip file" -ForegroundColor Yellow
}

# Create deployment package (only include necessary files)
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "index.js", "package.json" -DestinationPath "user-onboarding.zip" -Force

# Check if zip file was created
if (Test-Path "user-onboarding.zip") {
    $zipSize = (Get-Item "user-onboarding.zip").Length
    Write-Host "✅ Deployment package created: $zipSize bytes" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create deployment package" -ForegroundColor Red
    exit 1
}

# Update Lambda function code
Write-Host "🔄 Updating Lambda function code..." -ForegroundColor Yellow
try {
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file fileb://user-onboarding.zip `
        --region $REGION
    
    Write-Host "✅ Lambda function code updated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to update Lambda function code: $_" -ForegroundColor Red
    exit 1
}

# Update function configuration (if needed)
Write-Host "⚙️ Updating function configuration..." -ForegroundColor Yellow
try {
    aws lambda update-function-configuration `
        --function-name $FUNCTION_NAME `
        --timeout 90 `
        --memory-size 512 `
        --region $REGION
    
    Write-Host "✅ Lambda function configuration updated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Failed to update function configuration: $_" -ForegroundColor Yellow
}

# Test the function
Write-Host "🧪 Testing Lambda function..." -ForegroundColor Yellow
try {
    $testPayload = @{
        httpMethod = "GET"
        path = "/onboarding/status"
        headers = @{
            "Content-Type" = "application/json"
        }
        requestContext = @{
            authorizer = @{
                claims = @{
                    sub = "test-user-123"
                    email = "test@example.com"
                }
            }
        }
    } | ConvertTo-Json -Depth 10
    
    $testPayload | Out-File -FilePath "test-payload.json" -Encoding UTF8
    
    aws lambda invoke `
        --function-name $FUNCTION_NAME `
        --payload file://test-payload.json `
        --region $REGION `
        response.json
    
    if (Test-Path "response.json") {
        $response = Get-Content "response.json" | ConvertFrom-Json
        Write-Host "✅ Lambda function test completed" -ForegroundColor Green
        Write-Host "📄 Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️ Warning: Failed to test Lambda function: $_" -ForegroundColor Yellow
}

# Cleanup
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
if (Test-Path "test-payload.json") { Remove-Item "test-payload.json" -Force }
if (Test-Path "response.json") { Remove-Item "response.json" -Force }

Write-Host "🎉 User Onboarding Lambda Fix Deployment Complete!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  - Function: $FUNCTION_NAME" -ForegroundColor White
Write-Host "  - Region: $REGION" -ForegroundColor White
Write-Host "  - Version: 2.5.0 (KMS + DynamoDB)" -ForegroundColor White
Write-Host "  - Status: Deployed" -ForegroundColor White
