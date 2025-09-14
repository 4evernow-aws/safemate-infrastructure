# SafeMate Infrastructure

Infrastructure as Code (IaC) for SafeMate blockchain document storage platform using Terraform and AWS services.

## Overview

This repository contains all infrastructure components for SafeMate, including AWS Lambda functions, API Gateway, DynamoDB tables, KMS keys, and other AWS resources. All infrastructure is optimized for AWS Free Tier compliance and cost-effectiveness.

## Architecture

### Core Infrastructure Components

- **AWS Lambda Functions** - Serverless compute for all backend services
- **API Gateway** - RESTful API endpoints with CORS support
- **DynamoDB** - NoSQL database for user data and metadata
- **KMS** - Encryption key management for sensitive data
- **Cognito** - User authentication and authorization
- **S3** - File storage and static website hosting
- **CloudWatch** - Logging and monitoring

### Free Tier Compliance

All infrastructure is designed to stay within AWS Free Tier limits:
- **Lambda**: 1M requests/month free
- **API Gateway**: 1M calls/month free
- **DynamoDB**: 25GB storage free
- **Cognito**: 50,000 MAUs free
- **S3**: 5GB storage free
- **CloudWatch**: 5GB ingestion free

## Directory Structure

```
safemate-infrastructure/
├── terraform/                 # Terraform configuration files
│   ├── lambda.tf             # Lambda function definitions
│   ├── api-gateway.tf        # API Gateway configuration
│   ├── dynamodb.tf           # DynamoDB table definitions
│   ├── cognito.tf            # Cognito user pool configuration
│   ├── kms.tf                # KMS key definitions
│   ├── s3.tf                 # S3 bucket configuration
│   └── variables.tf          # Terraform variables
├── scripts/                  # Deployment and utility scripts
│   ├── deployment/           # Deployment scripts
│   ├── fixes/                # Infrastructure fix scripts
│   └── security/             # Security-related scripts
├── simple-lambda/            # Simple Lambda function template
├── services/                 # Service-specific configurations
└── docs/                     # Documentation
```

## Services

### Lambda Functions

- **user-onboarding** - User registration and wallet creation
- **hedera-service** - Blockchain operations and Hedera integration
- **email-verification-service** - Email verification handling
- **token-vault** - Secure token and secret management
- **group-manager** - Team collaboration features
- **safemate-directory-creator** - File organization
- **wallet-manager** - Wallet operations
- **post-confirmation-wallet-creator** - Cognito trigger

### API Endpoints

- **User Onboarding API** - `/onboarding/*`
- **Hedera Service API** - `/hedera/*`
- **Email Verification API** - `/email-verification/*`
- **Token Vault API** - `/vault/*`
- **Group Manager API** - `/groups/*`
- **Directory Creator API** - `/directories/*`
- **Wallet Manager API** - `/wallet/*`

## Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** installed (v1.0+)
3. **Node.js** for Lambda function packaging

### Environment Setup

```bash
# Configure AWS CLI
aws configure

# Verify Terraform installation
terraform --version

# Initialize Terraform
cd terraform
terraform init
```

### Deployment Commands

```bash
# Plan deployment
terraform plan -out=deployment.plan

# Apply changes
terraform apply deployment.plan

# Destroy infrastructure (if needed)
terraform destroy
```

### Environment-Specific Deployment

```bash
# Development environment
terraform plan -var-file="environments/dev.tfvars"

# Pre-production environment
terraform plan -var-file="environments/preprod.tfvars"

# Production environment
terraform plan -var-file="environments/production.tfvars"
```

## Scripts

### Deployment Scripts

- **`deploy-simple-lambda.js`** - Deploy simple Lambda functions
- **`deploy-full-lambda.js`** - Deploy complete Lambda functions with dependencies
- **`deploy-lambda.js`** - General Lambda deployment script

### Fix Scripts

- **`fix-lambda-simple.js`** - Fix simple Lambda function issues
- **`fix-hedera-api-cors.ps1`** - Fix CORS issues for Hedera API
- **`fix-folders-cors.ps1`** - Fix CORS issues for folders API

### Utility Scripts

- **`check-free-tier.ps1`** - Verify Free Tier compliance
- **`compare-aws-to-git.ps1`** - Compare AWS resources to Git configuration
- **`complete-free-tier-audit.ps1`** - Comprehensive Free Tier audit

## Configuration

### Environment Variables

Each Lambda function requires specific environment variables:

