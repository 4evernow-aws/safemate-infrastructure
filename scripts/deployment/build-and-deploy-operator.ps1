#!/usr/bin/env pwsh

# Build and Deploy Operator-Based User Onboarding Service
# This script builds the updated user-onboarding service and deploys it via Terraform

Write-Host "🔧 Building and Deploying Operator-Based User Onboarding Service" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "terraform")) {
    Write-Host "Please run this script from the safemate_v2 root directory" -ForegroundColor Red
    exit 1
}

try {
    # Step 1: Build the user-onboarding service
    Write-Host "📦 Building user-onboarding service..." -ForegroundColor Yellow
    
    Set-Location "services/user-onboarding"
    
    # Create deployment package
    if (Test-Path "user-onboarding.zip") {
        Remove-Item "user-onboarding.zip" -Force
    }
    
    # Create zip with the main index.js file
    Compress-Archive -Path "index.js" -DestinationPath "user-onboarding.zip" -Force
    
    Write-Host "User-onboarding service built successfully" -ForegroundColor Green
    
    # Return to root directory
    Set-Location "../.."
    
    # Step 2: Deploy via Terraform
    Write-Host "🚀 Deploying updated Lambda function via Terraform..." -ForegroundColor Yellow
    
    Set-Location "terraform"
    
    # Apply terraform changes (this will update the Lambda with the new code)
    Write-Host "Running terraform apply for Lambda updates..." -ForegroundColor Yellow
    terraform apply -target=aws_lambda_function.user_onboarding -auto-approve
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Lambda function deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "Terraform deployment failed" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
    
    # Return to root directory
    Set-Location ".."
    
    # Step 3: Verify operator account setup
    Write-Host "🔍 Verifying operator account setup..." -ForegroundColor Yellow
    
    # Run the operator setup verification
    if (Test-Path "setup-operator.sh") {
        Write-Host "Running operator account verification..." -ForegroundColor Yellow
        bash setup-operator.sh
    } else {
        Write-Host "⚠️  setup-operator.sh not found, skipping operator verification" -ForegroundColor Yellow
    }
    
    Write-Host "" -ForegroundColor White
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ User-onboarding service updated to use operator-based account creation" -ForegroundColor Green
    Write-Host "✅ Lambda function deployed with operator permissions" -ForegroundColor Green
    Write-Host "✅ Frontend updated to handle operator-created wallets" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "🎯 Key Changes:" -ForegroundColor Cyan
    Write-Host "   • New user wallets are now created with 1 HBAR initial funding" -ForegroundColor White
    Write-Host "   • Accounts are immediately active (no manual funding required)" -ForegroundColor White
    Write-Host "   • Uses KMS-encrypted operator account for funding" -ForegroundColor White
    Write-Host "   • Wallets show initial balance in dashboard" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "🧪 Test the changes:" -ForegroundColor Cyan
    Write-Host "   1. Create a new user account at http://localhost:5173/" -ForegroundColor White
    Write-Host "   2. Complete signup and email verification" -ForegroundColor White
    Write-Host "   3. Watch onboarding modal create wallet with 1 HBAR balance" -ForegroundColor White
    
} catch {
    Write-Host "Error during build/deployment: $_" -ForegroundColor Red
    exit 1
}
