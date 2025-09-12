# Complete Preprod Migration Guide

## Overview

The `migrate-dev-to-preprod-complete.sh` and `migrate-dev-to-preprod-complete.ps1` scripts provide a comprehensive solution for migrating from development to pre-production environment. These scripts handle all aspects of the migration including infrastructure deployment, frontend deployment, documentation updates, and cleanup.

## Features

### ✅ Complete Infrastructure Deployment
- **Terraform Infrastructure**: Deploys all AWS resources with `preprod-` prefix
- **Lambda Functions**: All Lambda functions deployed with preprod configuration
- **API Gateways**: Configured with `/preprod` stage
- **DynamoDB Tables**: Preprod-specific tables created
- **Cognito User Pool**: Preprod user pool configured
- **CloudFront Distribution**: CDN distribution for frontend hosting
- **S3 Bucket**: Static website hosting for frontend

### ✅ Frontend Deployment
- **Configuration**: Creates preprod environment configuration
- **Build**: Builds frontend with preprod settings
- **Deployment**: Deploys to S3 and invalidates CloudFront cache
- **Verification**: Tests build and deployment

### ✅ Documentation Management
- **Updates**: Updates all documentation with current status
- **Organization**: Moves outdated docs to archive
- **HTML Diagrams**: Updates workflow and architecture diagrams
- **Status Tracking**: Updates deployment status across all docs

### ✅ Cleanup Operations
- **Temporary Files**: Removes all backup and temporary files
- **Test Files**: Cleans up test files and scripts
- **Duplicate Files**: Removes duplicate and backup files
- **Archive Management**: Organizes outdated documentation

### ✅ Verification & Testing
- **Infrastructure**: Verifies all AWS resources are deployed
- **Frontend**: Confirms frontend is accessible
- **APIs**: Tests API endpoints are working
- **Lambda Functions**: Verifies Lambda functions are operational

## Usage

### Bash Script (Linux/WSL)
```bash
# Complete migration
./migrate-dev-to-preprod-complete.sh

# Make executable first
chmod +x migrate-dev-to-preprod-complete.sh
```

### PowerShell Script (Windows)
```powershell
# Complete migration
.\migrate-dev-to-preprod-complete.ps1

# With options
.\migrate-dev-to-preprod-complete.ps1 -SkipTerraform -DryRun
```

## Script Options (PowerShell)

| Option | Description |
|--------|-------------|
| `-SkipTerraform` | Skip Terraform infrastructure deployment |
| `-SkipFrontend` | Skip frontend configuration and deployment |
| `-SkipCleanup` | Skip cleanup of temporary files |
| `-SkipDocumentation` | Skip documentation updates |
| `-DryRun` | Plan only, don't apply changes |

## Migration Steps

### 1. Preparation and Cleanup
- Removes temporary and backup files
- Cleans up test files
- Removes duplicate files
- Organizes documentation

### 2. Frontend Configuration
- Backs up current dev configuration
- Creates preprod configuration
- Tests preprod build
- Restores dev configuration

### 3. Terraform Infrastructure Deployment
- Switches to preprod workspace
- Initializes Terraform
- Plans infrastructure deployment
- Applies infrastructure changes
- Saves outputs for later use

### 4. Frontend Deployment to AWS
- Builds frontend for preprod
- Deploys to S3 bucket
- Creates CloudFront invalidation
- Restores dev configuration

### 5. Documentation Updates
- Updates main README
- Updates environment documentation
- Updates deployment documentation
- Organizes documentation structure

### 6. HTML Diagram Updates
- Updates workflow diagrams
- Updates environment diagrams
- Updates quick reference diagrams
- Reflects current deployment status

### 7. Verification and Testing
- Verifies Terraform deployment
- Verifies S3 deployment
- Verifies Lambda functions
- Verifies API Gateways

### 8. Git Commit and Push
- Adds all changes to git
- Commits with comprehensive message
- Pushes to remote repository

### 9. Final Summary
- Provides migration summary
- Shows environment status
- Lists next steps
- Provides useful commands

## Prerequisites

### Required Tools
- **AWS CLI**: Configured with appropriate permissions
- **Terraform**: Installed and configured
- **Node.js**: For frontend builds
- **Git**: For version control
- **jq**: For JSON processing (bash script)

### Required Permissions
- **AWS IAM**: Full access to Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito
- **Terraform**: Backend access for state management
- **Git**: Push access to repository

### Required Files
- `terraform/preprod.tfvars`: Preprod Terraform variables
- `update-frontend-to-preprod.sh`: Frontend configuration script
- `package.json`: Node.js dependencies

## Environment Configuration