```bash
# Common variables
WALLETS_TABLE=dev-safemate-wallets
FOLDERS_TABLE=dev-safemate-hedera-folders
WALLET_KEYS_TABLE=dev-safemate-wallet-keys
USER_KEYS_KMS_KEY_ID=alias/safemate-master-key-dev
COGNITO_USER_POOL_ID=your-user-pool-id
CLIENT_ID=your-client-id

# Hedera-specific variables
HEDERA_OPERATOR_ID=0.0.1234567
HEDERA_OPERATOR_KEY=your-private-key
HEDERA_NETWORK=testnet
```

### Terraform Variables

Key Terraform variables that can be customized:

```hcl
variable "environment" {
  description = "Environment name (dev, preprod, production)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "safemate"
}
```

## Monitoring and Logging

### CloudWatch Logs

All Lambda functions automatically log to CloudWatch:
- **Log Groups**: `/aws/lambda/{function-name}`
- **Retention**: 14 days (Free Tier limit)
- **Monitoring**: Error rates, duration, and invocations

### Cost Monitoring

- **AWS Cost Explorer** - Monthly cost analysis
- **Free Tier Usage** - Track Free Tier consumption
- **Billing Alerts** - Set up cost alerts

## Security

### Encryption

- **KMS Keys** - Encrypt sensitive data
- **DynamoDB** - Encryption at rest
- **S3** - Server-side encryption
- **Lambda** - Environment variable encryption

### Access Control

- **IAM Roles** - Least privilege access
- **Cognito** - User authentication
- **API Gateway** - Request authorization
- **VPC** - Network isolation (if needed)

## Troubleshooting

### Common Issues

1. **Free Tier Exceeded**
   ```bash
   # Check Free Tier usage
   aws ce get-cost-and-usage --time-period Start=2025-01-01,End=2025-01-31
   
   # Run compliance check
   .\scripts\check-free-tier.ps1
   ```

2. **Lambda Function Errors**
   ```bash
   # Check CloudWatch logs
   aws logs tail /aws/lambda/function-name --follow
   
   # Test function directly
   aws lambda invoke --function-name function-name response.json
   ```

3. **API Gateway Issues**
   ```bash
   # Check API Gateway logs
   aws logs tail /aws/apigateway/api-name --follow
   
   # Test endpoint
   curl -X POST https://api-id.execute-api.region.amazonaws.com/stage/endpoint
   ```

### Emergency Procedures

```bash
# Stop all expensive resources
.\scripts\fix-free-tier-costs.ps1

# Verify cleanup
.\scripts\check-free-tier.ps1

# Complete audit
.\scripts\complete-free-tier-audit.ps1
```

## Development Workflow

### Branch Structure

- **`main`** - Production-ready infrastructure
- **`dev`** - Development environment
- **`preprod`** - Pre-production environment

### Deployment Pipeline

1. **Development** - Test changes locally
2. **Pre-production** - Deploy to staging environment
3. **Production** - Deploy to production environment

### Best Practices

- **Infrastructure as Code** - All changes via Terraform
- **Version Control** - Track all infrastructure changes
- **Testing** - Validate changes before deployment
- **Monitoring** - Continuous monitoring of resources
- **Cost Control** - Regular Free Tier compliance checks

## Recent Updates

### AWS SDK v3 Migration
- **Status**: ✅ Complete
- **Impact**: Improved performance and reduced bundle size
- **Services**: All Lambda functions migrated

### Free Tier Optimization
- **Status**: ✅ Complete
- **Cost**: Reduced from $100+/month to ~$1.40/month
- **Compliance**: 100% Free Tier compliant

### Deployment Scripts
- **Status**: ✅ Complete
- **Scripts**: PowerShell and batch deployment scripts
- **Documentation**: Comprehensive deployment guides

## Support

### Documentation
- **Terraform Docs**: `terraform/README.md`
- **Scripts Docs**: `scripts/README.md`
- **Troubleshooting**: `docs/troubleshooting/`

### Emergency Support
- **Free Tier Issues**: Run `.\scripts\check-free-tier.ps1`
- **Deployment Issues**: Check `docs/deployment/`
- **Security Issues**: Review `docs/security/`

---

**SafeMate Infrastructure Status**: ✅ **PRODUCTION READY**  
**Free Tier Compliance**: ✅ **100% COMPLIANT**  
**Cost Target**: ✅ **~$1.40/MONTH**  
**Last Updated**: 2025-01-15