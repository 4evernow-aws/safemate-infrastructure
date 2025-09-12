# SafeMate Lambda Functions Deployment Script
# This script deploys the fixed user onboarding and post-confirmation functions

Write-Host "🚀 SafeMate Lambda Functions Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Set variables
$REGION = "ap-southeast-2"
$USER_ONBOARDING_FUNCTION = "default-safemate-user-onboarding"
$POST_CONFIRMATION_FUNCTION = "default-safemate-post-confirmation-wallet-creator"

# Function to create deployment package
function Create-DeploymentPackage {
    param(
        [string]$FunctionPath,
        [string]$PackageName
    )
    
    Write-Host "📦 Creating deployment package for $PackageName..." -ForegroundColor Yellow
    
    # Create temp directory
    $tempDir = "temp-deploy-$PackageName"
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    # Copy function files
    Copy-Item "$FunctionPath\index.js" "$tempDir\"
    Copy-Item "$FunctionPath\package.json" "$tempDir\"
    
    # Install dependencies
    Set-Location $tempDir
    npm install --production
    Set-Location ..
    
    # Create ZIP file
    $zipPath = "$PackageName.zip"
    if (Test-Path $zipPath) {
        Remove-Item $zipPath
    }
    
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath
    
    # Cleanup
    Remove-Item -Recurse -Force $tempDir
    
    Write-Host "✅ Deployment package created: $zipPath" -ForegroundColor Green
    return $zipPath
}

# Function to update Lambda function
function Update-LambdaFunction {
    param(
        [string]$FunctionName,
        [string]$ZipPath
    )
    
    Write-Host "🔄 Updating Lambda function: $FunctionName..." -ForegroundColor Yellow
    
    try {
        aws lambda update-function-code `
            --function-name $FunctionName `
            --zip-file "fileb://$ZipPath" `
            --region $REGION
        
        Write-Host "✅ Lambda function updated successfully: $FunctionName" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to update Lambda function: $FunctionName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to update Lambda environment variables
function Update-LambdaEnvironment {
    param(
        [string]$FunctionName,
        [hashtable]$EnvironmentVars
    )
    
    Write-Host "🔧 Updating environment variables for: $FunctionName..." -ForegroundColor Yellow
    
    try {
        $envString = ""
        foreach ($key in $EnvironmentVars.Keys) {
            if ($envString) { $envString += "," }
            $envString += "$key=$($EnvironmentVars[$key])"
        }
        
        aws lambda update-function-configuration `
            --function-name $FunctionName `
            --environment "Variables={$envString}" `
            --region $REGION
        
        Write-Host "✅ Environment variables updated for: $FunctionName" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to update environment variables for: $FunctionName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Main deployment process
try {
    # 1. Deploy User Onboarding Function
    Write-Host "`n📋 Step 1: Deploying User Onboarding Function" -ForegroundColor Cyan
    $userOnboardingZip = Create-DeploymentPackage "services/user-onboarding" "user-onboarding"
    
    if (Update-LambdaFunction $USER_ONBOARDING_FUNCTION $userOnboardingZip) {
        Write-Host "✅ User onboarding function deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ User onboarding function deployment failed" -ForegroundColor Red
        exit 1
    }
    
    # 2. Deploy Post-Confirmation Function
    Write-Host "`n📋 Step 2: Deploying Post-Confirmation Function" -ForegroundColor Cyan
    $postConfirmationZip = Create-DeploymentPackage "services/post-confirmation-wallet-creator" "post-confirmation"
    
    if (Update-LambdaFunction $POST_CONFIRMATION_FUNCTION $postConfirmationZip) {
        Write-Host "✅ Post-confirmation function deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Post-confirmation function deployment failed" -ForegroundColor Red
        exit 1
    }
    
    # 3. Update Post-Confirmation Environment Variables
    Write-Host "`n📋 Step 3: Updating Environment Variables" -ForegroundColor Cyan
    $postConfirmationEnv = @{
        "USER_ONBOARDING_FUNCTION" = $USER_ONBOARDING_FUNCTION
        "REGION" = $REGION
    }
    
    if (Update-LambdaEnvironment $POST_CONFIRMATION_FUNCTION $postConfirmationEnv) {
        Write-Host "✅ Post-confirmation environment variables updated" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to update post-confirmation environment variables" -ForegroundColor Red
        exit 1
    }
    
    # 4. Cleanup
    Write-Host "`n🧹 Cleaning up deployment files..." -ForegroundColor Yellow
    if (Test-Path $userOnboardingZip) { Remove-Item $userOnboardingZip }
    if (Test-Path $postConfirmationZip) { Remove-Item $postConfirmationZip }
    
    Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "✅ User Onboarding Function: $USER_ONBOARDING_FUNCTION" -ForegroundColor Green
    Write-Host "✅ Post-Confirmation Function: $POST_CONFIRMATION_FUNCTION" -ForegroundColor Green
    Write-Host "✅ Environment Variables: Configured" -ForegroundColor Green
    Write-Host "`n🔗 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Test the integration with: node test-hedera-integration-fixed.js" -ForegroundColor White
    Write-Host "   2. Monitor CloudWatch logs for any errors" -ForegroundColor White
    Write-Host "   3. Test user registration flow" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} 