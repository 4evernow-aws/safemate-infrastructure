# SafeMate Complete Free Tier Audit
# This script performs a comprehensive audit of your entire setup
# Run this before major deployments or weekly to ensure compliance

Write-Host "🔍 SafeMate Complete Free Tier Audit" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current AWS resources
Write-Host "📋 STEP 1: Checking Current AWS Resources..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
& ".\check-free-tier.ps1"
$awsCheckResult = $LASTEXITCODE

Write-Host ""
Write-Host "📋 STEP 2: Comparing AWS to Git Repository..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
& ".\compare-aws-to-git.ps1"
$gitCheckResult = $LASTEXITCODE

Write-Host ""
Write-Host "📋 STEP 3: Validating Terraform Configurations..." -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
cd terraform
& ".\validate-free-tier.ps1"
$terraformCheckResult = $LASTEXITCODE
cd ..

Write-Host ""
Write-Host "📋 STEP 4: Git Hook Status..." -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow

# Check if Git hooks are properly set up
$preCommitHook = Test-Path ".git/hooks/pre-commit"
$prePushHook = Test-Path ".git/hooks/pre-push"

if ($preCommitHook) {
    Write-Host "  ✅ Pre-commit hook: Active" -ForegroundColor Green
} else {
    Write-Host "  ❌ Pre-commit hook: Missing" -ForegroundColor Red
}

if ($prePushHook) {
    Write-Host "  ✅ Pre-push hook: Active" -ForegroundColor Green
} else {
    Write-Host "  ❌ Pre-push hook: Missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 STEP 5: Cursor Startup Script Status..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$cursorStartupScript = Test-Path ".cursor-startup.ps1"
if ($cursorStartupScript) {
    Write-Host "  ✅ Cursor startup script: Present" -ForegroundColor Green
} else {
    Write-Host "  ❌ Cursor startup script: Missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "💰 COMPREHENSIVE AUDIT RESULTS:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$overallCompliant = $true
$issues = @()

# Analyze results
if ($awsCheckResult -ne 0) {
    $overallCompliant = $false
    $issues += "AWS resources not free tier compliant"
}

if ($gitCheckResult -ne 0) {
    $overallCompliant = $false
    $issues += "Git repository contains expensive resources"
}

if ($terraformCheckResult -ne 0) {
    $overallCompliant = $false
    $issues += "Terraform configurations contain expensive resources"
}

if (-not $preCommitHook) {
    $overallCompliant = $false
    $issues += "Pre-commit hook missing"
}

if (-not $prePushHook) {
    $overallCompliant = $false
    $issues += "Pre-push hook missing"
}

if (-not $cursorStartupScript) {
    $overallCompliant = $false
    $issues += "Cursor startup script missing"
}

# Display overall status
if ($overallCompliant) {
    Write-Host "  ✅ COMPLETE FREE TIER COMPLIANCE!" -ForegroundColor Green
    Write-Host "  🎯 All systems are properly configured" -ForegroundColor Green
    Write-Host "  💰 Safe to deploy and develop" -ForegroundColor Green
    Write-Host "  🛡️  Protected from expensive bills" -ForegroundColor Green
} else {
    Write-Host "  ❌ FREE TIER COMPLIANCE ISSUES DETECTED!" -ForegroundColor Red
    Write-Host "  🚨 Action required before safe deployment" -ForegroundColor Red
    Write-Host "  💰 Risk of expensive AWS bills" -ForegroundColor Red
}

Write-Host ""

# Display detailed issues
if ($issues.Count -gt 0) {
    Write-Host "🚨 ISSUES FOUND:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    Write-Host ""
}

# Recommendations
Write-Host "🔧 RECOMMENDED ACTIONS:" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

if ($awsCheckResult -ne 0) {
    Write-Host "  1. 🚨 IMMEDIATE: Clean up AWS resources" -ForegroundColor Red
    Write-Host "     Run: .\fix-free-tier-costs.ps1" -ForegroundColor White
}

if ($gitCheckResult -ne 0) {
    Write-Host "  2. 🚨 URGENT: Remove expensive resources from Git" -ForegroundColor Red
    Write-Host "     Comment out or remove expensive resource definitions" -ForegroundColor White
    Write-Host "     Use free tier alternatives instead" -ForegroundColor White
}

if ($terraformCheckResult -ne 0) {
    Write-Host "  3. 🚨 URGENT: Fix Terraform configurations" -ForegroundColor Red
    Write-Host "     Remove or comment out expensive resources" -ForegroundColor White
    Write-Host "     Replace with free tier alternatives" -ForegroundColor White
}

if (-not $preCommitHook) {
    Write-Host "  4. ⚠️  SETUP: Install pre-commit hook" -ForegroundColor Yellow
    Write-Host "     Copy .git/hooks/pre-commit to make it executable" -ForegroundColor White
}

if (-not $prePushHook) {
    Write-Host "  5. ⚠️  SETUP: Install pre-push hook" -ForegroundColor Yellow
    Write-Host "     Copy .git/hooks/pre-push to make it executable" -ForegroundColor White
}

if (-not $cursorStartupScript) {
    Write-Host "  6. ⚠️  SETUP: Create Cursor startup script" -ForegroundColor Yellow
    Write-Host "     Copy .cursor-startup.ps1 to project root" -ForegroundColor White
}

if ($overallCompliant) {
    Write-Host "  ✅ No action needed - everything is properly configured!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 FREE TIER ALTERNATIVES:" -ForegroundColor Cyan
Write-Host "  • Replace ECS with Lambda" -ForegroundColor White
Write-Host "  • Replace ALB with API Gateway" -ForegroundColor White
Write-Host "  • Replace CloudFront with S3 static hosting" -ForegroundColor White
Write-Host "  • Replace ECR with Lambda layers" -ForegroundColor White
Write-Host "  • Replace RDS with DynamoDB" -ForegroundColor White
Write-Host "  • Replace EC2 with Lambda" -ForegroundColor White

Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan

if ($overallCompliant) {
    Write-Host "  ✅ Continue development - you're protected!" -ForegroundColor Green
    Write-Host "  📅 Run this audit weekly for ongoing compliance" -ForegroundColor White
    Write-Host "  🔍 Run before major deployments" -ForegroundColor White
} else {
    Write-Host "  🚨 Fix all issues before continuing development" -ForegroundColor Red
    Write-Host "  🔧 Use the recommended actions above" -ForegroundColor White
    Write-Host "  🔍 Re-run this audit after fixes" -ForegroundColor White
}

Write-Host ""
Write-Host "📅 AUDIT COMPLETED: $(Get-Date)" -ForegroundColor Gray

# Exit with error code if issues found
if (-not $overallCompliant) {
    exit 1
}
