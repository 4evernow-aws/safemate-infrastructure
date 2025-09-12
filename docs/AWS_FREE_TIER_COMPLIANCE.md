# AWS Free Tier Compliance Guide

## 🎯 **Overview**
This document ensures SafeMate stays within AWS Free Tier limits to prevent unexpected costs.

## 📊 **Free Tier Limits by Service**

### **Lambda Functions**
- **Memory**: 128MB per function (max)
- **Timeout**: 15 seconds per function (max)
- **Requests**: 1 million per month
- **Compute**: 400,000 GB-seconds per month
- **Storage**: 512MB ephemeral storage

### **API Gateway**
- **Instances**: 1 REST API (max)
- **Requests**: 1 million per month
- **Data Transfer**: 15GB per month

### **Cognito User Pool**
- **Users**: 50 users (max)
- **MFA**: 50,000 authentications per month

### **SES (Simple Email Service)**
- **From Lambda/EC2**: 62,000 emails per month
- **From other sources**: 200 emails per day (production mode)

### **IAM**
- **Roles**: 5 roles (max)
- **Users**: 5 users (max)

### **CloudWatch**
- **Logs**: 5GB data ingestion per month
- **Metrics**: 5 custom metrics (max)

## 🔧 **Current Configuration**

### **Lambda Functions (All Optimized)**
✅ `dev-safemate-email-verification`: 128MB, 15s
✅ `dev-safemate-user-onboarding`: 128MB, 15s
✅ `dev-safemate-hedera-service`: 128MB, 15s
✅ All other functions: 128MB, 3-15s

### **API Gateway**
✅ Single instance: `dev-safemate-email-verification-api`

### **Cognito**
✅ User Pool: `dev-safemate-user-pool-v2`
✅ Users: 1 (well under 50 limit)

## 🚨 **Cost Prevention Measures**

### **1. Automated Monitoring Scripts**
- `check-free-tier-compliance.ps1` - Daily compliance check
- `optimize-lambda-free-tier.ps1` - Auto-optimize Lambda functions

### **2. Git Hooks (Pre-commit/Pre-push)**
- Prevent deployment of non-free-tier resources
- Validate Terraform configurations

### **3. Cursor Session Startup Check**
- Automatic compliance verification on session start
- Immediate alerts for violations

## 📋 **Daily Compliance Checklist**

### **Morning Check**
- [ ] Run `.\check-free-tier-compliance.ps1`
- [ ] Verify no new expensive resources
- [ ] Check Lambda function configurations

### **Before Deployment**
- [ ] Run Terraform plan with free tier validation
- [ ] Verify Lambda memory ≤ 128MB
- [ ] Verify Lambda timeout ≤ 15s
- [ ] Check API Gateway count ≤ 1

### **Weekly Review**
- [ ] Review AWS Cost Explorer
- [ ] Check for unused resources
- [ ] Verify user counts in Cognito

## 🛠️ **Troubleshooting Common Issues**

### **Lambda Memory/Timeout Exceeded**
```powershell
# Fix individual function
aws lambda update-function-configuration `
    --function-name FUNCTION_NAME `
    --memory-size 128 `
    --timeout 15

# Fix all functions
.\optimize-lambda-free-tier.ps1
```

### **Multiple API Gateways**
```powershell
# List all APIs
aws apigateway get-rest-apis

# Delete duplicate
aws apigateway delete-rest-api --rest-api-id API_ID
```

### **SES Production Mode**
- **Issue**: 200 emails/day limit (not free tier)
- **Solution**: Completely disabled - no email sending capability

## 💰 **Cost Estimation (Free Tier)**
```
Monthly Costs: $0.00
├── Lambda: $0.00 (1M requests, 400K GB-seconds)
├── API Gateway: $0.00 (1M API calls)
├── Cognito: $0.00 (50 users)
├── SES: $0.00 (completely disabled)
├── CloudWatch: $0.00 (5GB data, 5 metrics)
└── IAM: $0.00 (5 roles)
```

## 🚫 **Forbidden Resources (Non-Free Tier)**
- ❌ Application Load Balancers (ALB)
- ❌ ECS Fargate
- ❌ CloudFront distributions
- ❌ ECR repositories
- ❌ RDS databases
- ❌ ElastiCache
- ❌ Redshift clusters

## 📱 **Monitoring & Alerts**

### **Automated Scripts**
1. **Daily Check**: `.\check-free-tier-compliance.ps1`
2. **Optimization**: `.\optimize-lambda-free-tier.ps1`
3. **Cost Analysis**: `.\analyze-aws-costs.ps1`

### **Manual Checks**
1. **AWS Console**: Cost Explorer → Monthly costs
2. **AWS CLI**: Resource counts and configurations
3. **Terraform**: Plan output validation

## 🔒 **Security Best Practices**

### **IAM Roles**
- Use least privilege principle
- Regular access reviews
- Monitor role usage

### **Lambda Functions**
- Secure environment variables
- VPC isolation if needed
- Regular dependency updates

## 📚 **Additional Resources**

### **AWS Documentation**
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [API Gateway Pricing](https://aws.amazon.com/api-gateway/pricing/)

### **SafeMate Documentation**
- [Architecture Overview](../ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Troubleshooting](../TROUBLESHOOTING.md)

## 🎯 **Success Metrics**

### **Cost Control**
- ✅ Monthly AWS bill: $0.00
- ✅ All services within free tier limits
- ✅ No unexpected resource deployments

### **Performance**
- ✅ Lambda functions: 128MB memory, 15s timeout
- ✅ API Gateway: Single instance
- ✅ Cognito: Under 50 users

### **Monitoring**
- ✅ Daily compliance checks
- ✅ Automated optimization
- ✅ Git hook enforcement

---

**Last Updated**: September 4, 2025  
**Next Review**: Weekly  
**Responsible Team**: SafeMate Development Team
