# SafeMate v2 - ARCHIVED

⚠️ **This repository has been archived and split into separate repositories.**

## 🚀 New Repository Structure

This monolithic repository has been split into separate, independent repositories for better development workflows and maintainability:

### 📁 New Repositories:
- **Frontend**: [safemate-frontend](https://github.com/4evernow-aws/safemate-frontend)
  - React/Vite frontend application
  - User interface and components
  - Environment configurations

- **Backend**: [safemate-backend](https://github.com/4evernow-aws/safemate-backend)
  - AWS Lambda functions
  - API services and business logic
  - User onboarding and wallet management

- **Infrastructure**: [safemate-infrastructure](https://github.com/4evernow-aws/safemate-infrastructure)
  - Terraform configurations
  - AWS resource management
  - Infrastructure as Code

- **Shared**: [safemate-shared](https://github.com/4evernow-aws/safemate-shared)
  - Common utilities and types
  - Lambda layers
  - Shared packages

## 📅 Migration Details

- **Migration Date**: September 12, 2025
- **Migration Reason**: Better separation of concerns and independent development workflows
- **Last Active Commit**: `90b5bd25` - "Fix email verification for both new and existing users"

## 🔧 Key Improvements

### ✅ What Was Fixed:
- **Email Verification**: Now working for both new and existing users
- **User Pool Configuration**: Fixed Cognito write permissions
- **Repository Structure**: Separated into independent repositories
- **Free Tier Compliance**: Optimized AWS resources
- **Code Cleanup**: Removed 100+ temporary files and scripts

### 🎯 Benefits of New Structure:
- **Independent Development**: Each team can work on their repository
- **Faster CI/CD**: Separate pipelines for each component
- **Better Maintainability**: Clear separation of concerns
- **Easier Testing**: Isolated testing environments
- **Scalable Architecture**: Each service can scale independently

## 🚀 Getting Started

### For Frontend Development:
```bash
git clone https://github.com/4evernow-aws/safemate-frontend.git
cd safemate-frontend
npm install
npm run dev
```

### For Backend Development:
```bash
git clone https://github.com/4evernow-aws/safemate-backend.git
cd safemate-backend
npm install
# Deploy Lambda functions
```

### For Infrastructure Management:
```bash
git clone https://github.com/4evernow-aws/safemate-infrastructure.git
cd safemate-infrastructure
terraform init
terraform plan
```

## 📊 Current Status

### ✅ Working Features:
- **Email Verification**: Fully functional for both user types
- **User Authentication**: Cognito integration working
- **Hedera Integration**: Testnet wallet functionality
- **File Management**: Upload and storage working
- **Group Management**: Multi-user functionality

### 🔧 Technical Stack:
- **Frontend**: React, TypeScript, Vite
- **Backend**: AWS Lambda, Node.js
- **Infrastructure**: Terraform, AWS
- **Database**: DynamoDB
- **Authentication**: AWS Cognito
- **Blockchain**: Hedera Hashgraph Testnet

## 📞 Support

For issues or questions:
1. Check the specific repository's README
2. Review the documentation in each repository
3. Create issues in the appropriate repository

## 📚 Documentation

- **Architecture**: See individual repository documentation
- **Deployment**: Check infrastructure repository
- **API**: See backend repository
- **UI Components**: See frontend repository

---

**Note**: This repository is maintained for historical reference only. All active development has moved to the new separate repositories listed above.
