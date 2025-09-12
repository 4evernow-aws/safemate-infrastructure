# Cursor Startup Script - SafeMate Free Tier Check
# This script runs automatically when you start Cursor
# Place this in your project root directory

Write-Host "🚀 SafeMate Cursor Session Starting..." -ForegroundColor Green
Write-Host "Checking AWS Free Tier Compliance..." -ForegroundColor Yellow
Write-Host ""

# Run the free tier compliance check
try {
    & ".\scripts\check-free-tier.ps1"
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Free Tier Check Passed - Safe to continue development!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Free Tier Check Failed - Please fix issues before continuing!" -ForegroundColor Red
        Write-Host "Run: .\fix-free-tier-costs.ps1" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not run free tier check. Please run manually:" -ForegroundColor Yellow
    Write-Host "   .\scripts\check-free-tier.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Development Environment Ready!" -ForegroundColor Green
Write-Host "Current working directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "AWS Account: $(aws sts get-caller-identity --query 'Account' --output text 2>$null)" -ForegroundColor Cyan
Write-Host ""
