# SafeMate - Secure Decentralized File Storage

SafeMate is a secure, decentralized file storage platform built on the Hedera network. It provides enterprise-grade security with blockchain-based file integrity and access control.

## 🌟 Key Features

- **Decentralized Storage**: Files stored on Hedera File Service with blockchain immutability
- **Multi-Environment Support**: Separate dev, test, and production environments
- **Real & Demo Modes**: Switch between live Hedera testnet and demo mode
- **Secure Authentication**: AWS Cognito integration with encrypted credential storage
- **Token Integration**: $MATE token for platform utilities and rewards
- **Modern UI**: React + Material-UI interface with responsive design

## 🏗️ Multi-Environment Architecture

### Environment Strategy
SafeMate supports multiple isolated environments using Terraform workspaces:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │      Test       │    │   Production    │
│   dev-alice     │    │      test       │    │      prod       │
│   dev-bob       │    │                 │    │                 │
│   dev-feature   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Environment Benefits
- **Isolation**: Each environment has separate AWS resources
- **Safety**: Test changes without affecting production
- **Scalability**: Multiple developers can work independently
- **Cost Control**: Environment-specific configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Terraform 1.0+
- Hedera testnet account (for real mode)

### 1. Clone and Install
```bash
git clone <repository-url>
cd safemate_v2
cd safemate
npm install
```

### 2. Configure Environment
Create a `.env` file in the `safemate/` directory:

```bash
# Environment Mode
VITE_DEMO_MODE=false                    # Always false - using live Hedera testnet

# Hedera Network Configuration
VITE_HEDERA_NETWORK=testnet

# AWS Configuration (from Terraform outputs)
# Development Pool
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_uLgMRpWlw
VITE_COGNITO_CLIENT_ID=2fg1ckjn1hga2t07lnujpk488a

# Pre-Production Pool (for https://d19a5c2wn4mtdt.cloudfront.net/)
# VITE_COGNITO_USER_POOL_ID=ap-southeast-2_pMo5BXFiM
# VITE_COGNITO_CLIENT_ID=1a0trpjfgv54odl9csqlcbkuii
# Development API Endpoints
VITE_VAULT_API_URL=https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default
VITE_HEDERA_API_URL=https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/default

# Pre-Production API Endpoints (for https://d19a5c2wn4mtdt.cloudfront.net/)
# VITE_VAULT_API_URL=https://[PREPROD_ID].execute-api.ap-southeast-2.amazonaws.com/preprod
# VITE_HEDERA_API_URL=https://[PREPROD_HEDERA_ID].execute-api.ap-southeast-2.amazonaws.com/preprod

# Optional: Debug settings
VITE_DEBUG_MODE=true
```

### 3. Deploy Infrastructure (Multi-Environment)

#### For Development Environment
```bash
cd terraform/
terraform workspace new dev-yourname
terraform workspace select dev-yourname
terraform apply
```

#### For Test Environment
```bash
terraform workspace new test
terraform workspace select test
terraform apply
```

#### For Production Environment
```bash
terraform workspace new prod
terraform workspace select prod
terraform apply
```

### 4. Start Development Server
```bash
cd safemate/
npm run dev
```

## 🔧 Live Hedera Testnet Integration

### Production Mode (Live Hedera Testnet)
- **Purpose**: Full blockchain integration with live Hedera testnet
- **Data**: Actual files stored on Hedera File Service
- **Setup**: Operator credentials configured in Lambda database
- **Benefits**: Real blockchain transactions, true decentralization
- **Network**: Direct connection to Hedera testnet (no mirror sites)

## 🏭 Infrastructure Components

### AWS Resources (per environment)
- **ECS Cluster**: Container orchestration
- **Cognito User Pool**: Authentication
- **Lambda Functions**: Backend services
- **DynamoDB Tables**: Metadata storage
- **S3 Buckets**: Static assets
- **CloudFront**: CDN and distribution
- **API Gateway**: REST API endpoints

### Hedera Integration
- **File Service**: Decentralized file storage on live testnet
- **Direct Network Access**: Real-time account and transaction queries
- **Consensus Service**: Transaction validation on live testnet
- **Token Service**: $MATE token operations on live testnet

## 🔐 Security Features

### Authentication
- AWS Cognito for user management
- JWT tokens for API authentication
- Multi-factor authentication support

### Data Protection
- KMS encryption for sensitive data
- Private keys encrypted at rest
- Secure credential storage in Lambda

### Network Security
- VPC isolation
- Security groups and NACLs
- HTTPS/TLS encryption

## 📊 User Flow

### First Time Setup
1. User creates account via Cognito
2. User provides Hedera account credentials
3. Credentials encrypted and stored in Token Vault
4. Hedera connection validated
5. User can upload files and manage storage

### Daily Usage
1. User logs in to SafeMate portal
2. Dashboard shows account status and file stats
3. User can upload, download, and manage files
4. All operations recorded on Hedera blockchain

## 🛠️ Development

### Environment Setup
```bash
# Create personal dev environment
terraform workspace new dev-yourname
terraform apply

# Get infrastructure outputs
terraform output
```

### Frontend Development
```bash
cd safemate/
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
```

### Backend Services
Located in `services/` directory:
- `hedera-service/`: Hedera blockchain operations
- `token-vault/`: Secure credential management
- `wallet-manager/`: Wallet creation and management
- `group-manager/`: Group and sharing features

## 📈 Monitoring

### Application Metrics
- User authentication rates
- File upload/download volumes
- Hedera transaction success rates
- API response times

### Infrastructure Metrics
- ECS task health
- Lambda function performance
- Database query performance
- Storage utilization

## 🔧 Configuration

### Environment Variables
```bash
# Frontend Configuration
VITE_DEMO_MODE=false
VITE_HEDERA_NETWORK=testnet
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_VAULT_API_URL=

# Backend Configuration (via Terraform)
HEDERA_NETWORK=testnet
WALLET_KMS_KEY_ID=
DYNAMODB_TABLE_PREFIX=
```

### Terraform Variables
```hcl
# terraform.tfvars
app_name = "safemate"
environment = "dev-yourname"
aws_region = "ap-southeast-2"
```

## 🚦 Deployment

### Development Deployment
```bash
# Frontend
npm run build
aws s3 sync dist/ s3://dev-yourname-safemate-frontend/

# Backend (via Terraform)
terraform workspace select dev-yourname
terraform apply
```

### Production Deployment
```bash
# Switch to production workspace
terraform workspace select prod
terraform apply -var="image_tag=prod-v1.0.0"
```

## 🤝 Contributing

1. Create feature branch from `main`
2. Set up personal dev environment
3. Develop and test changes
4. Deploy to test environment for QA
5. Submit PR for review

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the troubleshooting guide
- Review environment configuration
- Contact the development team

---

Built with ❤️ using React, Material-UI, Hedera, and AWS
