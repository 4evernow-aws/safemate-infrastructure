# SafeMate Development Environment Deployment Script
# This script deploys the dev environment with dev- prefixed resources

Write-Host "🚀 Deploying SafeMate Development Environment..." -ForegroundColor Green

# Set environment variables
$env:TF_VAR_environment = "dev"

# Navigate to terraform directory
Set-Location "terraform"

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Yellow
terraform init

# Plan the deployment
Write-Host "📋 Planning development deployment..." -ForegroundColor Yellow
terraform plan -var-file="dev.tfvars" -out="dev-plan.out"

# Apply the deployment
Write-Host "🔨 Applying development deployment..." -ForegroundColor Yellow
terraform apply "dev-plan.out"

# Show outputs
Write-Host "✅ Development deployment completed!" -ForegroundColor Green
Write-Host "📊 Environment Information:" -ForegroundColor Cyan
terraform output environment_info

Write-Host "🌐 Development URLs:" -ForegroundColor Cyan
terraform output -json | ConvertFrom-Json | ForEach-Object {
    if ($_.name -like "*_api_url") {
        Write-Host "  $($_.name): $($_.value)" -ForegroundColor White
    }
}

Write-Host "🎯 Development environment is ready at: http://localhost:5173/" -ForegroundColor Green
