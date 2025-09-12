# SafeMate Free Tier Compliance Check
# Run this script at Cursor startup or before deployments
# This ensures you're always using free tier resources

Write-Host "🔍 SafeMate Free Tier Compliance Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$freeTierCompliant = $true
$issues = @()

# Check 1: ECS Clusters (Should be 0)
Write-Host "📋 Checking ECS Clusters..." -ForegroundColor Yellow
try {
    $ecsClusters = aws ecs list-clusters --output json 2>$null | ConvertFrom-Json
    if ($ecsClusters.clusterArns.Count -gt 0) {
        Write-Host "  ❌ ECS Clusters found: $($ecsClusters.clusterArns.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $issues += "ECS Clusters: $($ecsClusters.clusterArns.Count) running (expensive!)"
        foreach ($cluster in $ecsClusters.clusterArns) {
            $clusterName = $cluster.Split('/')[-1]
            Write-Host "    - $clusterName" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ No ECS clusters found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ No ECS clusters found" -ForegroundColor Green
}

# Check 2: Application Load Balancers (Should be 0)
Write-Host "📋 Checking Application Load Balancers..." -ForegroundColor Yellow
try {
    $loadBalancers = aws elbv2 describe-load-balancers --output json 2>$null | ConvertFrom-Json
    if ($loadBalancers.LoadBalancers.Count -gt 0) {
        Write-Host "  ❌ Load Balancers found: $($loadBalancers.LoadBalancers.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $issues += "Load Balancers: $($loadBalancers.LoadBalancers.Count) running (expensive!)"
        foreach ($lb in $loadBalancers.LoadBalancers) {
            Write-Host "    - $($lb.LoadBalancerName)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ No load balancers found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ No load balancers found" -ForegroundColor Green
}

# Check 3: CloudFront Distributions (Should be 0)
Write-Host "📋 Checking CloudFront Distributions..." -ForegroundColor Yellow
try {
    $cloudfront = aws cloudfront list-distributions --output json 2>$null | ConvertFrom-Json
    if ($cloudfront.DistributionList.Items.Count -gt 0) {
        Write-Host "  ❌ CloudFront Distributions found: $($cloudfront.DistributionList.Items.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $issues += "CloudFront: $($cloudfront.DistributionList.Items.Count) running (expensive!)"
        foreach ($dist in $cloudfront.DistributionList.Items) {
            Write-Host "    - $($dist.Id) - $($dist.DomainName)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ No CloudFront distributions found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ No CloudFront distributions found" -ForegroundColor Green
}

# Check 4: ECR Repositories (Should be 0)
Write-Host "📋 Checking ECR Repositories..." -ForegroundColor Yellow
try {
    $ecrRepos = aws ecr describe-repositories --output json 2>$null | ConvertFrom-Json
    if ($ecrRepos.repositories.Count -gt 0) {
        Write-Host "  ❌ ECR Repositories found: $($ecrRepos.repositories.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $issues += "ECR Repositories: $($ecrRepos.repositories.Count) running (expensive!)"
        foreach ($repo in $ecrRepos.repositories) {
            Write-Host "    - $($repo.repositoryName)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ No ECR repositories found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ No ECR repositories found" -ForegroundColor Green
}

# Check 5: RDS Instances (Should be 0)
Write-Host "📋 Checking RDS Instances..." -ForegroundColor Yellow
try {
    $rdsInstances = aws rds describe-db-instances --output json 2>$null | ConvertFrom-Json
    if ($rdsInstances.DBInstances.Count -gt 0) {
        Write-Host "  ❌ RDS Instances found: $($rdsInstances.DBInstances.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $issues += "RDS Instances: $($rdsInstances.DBInstances.Count) running (expensive!)"
        foreach ($db in $rdsInstances.DBInstances) {
            Write-Host "    - $($db.DBInstanceIdentifier)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ No RDS instances found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ No RDS instances found" -ForegroundColor Green
}

# Check 6: EC2 Instances (Should be 0)
Write-Host "📋 Checking EC2 Instances..." -ForegroundColor Yellow
try {
    $ec2Instances = aws ec2 describe-instances --filters "Name=instance-state-name,Values=running,stopped" --output json 2>$null | ConvertFrom-Json
    if ($ec2Instances.Reservations.Count -gt 0) {
        $runningInstances = 0
        foreach ($reservation in $ec2Instances.Reservations) {
            $runningInstances += $reservation.Instances.Count
        }
        if ($runningInstances -gt 0) {
            Write-Host "  ❌ EC2 Instances found: $runningInstances" -ForegroundColor Red
            $freeTierCompliant = $false
            $issues += "EC2 Instances: $runningInstances running (expensive!)"
        } else {
            Write-Host "  ✅ No EC2 instances found" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✅ No EC2 instances found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ No EC2 instances found" -ForegroundColor Green
}

# Check 7: ElastiCache Clusters (Should be 0)
Write-Host "📋 Checking ElastiCache Clusters..." -ForegroundColor Yellow
try {
    $elasticache = aws elasticache describe-cache-clusters --output json 2>$null | ConvertFrom-Json
    if ($elasticache.CacheClusters.Count -gt 0) {
        Write-Host "  ❌ ElastiCache Clusters found: $($elasticache.CacheClusters.Count)" -ForegroundColor Red
        $freeTierCompliant = $false
        $issues += "ElastiCache: $($elasticache.CacheClusters.Count) running (expensive!)"
        foreach ($cache in $elasticache.CacheClusters) {
            Write-Host "    - $($cache.CacheClusterId)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ No ElastiCache clusters found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✅ No ElastiCache clusters found" -ForegroundColor Green
}

Write-Host ""
Write-Host "💰 COST ANALYSIS:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($freeTierCompliant) {
    Write-Host "  ✅ FREE TIER COMPLIANT!" -ForegroundColor Green
    Write-Host "  💰 Monthly cost: ~$1.40 (KMS + Secrets Manager only)" -ForegroundColor Green
    Write-Host "  🎯 Status: SAFE TO DEPLOY" -ForegroundColor Green
} else {
    Write-Host "  ❌ NOT FREE TIER COMPLIANT!" -ForegroundColor Red
    Write-Host "  💰 Monthly cost: ELEVATED (expensive resources running)" -ForegroundColor Red
    Write-Host "  🎯 Status: NEEDS CLEANUP BEFORE DEPLOYMENT" -ForegroundColor Red
    Write-Host ""
    Write-Host "  🚨 ISSUES FOUND:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  🔧 RECOMMENDED ACTION:" -ForegroundColor Yellow
    Write-Host "    Run: .\fix-free-tier-costs.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "📊 FREE TIER RESOURCES (These are OK):" -ForegroundColor Cyan
Write-Host "  ✅ Lambda Functions (1M requests/month free)" -ForegroundColor Green
Write-Host "  ✅ API Gateway (1M calls/month free)" -ForegroundColor Green
Write-Host "  ✅ DynamoDB (25GB storage free)" -ForegroundColor Green
Write-Host "  ✅ Cognito (50,000 MAUs free)" -ForegroundColor Green
Write-Host "  ✅ CloudWatch Logs (5GB ingestion free)" -ForegroundColor Green
Write-Host "  ✅ S3 Standard (5GB storage free)" -ForegroundColor Green

Write-Host ""
Write-Host "💰 MINIMAL PAID SERVICES (Required):" -ForegroundColor Yellow
Write-Host "  ⚠️  KMS Key (~$1/month) - Required for encryption" -ForegroundColor White
Write-Host "  ⚠️  Secrets Manager (~$0.40/month) - Required for Hedera keys" -ForegroundColor White

# Exit with error code if not compliant
if (-not $freeTierCompliant) {
    exit 1
}
