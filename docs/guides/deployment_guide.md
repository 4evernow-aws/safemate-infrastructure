# 🚀 SafeMate Production Deployment Guide

## 📋 Overview

This guide covers the complete process for deploying SafeMate to production. The production environment uses AWS serverless infrastructure with CloudFront for global distribution.

## 🌐 Production Environment

- **Production URL**: `https://d19a5c2wn4mtdt.cloudfront.net/`
- **Infrastructure**: AWS Serverless + CloudFront + S3 Static Hosting
- **Region**: ap-southeast-2 (Sydney)
- **Environment**: Production

## 🔄 Deployment Process

### Option 1: Automated Deployment (Recommended)

Use the automated PowerShell script:

```powershell
# Full deployment (build + infrastructure + deploy)
.\deploy-to-production.ps1

# Skip build (if already built)
.\deploy-to-production.ps1 -SkipBuild

# Skip infrastructure (if no infrastructure changes)
.\deploy-to-production.ps1 -SkipInfrastructure

# Force deployment with uncommitted changes
.\deploy-to-production.ps1 -Force
```

### Option 2: Manual Deployment

#### Step 1: Prepare Code
```bash
# Navigate to project root
cd D:\cursor_projects\safemate_v2

# Ensure you're on main branch
git checkout main
git pull origin main
```

#### Step 2: Build Frontend
```bash
# Navigate to frontend
cd apps/web/safemate

# Install dependencies (if needed)
npm install

# Build for production
npm run build
```

#### Step 3: Deploy Infrastructure (if needed)
```bash
# Navigate to Terraform
cd ../../terraform

# Check for changes
terraform plan -out=deploy-plan.tfplan

# Apply changes (if any)
terraform apply deploy-plan.tfplan
```

#### Step 4: Deploy to S3
```bash
# Sync built files to S3
aws s3 sync dist/ s3://default-safemate-static-hosting --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E3U5WV0TJVXFOT \
  --paths "/*"
```

#### Step 5: Monitor Deployment
```bash
# Check CloudFront invalidation status
aws cloudfront get-invalidation \
  --distribution-id E3U5WV0TJVXFOT \
  --id [INVALIDATION_ID]
```

#### Step 6: Verify Production
```bash
# Test production site
Invoke-WebRequest -Uri "https://d19a5c2wn4mtdt.cloudfront.net/" -Method GET
```

## 🛠️ Prerequisites

### Required Tools
- **Node.js**: v18+ (for building frontend)
- **AWS CLI**: Configured with appropriate permissions
- **Terraform**: v1.0+ (for infrastructure changes)

## 📁 **Updated Project Structure** (Post-Cleanup)

The project structure has been optimized for better maintainability:

```
safemate_v2/
├── apps/web/safemate/          # Frontend application
├── services/                   # Backend Lambda functions
│   ├── hedera-service/         # Main blockchain service
│   ├── user-onboarding/        # User onboarding
│   ├── wallet-creator/         # Wallet creation
│   └── wallet-manager/         # Wallet management
├── utils/                      # Shared utilities
├── tests/                      # Organized test files
├── aws-layer/                  # AWS SDK layer
├── hedera-layer/               # Hedera SDK layer
├── lambda-layer/               # General Lambda layer
├── minimal-hedera-layer/       # Minimal Hedera layer
├── optimized-layer/            # Optimized layer
└── terraform/                  # Infrastructure as Code
```

**Note**: Redundant layer directories and duplicate files have been removed for better organization.
- **PowerShell**: For running deployment scripts

### Required Permissions
- **S3**: Read/Write access to `default-safemate-static-hosting` bucket
- **CloudFront**: Invalidation permissions for distribution
- **Lambda**: Update function code permissions
- **API Gateway**: Deploy API permissions

## 📁 Project Structure for Deployment

```
safemate_v2/
├── apps/web/safemate/          # Frontend application
│   ├── src/                    # Source code
│   ├── dist/                   # Built files (after npm run build)
│   └── package.json           # Dependencies
├── terraform/                  # Infrastructure as Code
├── services/                   # Lambda functions
└── deployment scripts/         # PowerShell deployment scripts
```

## 🔧 Build Configuration

### Frontend Build
The frontend uses Vite for building:

```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Production environment variables are configured in:
- `.env.preprod` - Pre-Production-specific variables
- `amplify-config.ts` - AWS Amplify configuration

## 🚀 Deployment Scripts

### Available Scripts
- `deploy-to-production.ps1` - Full production deployment
- `deploy-to-production-with-sync.ps1` - Deployment with sync
- `deploy-static.ps1` - Static file deployment only
- `simple-deploy.ps1` - Simplified deployment process

### Script Usage
```powershell
# Full deployment
.\deploy-to-production.ps1

# Static deployment only
.\deploy-static.ps1

# Simple deployment
.\simple-deploy.ps1
```

## 🔍 Monitoring and Verification

### Health Checks
- **Frontend**: CloudFront distribution health
- **Backend**: Lambda function health
- **Database**: DynamoDB table status
- **Authentication**: Cognito user pool status

### Monitoring Tools
- **CloudWatch**: Application metrics and logs
- **CloudFront**: Distribution metrics
- **Lambda**: Function metrics and logs
- **API Gateway**: API metrics

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Clear Vite cache
Remove-Item -Recurse -Force node_modules/.vite
```

#### Deployment Failures
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 bucket access
aws s3 ls s3://default-safemate-static-hosting

# Check CloudFront distribution
aws cloudfront get-distribution --id E3U5WV0TJVXFOT
```

#### Cache Issues
```bash
# Force CloudFront invalidation
aws cloudfront create-invalidation \
  --distribution-id E3U5WV0TJVXFOT \
  --paths "/*"
```

## 📊 Post-Deployment Verification

### Frontend Verification
1. **Load Time**: Check page load performance
2. **Functionality**: Test all major features
3. **Responsive Design**: Test on different screen sizes
4. **Widget System**: Verify modular dashboard functionality

### Backend Verification
1. **API Endpoints**: Test all Lambda functions
2. **Authentication**: Verify Cognito integration
3. **Database**: Check DynamoDB connectivity
4. **Blockchain**: Test Hedera integration

### Security Verification
1. **HTTPS**: Ensure all traffic is encrypted
2. **CORS**: Verify cross-origin request handling
3. **Authentication**: Test user authentication flow
4. **Authorization**: Verify role-based access control

## 🔄 Rollback Process

### Frontend Rollback
```bash
# Revert to previous version
git checkout HEAD~1
npm run build
aws s3 sync dist/ s3://default-safemate-static-hosting --delete
aws cloudfront create-invalidation --distribution-id E3U5WV0TJVXFOT --paths "/*"
```

### Infrastructure Rollback
```bash
# Revert Terraform changes
terraform plan -out=rollback-plan.tfplan
terraform apply rollback-plan.tfplan
```

## 📞 Support

### Emergency Contacts
- **AWS Support**: Available through AWS Console
- **Team Lead**: For critical deployment issues
- **Documentation**: Check this guide and other docs

### Useful Resources
- **AWS Console**: https://console.aws.amazon.com/
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/
- **CloudFront**: https://console.aws.amazon.com/cloudfront/
- **S3**: https://console.aws.amazon.com/s3/

---

*Last Updated: January 13, 2025*
*Version: 2.1 - Updated for Modular Dashboard System*