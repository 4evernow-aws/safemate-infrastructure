#!/usr/bin/env pwsh
# Fix Cognito Client Issue Script
# This script will check and fix the Cognito client configuration

Write-Host "🔧 Fixing Cognito Client Issue" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Configuration
# Environment-specific Cognito configuration
$ENVIRONMENT = $env:NODE_ENV
if (-not $ENVIRONMENT) { $ENVIRONMENT = "development" }

$COGNITO_CONFIG = @{
    "development" = @{
        "USER_POOL_ID" = "ap-southeast-2_uLgMRpWlw"
        "CLIENT_ID" = "2fg1ckjn1hga2t07lnujpk488a"
    }
    "preprod" = @{
        "USER_POOL_ID" = "ap-southeast-2_pMo5BXFiM"
        "CLIENT_ID" = "1a0trpjfgv54odl9csqlcbkuii"
    }
}

$USER_POOL_ID = $COGNITO_CONFIG[$ENVIRONMENT]["USER_POOL_ID"]
if (-not $USER_POOL_ID) { $USER_POOL_ID = $COGNITO_CONFIG["development"]["USER_POOL_ID"] }
$EXPECTED_CLIENT_ID = "2fg1ckjn1hga2t07lnujpk488a"
$ERROR_CLIENT_ID = "6d5c0cj3pl5o18jgg9b898897n"

Write-Host "Checking Cognito User Pool Clients..." -ForegroundColor Cyan

# List all user pool clients
try {
    $clients = aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --output json | ConvertFrom-Json
    
    Write-Host "Found $(($clients.UserPoolClients).Count) client(s):" -ForegroundColor Yellow
    
    foreach ($client in $clients.UserPoolClients) {
        Write-Host "  - Client ID: $($client.ClientId)" -ForegroundColor Cyan
        Write-Host "    Name: $($client.ClientName)" -ForegroundColor Cyan
        Write-Host "    Status: $($client.Status)" -ForegroundColor Cyan
        Write-Host ""
    }
    
    # Check if expected client exists
    $expectedClient = $clients.UserPoolClients | Where-Object { $_.ClientId -eq $EXPECTED_CLIENT_ID }
    
    if ($expectedClient) {
        Write-Host "✅ Expected client ID $EXPECTED_CLIENT_ID exists" -ForegroundColor Green
    } else {
        Write-Host "❌ Expected client ID $EXPECTED_CLIENT_ID not found" -ForegroundColor Red
    }
    
    # Check if error client exists
    $errorClient = $clients.UserPoolClients | Where-Object { $_.ClientId -eq $ERROR_CLIENT_ID }
    
    if ($errorClient) {
        Write-Host "⚠️ Error client ID $ERROR_CLIENT_ID exists - this might be the issue" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error listing user pool clients: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking frontend environment configuration..." -ForegroundColor Cyan

# Check frontend environment file
$envFile = "apps/web/safemate/.env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $clientIdLine = $envContent | Where-Object { $_ -match "VITE_COGNITO_CLIENT_ID=" }
    
    if ($clientIdLine) {
        $currentClientId = $clientIdLine -replace "VITE_COGNITO_CLIENT_ID=", ""
        Write-Host "Frontend configured with client ID: $currentClientId" -ForegroundColor Cyan
        
        if ($currentClientId -eq $EXPECTED_CLIENT_ID) {
            Write-Host "✅ Frontend configuration matches expected client ID" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend configuration mismatch!" -ForegroundColor Red
            Write-Host "   Expected: $EXPECTED_CLIENT_ID" -ForegroundColor Red
            Write-Host "   Found: $currentClientId" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ VITE_COGNITO_CLIENT_ID not found in environment file" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Environment file not found: $envFile" -ForegroundColor Red
}

Write-Host ""
Write-Host "Checking Terraform state..." -ForegroundColor Cyan

# Check Terraform state
try {
    $terraformState = terraform state show aws_cognito_user_pool_client.app_client 2>$null
    if ($terraformState) {
        $clientIdMatch = $terraformState | Select-String "id.*=.*`"([^`"]+)`""
        if ($clientIdMatch) {
            $terraformClientId = $clientIdMatch.Matches[0].Groups[1].Value
            Write-Host "Terraform state shows client ID: $terraformClientId" -ForegroundColor Cyan
            
            if ($terraformClientId -eq $EXPECTED_CLIENT_ID) {
                Write-Host "✅ Terraform state matches expected client ID" -ForegroundColor Green
            } else {
                Write-Host "❌ Terraform state mismatch!" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "⚠️ Could not read Terraform state for Cognito client" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Error reading Terraform state: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Recommended Fix Steps:" -ForegroundColor Green
Write-Host "1. Run: terraform apply (to ensure Cognito client is properly created)" -ForegroundColor Cyan
Write-Host "2. Get the new client ID from Terraform output" -ForegroundColor Cyan
Write-Host "3. Update the frontend .env.local file with the correct client ID" -ForegroundColor Cyan
Write-Host "4. Rebuild and redeploy the frontend" -ForegroundColor Cyan
Write-Host ""

Write-Host "Would you like me to attempt the fix automatically? (y/n)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "🔄 Applying Terraform to fix Cognito client..." -ForegroundColor Green
    
    # Apply Terraform
    terraform apply -auto-approve
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Terraform applied successfully" -ForegroundColor Green
        
        # Get the new client ID from Terraform output
        $terraformOutput = terraform output -json 2>$null | ConvertFrom-Json
        if ($terraformOutput.cognito_client_id) {
            $newClientId = $terraformOutput.cognito_client_id.value
            Write-Host "New client ID: $newClientId" -ForegroundColor Green
            
            # Update the environment file
            Write-Host "Updating frontend environment file..." -ForegroundColor Cyan
            $envContent = Get-Content $envFile
            $updatedContent = $envContent -replace "VITE_COGNITO_CLIENT_ID=.*", "VITE_COGNITO_CLIENT_ID=$newClientId"
            Set-Content $envFile $updatedContent
            
            Write-Host "✅ Environment file updated" -ForegroundColor Green
            
            # Rebuild frontend
            Write-Host "Rebuilding frontend..." -ForegroundColor Cyan
            Set-Location "apps/web/safemate"
            npm run build
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Frontend rebuilt successfully" -ForegroundColor Green
                
                # Redeploy to ECS
                Write-Host "Redeploying to ECS..." -ForegroundColor Cyan
                aws ecs update-service --cluster default-safemate-cluster --service default-safemate --force-new-deployment
                
                Write-Host "✅ Deployment triggered successfully" -ForegroundColor Green
                Write-Host "Please wait a few minutes for the deployment to complete." -ForegroundColor Yellow
            } else {
                Write-Host "❌ Frontend build failed" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Could not get new client ID from Terraform output" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Terraform apply failed" -ForegroundColor Red
    }
} else {
    Write-Host "Manual fix required. Please follow the steps above." -ForegroundColor Yellow
}
