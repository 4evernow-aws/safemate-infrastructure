# SafeMate Pre-Production Environment Deployment Script
# This script deploys the preprod environment with preprod- prefixed resources

Write-Host "🚀 Deploying SafeMate Pre-Production Environment..." -ForegroundColor Green

# Set environment variables
$env:TF_VAR_environment = "preprod"

# Navigate to terraform directory
Set-Location "terraform"

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Yellow
terraform init

# Plan the deployment
Write-Host "📋 Planning pre-production deployment..." -ForegroundColor Yellow
terraform plan -var-file="preprod.tfvars" -out="preprod-plan.out"

# Apply the deployment
Write-Host "🔨 Applying pre-production deployment..." -ForegroundColor Yellow
terraform apply "preprod-plan.out"

# Show outputs
Write-Host "✅ Pre-production deployment completed!" -ForegroundColor Green
Write-Host "📊 Environment Information:" -ForegroundColor Cyan
terraform output environment_info

Write-Host "🌐 Pre-Production URLs:" -ForegroundColor Cyan
terraform output -json | ConvertFrom-Json | ForEach-Object {
    if ($_.name -like "*_api_url") {
        Write-Host "  $($_.name): $($_.value)" -ForegroundColor White
    }
}

Write-Host "🎯 Pre-production environment is ready!" -ForegroundColor Green
Write-Host "💡 Update your frontend .env.preprod with the new API URLs above" -ForegroundColor Yellow
