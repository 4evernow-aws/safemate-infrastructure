# 🔧 SafeMate Free Tier Troubleshooting Guide

**Location**: `docs/troubleshooting/free-tier-issues.md`  
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")  
**Status**: ✅ ACTIVE - Comprehensive Issue Resolution

## 🚨 Emergency Procedures

### **Immediate Cost Control**
```powershell
# If you see expensive resources running
.\fix-free-tier-costs.ps1

# Verify cleanup
.\scripts\check-free-tier.ps1

# Expected: ✅ FREE TIER COMPLIANT
```

### **Cost Spike Response**
```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Stop non-essential resources
aws lambda update-function-configuration \
  --function-name <function-name> \
  --environment Variables='{"ENABLED":"false"}'
```

## 🔍 Common Issues & Solutions

### **Issue 1: Free Tier Compliance Check Failed**

#### **Symptoms**
- Script shows ❌ NOT FREE TIER COMPLIANT
- Expensive resources detected
- Monthly cost elevated

#### **Diagnosis**
```powershell
# Run comprehensive check
.\scripts\check-free-tier.ps1

# Look for specific resource types:
# - ECS Clusters
# - Application Load Balancers
# - CloudFront Distributions
# - ECR Repositories
# - RDS Instances
# - EC2 Instances
```

#### **Solutions**
```powershell
# Quick fix
.\fix-free-tier-costs.ps1

# CloudFront specific (if needed)
.\fix-cloudfront-distributions.ps1

# Verify fix
.\scripts\check-free-tier.ps1
```

#### **Prevention**
- Run checks before deployments
- Use Git hooks (automatic)
- Weekly compliance audits

### **Issue 2: Git Repository Contains Expensive Resources**

#### **Symptoms**
- Pre-commit hook blocks commits
- Pre-push hook blocks pushing
- Terraform validation fails

#### **Diagnosis**
```powershell
# Check Git repository
.\scripts\compare-aws-to-git.ps1

# Look for patterns in Terraform files:
# - aws_ecs_cluster
# - aws_lb or aws_alb
# - aws_cloudfront_distribution
# - aws_ecr_repository
```

#### **Solutions**
```bash
# Remove expensive resources from Terraform
# Comment out or delete these lines:

# ❌ Remove these
# resource "aws_ecs_cluster" "main" { ... }
# resource "aws_lb" "main" { ... }
# resource "aws_cloudfront_distribution" "main" { ... }

# ✅ Keep these (free tier)
# resource "aws_lambda_function" "main" { ... }
# resource "aws_api_gateway_rest_api" "main" { ... }
# resource "aws_dynamodb_table" "main" { ... }
```

#### **Prevention**
- Use free tier alternatives
- Run Terraform validation before commits
- Code review for infrastructure changes

### **Issue 3: AWS vs Git Mismatch**

#### **Symptoms**
- Configuration drift detected
- Resources exist in AWS but not in Git
- Deployment inconsistencies

#### **Diagnosis**
```powershell
# Compare current state
.\scripts\compare-aws-to-git.ps1

# Look for:
# - Resources in AWS not in Git
# - Resources in Git not in AWS
# - Configuration differences
```

#### **Solutions**
```bash
# Option 1: Sync Git to AWS
terraform import aws_lambda_function.main <function-name>

# Option 2: Sync AWS to Git
terraform destroy -target=aws_lambda_function.main

# Option 3: Manual cleanup
aws lambda delete-function --function-name <function-name>
```

#### **Prevention**
- Regular state synchronization
- Use Terraform for all changes
- Avoid manual AWS console changes

### **Issue 4: Terraform Validation Failed**

#### **Symptoms**
- `validate-free-tier.ps1` shows errors
- Expensive resources in configuration
- Deployment blocked

#### **Diagnosis**
```powershell
cd terraform
.\validate-free-tier.ps1

# Look for specific files and resources
# Check all .tf files for expensive patterns
```

#### **Solutions**
```bash
# Remove expensive resources
# Example: Replace ECS with Lambda

# ❌ Remove this
# resource "aws_ecs_cluster" "main" {
#   name = "safemate-cluster"
# }

# ✅ Add this instead
# resource "aws_lambda_function" "main" {
#   filename         = "function.zip"
#   function_name    = "safemate-api"
#   role            = aws_iam_role.lambda_role.arn
#   handler         = "index.handler"
#   runtime         = "nodejs18.x"
# }
```

#### **Prevention**
- Use free tier templates
- Code review infrastructure changes
- Automated validation in CI/CD

### **Issue 5: Script Execution Errors**

#### **Symptoms**
- PowerShell scripts won't run
- Permission denied errors
- Execution policy issues

#### **Diagnosis**
```powershell
# Check execution policy
Get-ExecutionPolicy

# Check PowerShell version
pwsh --version

# Check script permissions
Get-Acl ".\scripts\check-free-tier.ps1"
```

