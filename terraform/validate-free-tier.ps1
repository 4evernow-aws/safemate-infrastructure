# Terraform Free Tier Validation Script
# This script checks Terraform configurations for expensive resources
# Run this before applying Terraform changes

Write-Host "🔍 Terraform Free Tier Validation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$freeTierCompliant = $true
$issues = @()

# Check for expensive resources in Terraform files
Write-Host "📋 Scanning Terraform files for expensive resources..." -ForegroundColor Yellow

# Check for ECS resources
$ecsFiles = Get-ChildItem -Path "." -Filter "*.tf" -Recurse | Select-String -Pattern "aws_ecs_cluster|aws_ecs_service" -List
if ($ecsFiles) {
    Write-Host "  ❌ ECS resources found in:" -ForegroundColor Red
    $freeTierCompliant = $false
    $issues += "ECS resources in Terraform files"
    foreach ($file in $ecsFiles) {
        Write-Host "    - $($file.Filename)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No ECS resources found" -ForegroundColor Green
}

# Check for Load Balancer resources
$lbFiles = Get-ChildItem -Path "." -Filter "*.tf" -Recurse | Select-String -Pattern "aws_lb|aws_alb" -List
if ($lbFiles) {
    Write-Host "  ❌ Load Balancer resources found in:" -ForegroundColor Red
    $freeTierCompliant = $false
    $issues += "Load Balancer resources in Terraform files"
    foreach ($file in $lbFiles) {
        Write-Host "    - $($file.Filename)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No Load Balancer resources found" -ForegroundColor Green
}

# Check for CloudFront resources (Free Tier compliant - 1TB free data transfer)
$cfFiles = Get-ChildItem -Path "." -Filter "*.tf" -Recurse | Select-String -Pattern "aws_cloudfront_distribution" -List
if ($cfFiles) {
    Write-Host "  ✅ CloudFront resources found (Free Tier compliant - 1TB free):" -ForegroundColor Green
    foreach ($file in $cfFiles) {
        Write-Host "    - $($file.Filename)" -ForegroundColor Green
    }
} else {
    Write-Host "  ✅ No CloudFront resources found" -ForegroundColor Green
}

# Check for ECR resources
$ecrFiles = Get-ChildItem -Path "." -Filter "*.tf" -Recurse | Select-String -Pattern "aws_ecr_repository" -List
if ($ecrFiles) {
    Write-Host "  ❌ ECR resources found in:" -ForegroundColor Red
    $freeTierCompliant = $false
    $issues += "ECR resources in Terraform files"
    foreach ($file in $ecrFiles) {
        Write-Host "    - $($file.Filename)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No ECR resources found" -ForegroundColor Green
}

# Check for RDS resources
$rdsFiles = Get-ChildItem -Path "." -Filter "*.tf" -Recurse | Select-String -Pattern "aws_db_instance|aws_rds_cluster" -List
if ($rdsFiles) {
    Write-Host "  ❌ RDS resources found in:" -ForegroundColor Red
    $freeTierCompliant = $false
    $issues += "RDS resources in Terraform files"
    foreach ($file in $rdsFiles) {
        Write-Host "    - $($file.Filename)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No RDS resources found" -ForegroundColor Green
}

# Check for EC2 resources
$ec2Files = Get-ChildItem -Path "." -Filter "*.tf" -Recurse | Select-String -Pattern "aws_instance|aws_launch_template" -List
if ($ec2Files) {
    Write-Host "  ❌ EC2 resources found in:" -ForegroundColor Red
    $freeTierCompliant = $false
    $issues += "EC2 resources in Terraform files"
    foreach ($file in $ec2Files) {
        Write-Host "    - $($file.Filename)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No EC2 resources found" -ForegroundColor Green
}

# Check for ElastiCache resources
$ecFiles = Get-ChildItem -Path "." -Filter "*.tf" -Recurse | Select-String -Pattern "aws_elasticache_cluster" -List
if ($ecFiles) {
    Write-Host "  ❌ ElastiCache resources found in:" -ForegroundColor Red
    $freeTierCompliant = $false
    $issues += "ElastiCache resources in Terraform files"
    foreach ($file in $ecFiles) {
        Write-Host "    - $($file.Filename)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No ElastiCache resources found" -ForegroundColor Green
}

Write-Host ""
Write-Host "💰 TERRAFORM VALIDATION RESULTS:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

if ($freeTierCompliant) {
    Write-Host "  ✅ TERRAFORM FREE TIER COMPLIANT!" -ForegroundColor Green
    Write-Host "  🎯 Safe to run: terraform plan" -ForegroundColor Green
    Write-Host "  🎯 Safe to run: terraform apply" -ForegroundColor Green
} else {
    Write-Host "  ❌ TERRAFORM NOT FREE TIER COMPLIANT!" -ForegroundColor Red
    Write-Host "  🚨 Expensive resources detected in configuration" -ForegroundColor Red
    Write-Host "  🎯 Status: UNSAFE TO APPLY" -ForegroundColor Red
    Write-Host ""
    Write-Host "  🚨 ISSUES FOUND:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  🔧 RECOMMENDED ACTION:" -ForegroundColor Yellow
    Write-Host "    1. Comment out or remove expensive resources" -ForegroundColor White
    Write-Host "    2. Use free tier alternatives:" -ForegroundColor White
    Write-Host "       - Replace ECS with Lambda" -ForegroundColor White
    Write-Host "       - Replace ALB with API Gateway" -ForegroundColor White
    Write-Host "       - Using S3 static hosting (Free Tier compliant)" -ForegroundColor White
    Write-Host "       - Replace ECR with Lambda layers" -ForegroundColor White
    Write-Host "       - Replace RDS with DynamoDB" -ForegroundColor White
    Write-Host "       - Replace EC2 with Lambda" -ForegroundColor White
    Write-Host "       - Replace ElastiCache with DynamoDB DAX (if needed)" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 FREE TIER RESOURCES (These are OK):" -ForegroundColor Cyan
Write-Host "  ✅ aws_lambda_function" -ForegroundColor Green
Write-Host "  ✅ aws_api_gateway_rest_api" -ForegroundColor Green
Write-Host "  ✅ aws_dynamodb_table" -ForegroundColor Green
Write-Host "  ✅ aws_cognito_user_pool" -ForegroundColor Green
Write-Host "  ✅ aws_kms_key" -ForegroundColor Green
# Write-Host "  ✅ aws_secretsmanager_secret" -ForegroundColor Green  # Removed - not Free Tier
Write-Host "  ✅ aws_s3_bucket (static website hosting)" -ForegroundColor Green

# Exit with error code if not compliant
if (-not $freeTierCompliant) {
    exit 1
}
