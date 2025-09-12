# Fix 401 Unauthorized Error - Deployment Script
# This script deploys the fixes for the API Gateway Cognito Authorizer issue

Write-Host "🔧 Fixing 401 Unauthorized Error" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Step 1: Build and deploy the updated Lambda function
Write-Host "`n📦 Step 1: Building Lambda function..." -ForegroundColor Yellow
Set-Location "services/user-onboarding"

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Cyan
if (Test-Path "deployment-package.zip") {
    Remove-Item "deployment-package.zip" -Force
}

Compress-Archive -Path "index.js", "package.json", "package-lock.json", "node_modules" -DestinationPath "deployment-package.zip"

# Deploy to AWS Lambda
Write-Host "🚀 Deploying to AWS Lambda..." -ForegroundColor Cyan
$functionName = "safemate-user-onboarding"
$region = "ap-southeast-2"

aws lambda update-function-code --function-name $functionName --zip-file fileb://deployment-package.zip --region $region

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Lambda function updated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update Lambda function" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy Terraform changes
Write-Host "`n🏗️ Step 2: Deploying Terraform changes..." -ForegroundColor Yellow
Set-Location "../../terraform"

# Plan Terraform changes
Write-Host "📋 Planning Terraform changes..." -ForegroundColor Cyan
terraform plan -out=fix-401-plan.tfplan

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Terraform plan created successfully" -ForegroundColor Green
    
    # Apply changes
    Write-Host "🚀 Applying Terraform changes..." -ForegroundColor Cyan
    terraform apply fix-401-plan.tfplan
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Terraform changes applied successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to apply Terraform changes" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Failed to create Terraform plan" -ForegroundColor Red
    exit 1
}

# Step 3: Test the fix
Write-Host "`n🧪 Step 3: Testing the fix..." -ForegroundColor Yellow
Write-Host "📋 To test the fix:" -ForegroundColor Cyan
Write-Host "1. Open the browser console at http://localhost:5173" -ForegroundColor White
Write-Host "2. Look for the enhanced debugging output" -ForegroundColor White
Write-Host "3. Check if the 401 error is resolved" -ForegroundColor White
Write-Host "4. If still failing, check the Lambda CloudWatch logs" -ForegroundColor White

# Step 4: Cleanup
Write-Host "`n🧹 Step 4: Cleaning up..." -ForegroundColor Yellow
Set-Location "../services/user-onboarding"
if (Test-Path "deployment-package.zip") {
    Remove-Item "deployment-package.zip" -Force
    Write-Host "✅ Cleaned up deployment package" -ForegroundColor Green
}

Write-Host "`n🎉 Fix deployment completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "📋 Changes made:" -ForegroundColor Yellow
Write-Host "  ✅ Enhanced Lambda function debugging" -ForegroundColor Green
Write-Host "  ✅ Improved authorization context handling" -ForegroundColor Green
Write-Host "  ✅ Enhanced frontend error handling" -ForegroundColor Green
Write-Host "  ✅ Added comprehensive logging" -ForegroundColor Green
Write-Host "`n🔍 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the application in the browser" -ForegroundColor White
Write-Host "  2. Check CloudWatch logs for detailed debugging info" -ForegroundColor White
Write-Host "  3. If issues persist, run the diagnostic test script" -ForegroundColor White
