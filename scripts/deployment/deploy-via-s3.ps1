# Deploy Lambda Function via S3 (for large packages)
Write-Host "Deploying Lambda Function via S3..." -ForegroundColor Yellow

# Navigate to Lambda directory
Set-Location "services/ultimate-wallet-service"

# Get the zip file
$zipFile = Get-ChildItem -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Using deployment package: $($zipFile.Name)" -ForegroundColor Cyan

# Create S3 bucket name (if it doesn't exist)
$bucketName = "safemate-lambda-deployments-$(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "Creating S3 bucket: $bucketName" -ForegroundColor Cyan

# Create S3 bucket
aws s3 mb s3://$bucketName --region ap-southeast-2

if ($LASTEXITCODE -eq 0) {
    Write-Host "S3 bucket created successfully" -ForegroundColor Green
    
    # Upload zip file to S3
    Write-Host "Uploading deployment package to S3..." -ForegroundColor Cyan
    aws s3 cp $zipFile.Name s3://$bucketName/$($zipFile.Name)
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Package uploaded to S3 successfully" -ForegroundColor Green
        
        # Deploy Lambda function from S3
        Write-Host "Deploying Lambda function from S3..." -ForegroundColor Cyan
        aws lambda update-function-code --function-name default-safemate-ultimate-wallet --s3-bucket $bucketName --s3-key $($zipFile.Name) --region ap-southeast-2
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Lambda function updated successfully!" -ForegroundColor Green
            Write-Host "You can now test the endpoints in your browser." -ForegroundColor Yellow
        } else {
            Write-Host "Failed to update Lambda function" -ForegroundColor Red
        }
    } else {
        Write-Host "Failed to upload package to S3" -ForegroundColor Red
    }
    
    # Clean up S3 bucket
    Write-Host "Cleaning up S3 bucket..." -ForegroundColor Cyan
    aws s3 rb s3://$bucketName --force
} else {
    Write-Host "Failed to create S3 bucket" -ForegroundColor Red
}

# Return to original directory
Set-Location "../.."

Write-Host "Deployment completed!" -ForegroundColor Green
