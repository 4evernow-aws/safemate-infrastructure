# Fix Lambda Layer Dependencies
Write-Host "Fixing Lambda Layer Dependencies..." -ForegroundColor Yellow

# Navigate to lambda-layer directory
Set-Location lambda-layer

# Clean existing node_modules
Write-Host "Cleaning existing dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item package-lock.json
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

# Check if node_modules was created
if (-not (Test-Path "node_modules")) {
    Write-Host "Failed to install dependencies. Exiting." -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Create nodejs directory structure
Write-Host "Creating Lambda layer structure..." -ForegroundColor Cyan
if (Test-Path "nodejs") {
    Remove-Item -Recurse -Force nodejs
}
New-Item -ItemType Directory -Path "nodejs" -Force
Copy-Item -Recurse "node_modules" "nodejs/"

# Create zip file
Write-Host "Creating layer zip file..." -ForegroundColor Cyan
$zipName = "hedera-dependencies-layer.zip"
if (Test-Path $zipName) {
    Remove-Item $zipName
}

# Use PowerShell to create zip (requires PowerShell 5.0+)
Compress-Archive -Path "nodejs" -DestinationPath $zipName -Force

# Check if zip was created
if (-not (Test-Path $zipName)) {
    Write-Host "Failed to create zip file. Exiting." -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "Layer zip created: $zipName" -ForegroundColor Green

# Update Lambda layer
Write-Host "Updating Lambda layer..." -ForegroundColor Cyan
$layerName = "default-safemate-hedera-dependencies"
$description = "Layer containing Hedera SDK and AWS SDK dependencies - Fixed dependencies"

# Get the full path to the zip file
$zipPath = (Get-Item $zipName).FullName
Write-Host "Zip file path: $zipPath" -ForegroundColor Cyan

aws lambda publish-layer-version --layer-name $layerName --description $description --zip-file "fileb://$zipPath" --compatible-runtimes nodejs18.x --region ap-southeast-2

if ($LASTEXITCODE -eq 0) {
    Write-Host "Lambda layer updated successfully!" -ForegroundColor Green
    
    # Get the new version number
    $layerInfo = aws lambda list-layer-versions --layer-name $layerName --region ap-southeast-2 | ConvertFrom-Json
    $newVersion = $layerInfo.LayerVersions[0].Version
    
    Write-Host "New layer version: $newVersion" -ForegroundColor Cyan
    
    # Update the Lambda function to use the new layer
    Write-Host "Updating Lambda function..." -ForegroundColor Cyan
    $functionName = "default-safemate-user-onboarding"
    $newLayerArn = "arn:aws:lambda:ap-southeast-2:994220462693:layer:$layerName`:$newVersion"
    
    aws lambda update-function-configuration --function-name $functionName --layers $newLayerArn --region ap-southeast-2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Lambda function updated with new layer!" -ForegroundColor Green
        Write-Host "Lambda layer fix completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to update Lambda function" -ForegroundColor Red
    }
} else {
    Write-Host "Failed to update Lambda layer" -ForegroundColor Red
}

# Return to root directory
Set-Location ..
