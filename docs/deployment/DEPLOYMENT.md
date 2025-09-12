# SafeMate Deployment Guide

## 🏗️ Environment Architecture

SafeMate supports multiple environments with complete isolation:

### **Environments**
- **Development (dev)**: `dev-safemate-*` resources
- **Pre-Production (preprod)**: `preprod-safemate-*` resources  
- **Production (prod)**: `prod-safemate-*` resources

### **Resource Naming Convention**
```
{environment}-safemate-{service}
Examples:
- dev-safemate-wallet-manager
- preprod-safemate-user-onboarding
- prod-safemate-hedera-service
```

## 🚀 Deployment Methods

### **1. Local Deployment (PowerShell)**

#### Development
```powershell
.\deploy-dev.ps1
```

#### Pre-Production
```powershell
.\deploy-preprod.ps1
```

#### Production
```powershell
.\deploy-prod.ps1
```

### **2. GitHub Actions (Automated)**

#### Automatic Triggers
- **Push to `main` branch** → Deploy to Production
- **Push to `dev` branch** → Deploy to Development
- **Push to `preprod` branch** → Deploy to Pre-Production
- **Push to `prod` branch** → Deploy to Production

#### Manual Deployment
1. Go to **Actions** tab in GitHub
2. Select **"Deploy SafeMate Environments"**
3. Click **"Run workflow"**
4. Choose environment: `dev`, `preprod`, or `prod`
5. Click **"Run workflow"**

### **3. GitHub Issues (Approval Workflow)**

1. Create issue using **"Deployment Request"** template
2. Fill in environment and change details
3. Get approval from team
4. GitHub Actions will automatically deploy

## 🔧 Configuration Files

### **Environment Variables**
- `terraform/dev.tfvars` - Development configuration
- `terraform/preprod.tfvars` - Pre-production configuration
- `terraform/prod.tfvars` - Production configuration

### **Frontend Environment Files**
- `apps/web/safemate/.env.preprod` - Pre-Production frontend config
- `apps/web/safemate/.env.preprod` - Pre-production frontend config

## 🌐 Environment URLs

### **Development**
- **Frontend**: `http://localhost:5173/`
- **APIs**: `dev-safemate-*` Lambda functions
- **Network**: Hedera Testnet

### **Pre-Production**
- **Frontend**: `https://d19a5c2wn4mtdt.cloudfront.net/`
- **APIs**: `preprod-safemate-*` Lambda functions
- **Network**: Hedera Testnet

### **Production**
- **Frontend**: `https://prod.safemate.com/` (TBD - Documented Only)
- **APIs**: `prod-safemate-*` Lambda functions
- **Network**: Hedera Mainnet

## 💰 Cost Management

### **Free Tier Compliance**
All environments are optimized for AWS Free Tier:

- **Lambda**: 1M requests/month (free)
- **API Gateway**: 1M calls/month (free)
- **DynamoDB**: 25GB storage (free)
- **CloudWatch**: 5GB ingestion (free)

### **Paid Services (Minimal)**
- **KMS Key**: $1.00/month per environment
- **Secrets Manager**: $0.40/month per environment

### **Total Monthly Cost**
- **Single Environment**: $0.00/month
- **All 3 Environments**: ~$4.20/month

## 🔄 Git Workflow

### **Recommended Branch Strategy**

```
main branch (production)
├── preprod branch (pre-production)
├── dev branch (development)
└── feature branches
```

### **Deployment Flow**
1. **Feature Development** → `feature/xyz` branch
2. **Development Testing** → `dev` branch → Deploy to dev
3. **Pre-Production Testing** → `preprod` branch → Deploy to preprod
4. **Production Release** → `main` branch → Deploy to prod

## 🛡️ Security & Best Practices

### **Environment Isolation**
- ✅ Separate AWS resources per environment
- ✅ Environment-specific KMS keys
- ✅ Environment-specific secrets
- ✅ Environment-specific API Gateway stages

### **Access Control**
- ✅ Different IAM roles per environment
- ✅ Environment-specific Cognito user pools
- ✅ Environment-specific DynamoDB tables

### **Monitoring**
- ✅ Environment-specific CloudWatch logs
- ✅ Environment-specific alarms
- ✅ Environment-specific metrics

## 🚨 Rollback Procedures

### **Infrastructure Rollback**
```powershell
# Rollback to previous Terraform state
cd terraform
terraform plan -var-file="{environment}.tfvars"
terraform apply -var-file="{environment}.tfvars"
```

### **Application Rollback**
```powershell
# Revert to previous Git commit
git revert HEAD
git push origin {branch}
```

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review CloudWatch logs
3. Verify environment variables
4. Contact team lead

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")
**Version**: 1.0.0
