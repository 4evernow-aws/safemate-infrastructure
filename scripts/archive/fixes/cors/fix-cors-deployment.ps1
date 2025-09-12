# Fix CORS Configuration for All Lambda Functions
# This script deploys the updated Lambda functions with proper CORS headers

Write-Host "🔧 Fixing CORS Configuration for All Lambda Functions..." -ForegroundColor Green

# Set AWS region
$region = "ap-southeast-2"

# Function names and their corresponding files
$functions = @{
    "default-safemate-user-onboarding" = "services/user-onboarding/index-rest-api.js"
    "default-safemate-wallet-creator" = "services/wallet-creator/index.js"
    "default-safemate-group-manager" = "services/group-manager/index.js"
    "default-safemate-token-vault" = "services/token-vault/index.js"
}

# Create deployment packages
Write-Host "📦 Creating deployment packages..." -ForegroundColor Yellow

foreach ($functionName in $functions.Keys) {
    $sourceFile = $functions[$functionName]
    $functionDir = Split-Path $sourceFile -Parent
    
    Write-Host "Processing $functionName from $sourceFile..." -ForegroundColor Cyan
    
    # Create a temporary directory for packaging
    $tempDir = "temp-deploy-$functionName"
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    
    # Copy the main function file
    Copy-Item $sourceFile "$tempDir/index.js"
    
    # Copy package.json if it exists
    $packageJson = Join-Path $functionDir "package.json"
    if (Test-Path $packageJson) {
        Copy-Item $packageJson $tempDir
        Write-Host "Installing dependencies for $functionName..." -ForegroundColor Gray
        Set-Location $tempDir
        npm install --production
        Set-Location ..
    }
    
    # Create ZIP file
    $zipFile = "$functionName-cors-fix.zip"
    if (Test-Path $zipFile) {
        Remove-Item $zipFile
    }
    
    Write-Host "Creating ZIP package: $zipFile" -ForegroundColor Gray
    Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile
    
    # Deploy to Lambda
    Write-Host "🚀 Deploying $functionName..." -ForegroundColor Green
    aws lambda update-function-code `
        --function-name $functionName `
        --zip-file "fileb://$zipFile" `
        --region $region
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully deployed $functionName" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to deploy $functionName" -ForegroundColor Red
    }
    
    # Clean up
    Remove-Item -Recurse -Force $tempDir
    Remove-Item $zipFile
}

Write-Host "🎉 CORS configuration deployment completed!" -ForegroundColor Green
Write-Host "All Lambda functions now have proper CORS headers that:" -ForegroundColor Yellow
Write-Host "  - Allow localhost:5173 for local development" -ForegroundColor White
Write-Host "  - Allow d19a5c2wn4mtdt.cloudfront.net for production" -ForegroundColor White
Write-Host "  - Return only ONE origin header (fixes the CORS error)" -ForegroundColor White
