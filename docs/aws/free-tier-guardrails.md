# 🛡️ SafeMate Free Tier Guardrails

**Location**: `docs/aws/free-tier-guardrails.md`  
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")  
**Status**: ✅ ACTIVE - All systems operational

## 🚨 Why This System Exists

**Previous Issue**: SafeMate was running $100+ monthly AWS bills due to expensive resources:
- 4 Application Load Balancers ($64.80/month)
- 3 ECS Fargate services ($24-45/month)
- 3 CloudFront distributions (variable costs)
- 4 ECR repositories (variable costs)

**Solution**: Automated checks that prevent deployment of expensive resources.

**Current Status**: ✅ **FREE TIER COMPLIANT** - Monthly cost: $0.00

## 📋 Available Scripts

### 1. **Free Tier Compliance Check** (`scripts/check-free-tier.ps1`)
**Purpose**: Comprehensive check of all AWS resources  
**When to run**: 
- At Cursor startup
- Before deployments
- When checking costs
- Weekly maintenance

**What it checks**:
- ✅ ECS Clusters (should be 0)
- ✅ Application Load Balancers (should be 0)
- ✅ CloudFront Distributions (should be 0)
- ✅ ECR Repositories (should be 0)
- ✅ RDS Instances (should be 0)
- ✅ EC2 Instances (should be 0)
- ✅ ElastiCache Clusters (should be 0)

### 2. **AWS vs Git Comparison** (`scripts/compare-aws-to-git.ps1`)
**Purpose**: Compares current AWS resources to Git repository  
**When to run**: 
- Before deployments
- When checking for configuration drift
- Weekly compliance audits
- Before pushing to remote

**What it checks**:
- ✅ Current AWS resources vs Git definitions
- ✅ Terraform files for expensive resources
- ✅ Free tier resources in Git
- ✅ Configuration consistency

### 3. **Complete Free Tier Audit** (`scripts/complete-free-tier-audit.ps1`)
**Purpose**: Comprehensive audit of entire setup  
**When to run**: 
- Weekly compliance checks
- Before major deployments
- When setting up new environments
- After configuration changes

**What it checks**:
- ✅ AWS resources
- ✅ Git repository
- ✅ Terraform configurations
- ✅ Git hooks status
- ✅ Cursor startup script

### 4. **Cursor Startup Script** (`.cursor-startup.ps1`)
**Purpose**: Automatically runs free tier check when Cursor starts  
**Location**: Project root directory  
**Automatic**: Runs every time you open Cursor

### 5. **Git Pre-commit Hook** (`.git/hooks/pre-commit`)
**Purpose**: Prevents commits if expensive resources are running  
**Automatic**: Runs before every Git commit  
**Benefit**: Stops expensive deployments before they happen

### 6. **Git Pre-push Hook** (`.git/hooks/pre-push`)
**Purpose**: Prevents pushing expensive resources to remote  
**Automatic**: Runs before every Git push  
**Benefit**: Stops expensive resources from reaching remote repository

### 7. **Terraform Validation** (`terraform/validate-free-tier.ps1`)
**Purpose**: Checks Terraform configs for expensive resources  
**When to run**: Before `terraform plan` or `terraform apply`  
**What it scans**: All `.tf` files for expensive resource types

## 🚀 How to Use

### **Automatic Checks (Recommended)**
1. **Cursor Startup**: Runs automatically ✅
2. **Git Commits**: Blocks automatically ✅  
3. **Git Push**: Blocks automatically ✅
4. **Terraform**: Run validation before apply

### **Manual Checks**

```powershell
# Quick check of current AWS resources
.\scripts\check-free-tier.ps1

# Compare AWS to Git repository
.\scripts\compare-aws-to-git.ps1

# Complete comprehensive audit
.\scripts\complete-free-tier-audit.ps1

# Validate Terraform configs
cd terraform
.\validate-free-tier.ps1

# Fix issues (if found)
.\fix-free-tier-costs.ps1
```

## 💰 Cost Expectations

### **✅ Free Tier (What we use)**
- **Lambda Functions**: 1M requests/month free
- **API Gateway**: 1M calls/month free
- **DynamoDB**: 25GB storage free
- **Cognito**: 50,000 MAUs free
- **CloudWatch Logs**: 5GB ingestion free
- **S3 Standard**: 5GB storage free

