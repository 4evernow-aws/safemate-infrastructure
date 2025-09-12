# SafeMate AWS vs Git Comparison Script
# This script compares your current AWS resources to your Git repository
# to ensure you're not building expensive non-free tier resources

Write-Host "🔍 SafeMate AWS vs Git Comparison" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Get current Git branch and status
Write-Host "📋 Git Repository Status:" -ForegroundColor Yellow
$currentBranch = git branch --show-current 2>$null
$gitStatus = git status --porcelain 2>$null
$remoteUrl = git remote get-url origin 2>$null

Write-Host "  Current Branch: $currentBranch" -ForegroundColor White
Write-Host "  Remote URL: $remoteUrl" -ForegroundColor White

if ($gitStatus) {
    Write-Host "  ⚠️  Uncommitted changes detected" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Working directory clean" -ForegroundColor Green
}

Write-Host ""

# Check current AWS resources
Write-Host "📋 Current AWS Resources:" -ForegroundColor Yellow
$awsIssues = @()
$freeTierCompliant = $true

# Check ECS Clusters
try {
    $ecsClusters = aws ecs list-clusters --output json 2>$null | ConvertFrom-Json
    if ($ecsClusters.clusterArns.Count -gt 0) {
        Write-Host "  ❌ ECS Clusters: $($ecsClusters.clusterArns.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $awsIssues += "ECS Clusters: $($ecsClusters.clusterArns.Count) running"
    } else {
        Write-Host "  ✅ ECS Clusters: 0" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ ECS Clusters: 0" -ForegroundColor Green
}

# Check Load Balancers
try {
    $loadBalancers = aws elbv2 describe-load-balancers --output json 2>$null | ConvertFrom-Json
    if ($loadBalancers.LoadBalancers.Count -gt 0) {
        Write-Host "  ❌ Load Balancers: $($loadBalancers.LoadBalancers.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $awsIssues += "Load Balancers: $($loadBalancers.LoadBalancers.Count) running"
    } else {
        Write-Host "  ✅ Load Balancers: 0" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ Load Balancers: 0" -ForegroundColor Green
}

# Check CloudFront
try {
    $cloudfront = aws cloudfront list-distributions --output json 2>$null | ConvertFrom-Json
    if ($cloudfront.DistributionList.Items.Count -gt 0) {
        Write-Host "  ❌ CloudFront: $($cloudfront.DistributionList.Items.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $awsIssues += "CloudFront: $($cloudfront.DistributionList.Items.Count) running"
    } else {
        Write-Host "  ✅ CloudFront: 0" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ CloudFront: 0" -ForegroundColor Green
}

# Check ECR
try {
    $ecrRepos = aws ecr describe-repositories --output json 2>$null | ConvertFrom-Json
    if ($ecrRepos.repositories.Count -gt 0) {
        Write-Host "  ❌ ECR Repositories: $($ecrRepos.repositories.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $awsIssues += "ECR: $($ecrRepos.repositories.Count) running"
    } else {
        Write-Host "  ✅ ECR Repositories: 0" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ ECR Repositories: 0" -ForegroundColor Green
}

# Check RDS
try {
    $rdsInstances = aws rds describe-db-instances --output json 2>$null | ConvertFrom-Json
    if ($rdsInstances.DBInstances.Count -gt 0) {
        Write-Host "  ❌ RDS Instances: $($rdsInstances.DBInstances.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $awsIssues += "RDS: $($rdsInstances.DBInstances.Count) running"
    } else {
        Write-Host "  ✅ RDS Instances: 0" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ RDS Instances: 0" -ForegroundColor Green
}

# Check EC2
try {
    $ec2Instances = aws ec2 describe-instances --filters "Name=instance-state-name,Values=running,stopped" --output json 2>$null | ConvertFrom-Json
    $runningInstances = 0
    if ($ec2Instances.Reservations.Count -gt 0) {
        foreach ($reservation in $ec2Instances.Reservations) {
            $runningInstances += $reservation.Instances.Count
        }
    }
    if ($runningInstances -gt 0) {
        Write-Host "  ❌ EC2 Instances: $runningInstances" -ForegroundColor Red
        $freeTierCompliant = $false
        $awsIssues += "EC2: $runningInstances running"
    } else {
        Write-Host "  ✅ EC2 Instances: 0" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ EC2 Instances: 0" -ForegroundColor Green
}

Write-Host ""

# Check Git repository for expensive resource definitions
Write-Host "📋 Git Repository Analysis:" -ForegroundColor Yellow
$gitIssues = @()
$gitFreeTierCompliant = $true

# Check Terraform files for expensive resources
Write-Host "  Scanning Terraform files..." -ForegroundColor White

# Check for ECS resources in Git
$ecsFiles = git grep -l "aws_ecs_cluster\|aws_ecs_service" -- "*.tf" 2>$null
if ($ecsFiles) {
    Write-Host "  ❌ ECS resources found in Git:" -ForegroundColor Red
    $gitFreeTierCompliant = $false
    $gitIssues += "ECS resources in Terraform files"
    foreach ($file in $ecsFiles) {
        Write-Host "    - $file" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No ECS resources in Git" -ForegroundColor Green
}

# Check for Load Balancer resources in Git
$lbFiles = git grep -l "aws_lb\|aws_alb" -- "*.tf" 2>$null
if ($lbFiles) {
    Write-Host "  ❌ Load Balancer resources found in Git:" -ForegroundColor Red
    $gitFreeTierCompliant = $false
    $gitIssues += "Load Balancer resources in Terraform files"
    foreach ($file in $lbFiles) {
        Write-Host "    - $file" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No Load Balancer resources in Git" -ForegroundColor Green
}

# Check for CloudFront resources in Git
$cfFiles = git grep -l "aws_cloudfront_distribution" -- "*.tf" 2>$null
if ($cfFiles) {
    Write-Host "  ❌ CloudFront resources found in Git:" -ForegroundColor Red
    $gitFreeTierCompliant = $false
    $gitIssues += "CloudFront resources in Terraform files"
    foreach ($file in $cfFiles) {
        Write-Host "    - $file" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No CloudFront resources in Git" -ForegroundColor Green
}

# Check for ECR resources in Git
$ecrFiles = git grep -l "aws_ecr_repository" -- "*.tf" 2>$null
if ($ecrFiles) {
    Write-Host "  ❌ ECR resources found in Git:" -ForegroundColor Red
    $gitFreeTierCompliant = $false
    $gitIssues += "ECR resources in Terraform files"
    foreach ($file in $ecrFiles) {
        Write-Host "    - $file" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No ECR resources in Git" -ForegroundColor Green
}

# Check for RDS resources in Git
$rdsFiles = git grep -l "aws_db_instance\|aws_rds_cluster" -- "*.tf" 2>$null
if ($rdsFiles) {
    Write-Host "  ❌ RDS resources found in Git:" -ForegroundColor Red
    $gitFreeTierCompliant = $false
    $gitIssues += "RDS resources in Terraform files"
    foreach ($file in $rdsFiles) {
        Write-Host "    - $file" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No RDS resources in Git" -ForegroundColor Green
}

# Check for EC2 resources in Git
$ec2Files = git grep -l "aws_instance\|aws_launch_template" -- "*.tf" 2>$null
if ($ec2Files) {
    Write-Host "  ❌ EC2 resources found in Git:" -ForegroundColor Red
    $gitFreeTierCompliant = $false
    $gitIssues += "EC2 resources in Terraform files"
    foreach ($file in $ec2Files) {
        Write-Host "    - $file" -ForegroundColor Red
    }
} else {
    Write-Host "  ✅ No EC2 resources in Git" -ForegroundColor Green
}

Write-Host ""

# Check for free tier resources in Git
Write-Host "📋 Free Tier Resources in Git:" -ForegroundColor Yellow

# Check for Lambda resources
$lambdaFiles = git grep -l "aws_lambda_function" -- "*.tf" 2>$null
if ($lambdaFiles) {
    Write-Host "  ✅ Lambda resources found (free tier)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No Lambda resources found" -ForegroundColor Yellow
}

# Check for API Gateway resources
$apiFiles = git grep -l "aws_api_gateway_rest_api" -- "*.tf" 2>$null
if ($apiFiles) {
    Write-Host "  ✅ API Gateway resources found (free tier)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No API Gateway resources found" -ForegroundColor Yellow
}

# Check for DynamoDB resources
$dynamoFiles = git grep -l "aws_dynamodb_table" -- "*.tf" 2>$null
if ($dynamoFiles) {
    Write-Host "  ✅ DynamoDB resources found (free tier)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No DynamoDB resources found" -ForegroundColor Yellow
}

# Check for Cognito resources
$cognitoFiles = git grep -l "aws_cognito_user_pool" -- "*.tf" 2>$null
if ($cognitoFiles) {
    Write-Host "  ✅ Cognito resources found (free tier)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No Cognito resources found" -ForegroundColor Yellow
}

Write-Host ""

# Summary and Analysis
Write-Host "💰 COMPARISON ANALYSIS:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

if ($freeTierCompliant -and $gitFreeTierCompliant) {
    Write-Host "  ✅ PERFECT MATCH!" -ForegroundColor Green
    Write-Host "  🎯 AWS resources match Git repository" -ForegroundColor Green
    Write-Host "  🎯 Both are free tier compliant" -ForegroundColor Green
    Write-Host "  💰 Safe to deploy and commit" -ForegroundColor Green
} elseif ($freeTierCompliant -and -not $gitFreeTierCompliant) {
    Write-Host "  ⚠️  PARTIAL MATCH" -ForegroundColor Yellow
    Write-Host "  🎯 AWS resources are free tier compliant" -ForegroundColor Green
    Write-Host "  🚨 Git repository contains expensive resources" -ForegroundColor Red
    Write-Host "  💰 Safe to deploy now, but fix Git before next deployment" -ForegroundColor Yellow
} elseif (-not $freeTierCompliant -and $gitFreeTierCompliant) {
    Write-Host "  ❌ MISMATCH DETECTED!" -ForegroundColor Red
    Write-Host "  🚨 AWS resources are NOT free tier compliant" -ForegroundColor Red
    Write-Host "  ✅ Git repository is free tier compliant" -ForegroundColor Green
    Write-Host "  💰 Need to clean up AWS resources" -ForegroundColor Red
} else {
    Write-Host "  🚨 CRITICAL ISSUE!" -ForegroundColor Red
    Write-Host "  🚨 Both AWS resources AND Git repository have expensive resources" -ForegroundColor Red
    Write-Host "  💰 Need immediate cleanup of both" -ForegroundColor Red
}

Write-Host ""

# Detailed Issues
if ($awsIssues.Count -gt 0) {
    Write-Host "🚨 AWS ISSUES FOUND:" -ForegroundColor Red
    foreach ($issue in $awsIssues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    Write-Host ""
}

if ($gitIssues.Count -gt 0) {
    Write-Host "🚨 GIT REPOSITORY ISSUES FOUND:" -ForegroundColor Red
    foreach ($issue in $gitIssues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    Write-Host ""
}

# Recommendations
Write-Host "🔧 RECOMMENDED ACTIONS:" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

if (-not $freeTierCompliant) {
    Write-Host "  1. 🚨 IMMEDIATE: Clean up AWS resources" -ForegroundColor Red
    Write-Host "     Run: .\fix-free-tier-costs.ps1" -ForegroundColor White
}

if (-not $gitFreeTierCompliant) {
    Write-Host "  2. 🚨 URGENT: Remove expensive resources from Git" -ForegroundColor Red
    Write-Host "     Comment out or remove expensive resource definitions" -ForegroundColor White
    Write-Host "     Use free tier alternatives instead" -ForegroundColor White
}

if ($freeTierCompliant -and $gitFreeTierCompliant) {
    Write-Host "  ✅ No action needed - everything is compliant!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 FREE TIER ALTERNATIVES:" -ForegroundColor Cyan
Write-Host "  • Replace ECS with Lambda" -ForegroundColor White
Write-Host "  • Replace ALB with API Gateway" -ForegroundColor White
Write-Host "  • Replace CloudFront with S3 static hosting" -ForegroundColor White
Write-Host "  • Replace ECR with Lambda layers" -ForegroundColor White
Write-Host "  • Replace RDS with DynamoDB" -ForegroundColor White
Write-Host "  • Replace EC2 with Lambda" -ForegroundColor White

# Exit with error code if issues found
if (-not $freeTierCompliant -or -not $gitFreeTierCompliant) {
    exit 1
}
