# SafeMate Development Environment Deployment Script (Free Tier Only)
# This script deploys only free tier resources to avoid costs

Write-Host "🚀 Deploying SafeMate Development Environment (Free Tier Only)..." -ForegroundColor Green

# Set environment variables
$env:TF_VAR_environment = "dev"

# Navigate to terraform directory
Set-Location "terraform"

# Initialize Terraform
Write-Host "📦 Initializing Terraform..." -ForegroundColor Yellow
terraform init

# Plan the deployment (free tier only)
Write-Host "📋 Planning development deployment (free tier only)..." -ForegroundColor Yellow
terraform plan -var-file="dev.tfvars" -out="dev-free-tier-plan.out"

# Apply the deployment
Write-Host "🔨 Applying development deployment (free tier only)..." -ForegroundColor Yellow
terraform apply "dev-free-tier-plan.out"

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
Write-Host "💰 Cost: ~$1.40/month (KMS + Secrets Manager only)" -ForegroundColor Green