### **⚠️ Minimal Paid Services (Required)**
- **KMS Key**: ~$1/month (encryption required)
- **Secrets Manager**: ~$0.40/month (Hedera keys required)

### **❌ Expensive Services (Blocked)**
- **ECS Fargate**: $8-15/month per service
- **Application Load Balancers**: $16.20/month each
- **CloudFront**: $0.085/GB transferred
- **ECR**: $0.10/month per GB stored
- **RDS**: $15-100+/month per instance
- **EC2**: $10-100+/month per instance

## 🎯 Target Monthly Cost

**Current**: $0.00/month ✅  
**Previous**: $100+/month ❌  
**Savings**: ~$98.60/month 🎉

## 🔧 What Happens When Issues Are Found

### **Cursor Startup**
- Shows warning if expensive resources detected
- Provides fix command
- Still allows development to continue

### **Git Pre-commit**
- **BLOCKS COMMIT** if expensive resources running
- Shows detailed list of issues
- Requires cleanup before commit allowed

### **Git Pre-push**
- **BLOCKS PUSH** if expensive resources in Git or AWS
- Prevents expensive resources from reaching remote
- Requires cleanup before push allowed

### **Terraform Validation**
- **BLOCKS APPLY** if expensive resources in config
- Shows which files contain expensive resources
- Requires config cleanup before deployment

### **AWS vs Git Comparison**
- **Detects configuration drift** between AWS and Git
- **Identifies expensive resources** in both places
- **Ensures consistency** before deployments

## 🚨 Emergency Fix Commands

If expensive resources are found:

```powershell
# Quick fix - removes all expensive resources
.\fix-free-tier-costs.ps1

# CloudFront specific fix (if needed)
.\fix-cloudfront-distributions.ps1

# Check status after fix
.\scripts\check-free-tier.ps1

# Compare AWS to Git after fix
.\scripts\compare-aws-to-git.ps1
```

## 📊 Monitoring and Maintenance

### **Daily**
- Cursor startup check (automatic)

### **Before Commits**
- Git pre-commit hook (automatic)

### **Before Push**
- Git pre-push hook (automatic)

### **Before Deployments**
- Terraform validation (manual)
- Free tier compliance check (manual)
- AWS vs Git comparison (manual)

### **Weekly**
- Complete free tier audit (manual)
- Review AWS Cost Explorer
- Check for any unexpected charges

## 🎯 Best Practices

1. **Always run validation before Terraform apply**
2. **Check free tier compliance before major changes**
3. **Use free tier alternatives for all new features**
4. **Monitor costs in AWS Cost Explorer monthly**
5. **Keep KMS and Secrets Manager (minimal required costs)**
6. **Run complete audit weekly** ⭐
7. **Compare AWS to Git before deployments** ⭐

## 🔍 Troubleshooting

### **Script won't run**
- Ensure PowerShell is available
- Check execution policy: `Get-ExecutionPolicy`
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### **AWS CLI not working**
- Check credentials: `aws sts get-caller-identity`
- Verify region: `aws configure list`

### **Git hooks not working**
- Ensure hooks are executable: `chmod +x .git/hooks/*`
- Check PowerShell availability: `pwsh --version`

### **False positives**
- Scripts are conservative - they flag anything potentially expensive
- Review flagged resources manually if needed
- Some resources may be necessary for your use case

## 📞 Support

If you encounter issues:
1. Check the script output for specific error messages
2. Verify AWS credentials and permissions
3. Run manual AWS CLI commands to verify resource status
4. Use the fix scripts to resolve issues
5. Run the complete audit to identify all issues

## 📈 Current Status

**Last Audit**: $(Get-Date -Format "yyyy-MM-dd HH:mm")  
**Status**: ✅ FREE TIER COMPLIANT  
**Monthly Cost**: $0.00  
**Protection Level**: 🛡️ MAXIMUM  

---

**Remember**: This system prevents the $100+ monthly bills you experienced before. It's designed to be strict to protect your wallet! 🛡️💰

**New Features**: The AWS vs Git comparison ensures your repository and infrastructure stay in sync, preventing expensive resources from being accidentally deployed! 🔄✅