#### **Solutions**
```powershell
# Fix execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verify PowerShell availability
pwsh --version

# Run with explicit execution
pwsh -ExecutionPolicy Bypass -File ".\scripts\check-free-tier.ps1"
```

#### **Prevention**
- Set appropriate execution policies
- Use PowerShell Core (pwsh)
- Regular script testing

### **Issue 6: AWS CLI Authentication Issues**

#### **Symptoms**
- AWS commands fail
- Credential errors
- Permission denied

#### **Diagnosis**
```bash
# Check credentials
aws sts get-caller-identity

# Check configuration
aws configure list

# Check profile
aws configure list --profile safemate-developer
```

#### **Solutions**
```bash
# Reconfigure AWS CLI
aws configure

# Set profile explicitly
export AWS_PROFILE=safemate-developer

# Verify permissions
aws iam get-user
aws iam list-attached-user-policies --user-name <username>
```

#### **Prevention**
- Use IAM roles with appropriate permissions
- Regular credential rotation
- Monitor access logs

## 📊 Diagnostic Commands

### **Quick Health Check**
```powershell
# Complete system check
.\scripts\complete-free-tier-audit.ps1

# Expected: ✅ COMPLETE FREE TIER COMPLIANCE
```

### **Resource Status Check**
```bash
# Check specific services
aws ecs list-clusters
aws elbv2 describe-load-balancers
aws cloudfront list-distributions
aws ecr describe-repositories
aws rds describe-db-instances
aws ec2 describe-instances
```

### **Cost Analysis**
```bash
# Current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Service breakdown
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --group-by Type=DIMENSION,Key=SERVICE \
  --metrics BlendedCost
```

## 🛠️ Advanced Troubleshooting

### **Lambda Function Issues**
```bash
# Check function status
aws lambda get-function --function-name <function-name>

# Check logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/"

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=<function-name>
```

### **DynamoDB Issues**
```bash
# Check table status
aws dynamodb describe-table --table-name <table-name>

# Check capacity
aws dynamodb describe-table --table-name <table-name --query 'Table.{ProvisionedThroughput:ProvisionedThroughput,OnDemandThroughput:OnDemandThroughput}'
```

### **API Gateway Issues**
```bash
# Check API status
aws apigateway get-rest-api --rest-api-id <api-id>

# Check deployment
aws apigateway get-deployment --rest-api-id <api-id> --deployment-id <deployment-id>
```

## 🔄 Recovery Procedures

### **Complete System Recovery**
```powershell
# Step 1: Stop all expensive resources
.\fix-free-tier-costs.ps1

# Step 2: Verify cleanup
.\scripts\check-free-tier.ps1

# Step 3: Validate Git repository
.\scripts\compare-aws-to-git.ps1

# Step 4: Complete audit
.\scripts\complete-free-tier-audit.ps1

# Step 5: Redeploy if needed
cd terraform
terraform plan
terraform apply
```

### **Partial Recovery**
```bash
# Identify specific issues
.\scripts\check-free-tier.ps1

# Fix specific resource types
# Example: Remove only ECS resources
aws ecs delete-service --cluster <cluster-name> --service <service-name> --force
aws ecs delete-cluster --cluster <cluster-name>
```

## 📈 Prevention Strategies

### **Daily Checks**
- Cursor startup validation (automatic)
- Pre-commit hooks (automatic)
- Pre-push hooks (automatic)

### **Weekly Checks**
- Complete free tier audit
- Cost review
- Performance monitoring

### **Monthly Checks**
- AWS Cost Explorer review
- Free tier usage analysis
- Resource optimization

## 🆘 Emergency Contacts

### **Immediate Response**
1. **Stop expensive resources**: `.\fix-free-tier-costs.ps1`
2. **Verify cleanup**: `.\scripts\check-free-tier.ps1`
3. **Document issue**: Note what caused the problem
4. **Implement prevention**: Fix root cause

### **Escalation Path**
1. **Automated scripts** (immediate)
2. **Manual verification** (within 1 hour)
3. **Root cause analysis** (within 4 hours)
4. **Prevention implementation** (within 24 hours)

## 📚 Additional Resources

### **Documentation**
- [Free Tier Guardrails](../aws/free-tier-guardrails.md)
- [Deployment Guide](../deployment/free-tier-deployment-guide.md)
- [Architecture Documentation](../architecture/current-architecture.md)

### **Scripts**
- [Free Tier Check](../../scripts/check-free-tier.ps1)
- [AWS vs Git Comparison](../../scripts/compare-aws-to-git.ps1)
- [Complete Audit](../../scripts/complete-free-tier-audit.ps1)

### **External Resources**
- [AWS Support](https://aws.amazon.com/support/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)

---

**Troubleshooting Status**: ✅ **COMPREHENSIVE**  
**Coverage**: ✅ **ALL COMMON ISSUES**  
**Recovery Time**: ✅ **< 1 HOUR**  
**Prevention**: ✅ **AUTOMATED**  

This troubleshooting guide provides **immediate solutions** for all common free tier issues and **prevention strategies** to avoid future problems.
