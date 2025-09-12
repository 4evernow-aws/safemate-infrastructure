# SafeMate Production Environment Deployment Script
# This script deploys the prod environment with prod- prefixed resources

Write-Host "🚀 Deploying SafeMate Production Environment..." -ForegroundColor Green

# Set environment variables
$env:TF_VAR_environment = "prod"

# Navigate to terraform directory
Set-Location "terraform"

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Yellow
terraform init

# Plan the deployment
Write-Host "📋 Planning production deployment..." -ForegroundColor Yellow
terraform plan -var-file="prod.tfvars" -out="prod-plan.out"

# Apply the deployment
Write-Host "🔨 Applying production deployment..." -ForegroundColor Yellow
terraform apply "prod-plan.out"

# Show outputs
Write-Host "✅ Production deployment completed!" -ForegroundColor Green
Write-Host "📊 Environment Information:" -ForegroundColor Cyan
terraform output environment_info

Write-Host "🌐 Production URLs:" -ForegroundColor Cyan
terraform output -json | ConvertFrom-Json | ForEach-Object {
    if ($_.name -like "*_api_url") {
        Write-Host "  $($_.name): $($_.value)" -ForegroundColor White
    }
}

Write-Host "🎯 Production environment is ready at: https://d19a5c2wn4mtdt.cloudfront.net/" -ForegroundColor Green
Write-Host "💡 Update your frontend .env.production with the new API URLs above" -ForegroundColor Yellow
