#!/usr/bin/env pwsh
# SafeMate Production Deployment Script
# Usage: .\deploy-to-production.ps1

param(
    [switch]$SkipBuild,
    [switch]$SkipInfrastructure,
    [switch]$Force
)

Write-Host "SafeMate Production Deployment" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Start Time: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Configuration
$PROJECT_ROOT = "D:\cursor_projects\safemate_v2"
$FRONTEND_DIR = "$PROJECT_ROOT\apps\web\safemate"
$TERRAFORM_DIR = "$PROJECT_ROOT\terraform"
$PRODUCTION_URL = "https://d19a5c2wn4mtdt.cloudfront.net/"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Write-Step {
    param($Message, $Color = $Cyan)
    Write-Host "`nStep: $Message" -ForegroundColor $Color
    Write-Host "----------------------------------------" -ForegroundColor $Color
}

function Write-Success {
    param($Message)
    Write-Host "SUCCESS: $Message" -ForegroundColor $Green
}

function Write-Error {
    param($Message)
    Write-Host "ERROR: $Message" -ForegroundColor $Red
}

function Write-Warning {
    param($Message)
    Write-Host "WARNING: $Message" -ForegroundColor $Yellow
}

# Main deployment function
function Main {
    # Step 1: Pre-deployment checks
    Write-Step "Step 1: Pre-deployment Checks"

    # Check if we're in the right directory
    if (-not (Test-Path "$PROJECT_ROOT\package.json")) {
        Write-Error "Not in SafeMate project root. Please run from D:\cursor_projects\safemate_v2"
        exit 1
    }

    # Check git status
    Write-Host "Checking git status..." -ForegroundColor $Cyan
    $gitStatus = git status --porcelain
    if ($gitStatus -and -not $Force) {
        Write-Warning "You have uncommitted changes. Use -Force to continue anyway."
        Write-Host "Uncommitted changes:" -ForegroundColor $Yellow
        Write-Host $gitStatus
        exit 1
    }

    Write-Success "Pre-deployment checks passed"

    # Step 2: Build Frontend
    if (-not $SkipBuild) {
        Write-Step "Step 2: Building Frontend Application"
        
        # Navigate to frontend directory
        Set-Location $FRONTEND_DIR
        Write-Host "Working directory: $(Get-Location)" -ForegroundColor $Cyan
        
        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing dependencies..." -ForegroundColor $Cyan
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install dependencies"
                exit 1
            }
        }
        
        # Build the application
        Write-Host "Building for production..." -ForegroundColor $Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed. Please fix TypeScript errors before deploying."
            exit 1
        }
        
        Write-Success "Frontend build completed successfully"
    } else {
        Write-Warning "Skipping frontend build (SkipBuild flag used)"
    }

    # Step 3: Deploy Infrastructure
    if (-not $SkipInfrastructure) {
        Write-Step "Step 3: Deploying Infrastructure Changes"
        
        # Navigate to Terraform directory
        Set-Location $TERRAFORM_DIR
        Write-Host "Working directory: $(Get-Location)" -ForegroundColor $Cyan
        
        # Check Terraform plan
        Write-Host "Checking Terraform plan..." -ForegroundColor $Cyan
        terraform plan -out=deploy-plan.tfplan
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Terraform plan failed"
            exit 1
        }
        
        # Check if there are changes
        $planOutput = terraform show deploy-plan.tfplan
        if ($planOutput -match "No changes") {
            Write-Success "No infrastructure changes needed"
        } else {
            Write-Host "Applying infrastructure changes..." -ForegroundColor $Cyan
            terraform apply deploy-plan.tfplan
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Terraform apply failed"
                exit 1
            }
            Write-Success "Infrastructure deployed successfully"
        }
    } else {
        Write-Warning "Skipping infrastructure deployment (SkipInfrastructure flag used)"
    }

    # Step 4: Deploy Frontend to ECS
    Write-Step "Step 4: Deploying Frontend to ECS"

    Write-Host "Forcing new ECS deployment..." -ForegroundColor $Cyan
    aws ecs update-service --cluster default-safemate-cluster --service default-safemate --force-new-deployment
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to trigger ECS deployment"
        exit 1
    }

    Write-Success "ECS deployment triggered successfully"

    # Step 5: Monitor Deployment
    Write-Step "Step 5: Monitoring Deployment Progress"

    $maxAttempts = 30
    $attempt = 0

    do {
        $attempt++
        Write-Host "Checking deployment status (attempt $attempt/$maxAttempts)..." -ForegroundColor $Cyan
        
        $deploymentStatus = aws ecs describe-services --cluster default-safemate-cluster --services default-safemate --query 'services[0].deployments[0].{Status:status,RolloutState:rolloutState,RolloutStateReason:rolloutStateReason}' --output json | ConvertFrom-Json
        
        Write-Host "Status: $($deploymentStatus.Status)" -ForegroundColor $Yellow
        Write-Host "Rollout State: $($deploymentStatus.RolloutState)" -ForegroundColor $Yellow
        Write-Host "Reason: $($deploymentStatus.RolloutStateReason)" -ForegroundColor $Yellow
        
        if ($deploymentStatus.RolloutState -eq "COMPLETED") {
            Write-Success "Deployment completed successfully!"
            break
        } elseif ($deploymentStatus.RolloutState -eq "FAILED") {
            Write-Error "Deployment failed!"
            exit 1
        } elseif ($attempt -ge $maxAttempts) {
            Write-Error "Deployment timeout after $maxAttempts attempts"
            exit 1
        } else {
            Write-Host "Deployment in progress... waiting 30 seconds" -ForegroundColor $Yellow
            Start-Sleep -Seconds 30
        }
    } while ($true)

    # Step 6: Verify Production
    Write-Step "Step 6: Verifying Production Site"

    Write-Host "Testing production site..." -ForegroundColor $Cyan
    try {
        $response = Invoke-WebRequest -Uri $PRODUCTION_URL -Method GET -TimeoutSec 30
        if ($response.StatusCode -eq 200) {
            Write-Success "Production site is responding correctly"
            Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor $Green
            Write-Host "Response Size: $($response.Content.Length) bytes" -ForegroundColor $Green
        } else {
            Write-Error "Production site returned status code: $($response.StatusCode)"
            exit 1
        }
    } catch {
        Write-Error "Failed to connect to production site: $($_.Exception.Message)"
        exit 1
    }

    # Step 7: Final Status
    Write-Step "Step 7: Deployment Summary"

    Write-Success "SafeMate Production Deployment Completed Successfully!"
    Write-Host ""
    Write-Host "Deployment Summary:" -ForegroundColor $Green
    Write-Host "  Production URL: $PRODUCTION_URL" -ForegroundColor $Cyan
    Write-Host "  Deployment Time: $(Get-Date)" -ForegroundColor $Cyan
    Write-Host "  ECS Service: default-safemate" -ForegroundColor $Cyan
    Write-Host "  CloudFront Distribution: d19a5c2wn4mtdt.cloudfront.net" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "Quick Links:" -ForegroundColor $Green
    Write-Host "  Production Site: $PRODUCTION_URL" -ForegroundColor $Cyan
    Write-Host "  AWS Console: https://console.aws.amazon.com/" -ForegroundColor $Cyan
    Write-Host "  CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/" -ForegroundColor $Cyan
    Write-Host ""

    Write-Host "End Time: $(Get-Date)" -ForegroundColor $Yellow
}

# Run main function
Main