### Preprod Environment Variables
```bash
# Application Configuration
VITE_APP_URL=https://d19a5c2wn4mtdt.cloudfront.net
VITE_DEMO_MODE=false
VITE_DEBUG_MODE=false
VITE_HEDERA_NETWORK=testnet

# AWS Cognito Configuration
VITE_COGNITO_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_pMo5BXFiM
VITE_COGNITO_CLIENT_ID=1a0trpjfgv54odl9csqlcbkuii
VITE_COGNITO_DOMAIN=preprod-safemate-auth-wmacwrsy

# API Endpoints
VITE_ONBOARDING_API_URL=https://ol212feqdl.execute-api.ap-southeast-2.amazonaws.com/preprod
VITE_VAULT_API_URL=https://fg85dzr0ag.execute-api.ap-southeast-2.amazonaws.com/preprod
VITE_WALLET_API_URL=https://9t9hk461kh.execute-api.ap-southeast-2.amazonaws.com/preprod
VITE_HEDERA_API_URL=https://2kwe2ly8vh.execute-api.ap-southeast-2.amazonaws.com/preprod
VITE_GROUP_API_URL=https://3r08ehzgk1.execute-api.ap-southeast-2.amazonaws.com/preprod

# Lambda Function Names
VITE_USER_ONBOARDING_FUNCTION=preprod-safemate-user-onboarding
VITE_POST_CONFIRMATION_WALLET_CREATOR=preprod-safemate-post-confirmation-wallet-creator
VITE_GROUP_MANAGER_FUNCTION=preprod-safemate-group-manager
VITE_TOKEN_VAULT_FUNCTION=preprod-safemate-token-vault
VITE_WALLET_MANAGER_FUNCTION=preprod-safemate-wallet-manager
VITE_HEDERA_SERVICE_FUNCTION=preprod-safemate-hedera-service
VITE_DIRECTORY_CREATOR_FUNCTION=preprod-safemate-directory-creator
```

## Output Files

### Generated Files
- `preprod-outputs.json`: Terraform outputs in JSON format
- `terraform-outputs.txt`: Terraform outputs in text format
- `.env.preprod`: Preprod environment configuration
- `.env.dev.backup`: Backup of dev configuration

### Updated Files
- `README.md`: Updated with preprod status
- `docs/environments/README.md`: Updated environment status
- `docs/deployment/DEPLOYMENT.md`: Updated deployment status
- `docs/architecture/SAFEMATE_WORKFLOW_DIAGRAMS.html`: Updated diagrams
- `docs/environments/diagrams/environment-architecture.html`: Updated diagrams
- `docs/environments/diagrams/quick-reference.html`: Updated diagrams

## Troubleshooting

### Common Issues

#### Terraform Workspace Issues
```bash
# Check current workspace
terraform workspace show

# List available workspaces
terraform workspace list

# Create preprod workspace if missing
terraform workspace new preprod
```

#### AWS Permission Issues
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check specific permissions
aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::ACCOUNT:user/USER --action-names lambda:CreateFunction
```

#### Frontend Build Issues
```bash
# Check Node.js version
node --version

# Install dependencies
npm install

# Clear cache and rebuild
npm run build -- --force
```

#### S3 Deployment Issues
```bash
# Check S3 bucket exists
aws s3 ls s3://preprod-safemate-static-hosting

# Check bucket permissions
aws s3api get-bucket-policy --bucket preprod-safemate-static-hosting
```

### Recovery Procedures

#### Rollback to Dev
```bash
# Switch back to dev environment
./switch-to-dev.sh

# Or manually restore dev configuration
cd apps/web/safemate
cp .env.dev.backup .env
```

#### Re-run Failed Steps
```powershell
# Re-run specific steps
.\migrate-dev-to-preprod-complete.ps1 -SkipTerraform -SkipFrontend
```

## Monitoring and Maintenance

### Post-Migration Checks
1. **Test Preprod Environment**: Visit https://d19a5c2wn4mtdt.cloudfront.net
2. **Verify Authentication**: Test user registration and login
3. **Test Wallet Creation**: Verify Hedera wallet creation works
4. **Monitor AWS Costs**: Check free tier compliance
5. **Review Logs**: Check CloudWatch logs for errors

### Regular Maintenance
- **Weekly**: Check AWS costs and free tier usage
- **Monthly**: Update documentation and diagrams
- **Quarterly**: Review and clean up old resources

## Security Considerations

### AWS Security
- **IAM Roles**: Use least privilege principle
- **KMS Keys**: Ensure proper key rotation
- **VPC**: Consider VPC endpoints for private access
- **CloudTrail**: Enable logging for audit trails

### Application Security
- **HTTPS**: All traffic encrypted in transit
- **CORS**: Properly configured for preprod domain
- **Authentication**: Cognito integration for user management
- **Authorization**: API Gateway authorizers for API access

## Cost Optimization

### Free Tier Compliance
- **Lambda**: 1M requests/month, 400,000 GB-seconds
- **API Gateway**: 1M API calls/month
- **DynamoDB**: 25 GB storage, 25 RCU/WCU
- **S3**: 5 GB storage, 20,000 GET requests
- **CloudFront**: 1 TB data transfer, 10M requests

### Monitoring Tools
- **AWS Cost Explorer**: Track spending
- **CloudWatch**: Monitor usage and performance
- **Free Tier Dashboard**: Check free tier usage
- **Billing Alerts**: Set up cost alerts

## Support and Documentation

### Additional Resources
- [AWS Free Tier Guide](docs/aws/free-tier-guardrails.md)
- [Deployment Guide](docs/deployment/DEPLOYMENT.md)
- [Environment Management](docs/development/ENVIRONMENT_MANAGEMENT_GUIDE.md)
- [Troubleshooting Guide](docs/troubleshooting/)

### Getting Help
- Check logs in CloudWatch
- Review Terraform state
- Verify AWS resource status
- Check documentation for common issues

---

**Last Updated**: 2025-09-06  
**Version**: 3.0.0  
**Author**: SafeMate Development Team
