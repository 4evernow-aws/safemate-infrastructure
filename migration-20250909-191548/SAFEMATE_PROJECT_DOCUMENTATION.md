# SafeMate Project Documentation

## 📋 Project Overview

SafeMate is a secure file management and sharing platform powered by Hedera blockchain technology. The platform provides enterprise-grade security for digital asset storage, sharing, and monetization with a focus on AWS Free Tier compliance.

## 🎯 Key Objectives

- **Secure File Management**: Store and share files with blockchain-level security
- **Real Blockchain Integration**: Live Hedera testnet wallet creation and management
- **Free Tier Compliance**: Optimized for AWS Free Tier usage limits
- **Team Collaboration**: Group-based file sharing and management
- **Reward System**: MATE token rewards for platform engagement

## 🏗️ Architecture Overview

### Frontend (React Application)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: Material-UI for modern, responsive design
- **Authentication**: AWS Amplify with Cognito integration
- **Development Server**: http://localhost:5173

### Backend (Serverless Microservices)
- **Compute**: AWS Lambda functions
- **API**: API Gateway with RESTful endpoints
- **Database**: DynamoDB for user data and metadata
- **Encryption**: AWS KMS for secure key management
- **Authentication**: AWS Cognito for user management

### Blockchain Integration
- **Network**: Hedera Testnet for live blockchain operations
- **SDK**: Official Hedera SDK for blockchain transactions
- **Features**: Real wallet creation, file storage, token operations

## 🔧 Environment Configuration

### Development Environment
- **User Pool**: `dev-safemate-user-pool-v2`
- **User Pool ID**: `ap-southeast-2_2fMWFFs8i`
- **Client ID**: `68d7oqbrbh3pneab0dc0if0nf3`
- **API Endpoints**:
  - Onboarding: `https://kbfs45jmnk.execute-api.ap-southeast-2.amazonaws.com/dev`
  - Vault: `https://73r0aby0k4.execute-api.ap-southeast-2.amazonaws.com/dev`
  - Wallet: `https://8k2qwmk56d.execute-api.ap-southeast-2.amazonaws.com/dev`
  - Hedera: `https://vevhttzt1d.execute-api.ap-southeast-2.amazonaws.com/dev`
  - Group: `https://f0v9l8afc0.execute-api.ap-southeast-2.amazonaws.com/dev`

### Pre-Production Environment
- **User Pool**: `preprod-safemate-user-pool-v2`
- **User Pool ID**: `ap-southeast-2_pMo5BXFiM`
- **API Stage**: `/preprod`
- **App URL**: CloudFront distribution

## 🚀 Services Architecture

### Core Services

#### 1. User Onboarding Service
- **Purpose**: User registration and initial setup
- **Features**:
  - Cognito user creation
  - Hedera wallet generation
  - Profile initialization
  - Email verification (direct Cognito)

#### 2. Token Vault Service
- **Purpose**: Secure storage of user secrets and tokens
- **Features**:
  - KMS-encrypted storage
  - Private key management
  - Token balance tracking
  - Secure key retrieval

#### 3. Wallet Manager Service
- **Purpose**: Wallet operations and balance management
- **Features**:
  - Balance queries
  - Token transfers
  - Transaction history
  - Wallet metadata

#### 4. Hedera Service
- **Purpose**: Blockchain operations and transactions
- **Features**:
  - Wallet creation and management
  - File storage on Hedera File Service
  - Token operations
  - Transaction processing

### Collaboration Services

#### 5. Group Manager Service
- **Purpose**: Team collaboration features
- **Features**:
  - Group creation and management
  - Member invitations
  - Shared wallet access
  - Activity tracking

#### 6. Directory Creator Service
- **Purpose**: File organization and structure
- **Features**:
  - Directory creation
  - File metadata management
  - Folder hierarchy
  - Access permissions

### Authentication Services

#### 7. Post-Confirmation Wallet Creator
- **Purpose**: Cognito trigger for automatic wallet creation
- **Features**:
  - Automatic wallet creation on user confirmation
  - KMS key generation
  - Initial wallet setup

## 🔐 Security Features

### Authentication & Authorization
- **AWS Cognito**: User authentication and authorization
- **Direct Email Verification**: Free Tier compliant email verification
- **JWT Tokens**: Secure session management
- **CORS Configuration**: Proper cross-origin request handling

### Data Protection
- **End-to-End Encryption**: All sensitive data encrypted with KMS
- **Private Key Protection**: User private keys never stored in plain text
- **Secure Storage**: DynamoDB with encryption at rest
- **Audit Logging**: Comprehensive activity tracking

### Blockchain Security
- **Real Wallet Creation**: Actual Hedera accounts for users
- **Secure Key Management**: Private keys encrypted and stored securely
- **Transaction Validation**: All blockchain operations validated
- **Network Security**: Hedera testnet for secure testing

## 💰 Free Tier Compliance

### AWS Services Used
- **Lambda**: 1M free requests/month
- **DynamoDB**: 25GB free storage
- **API Gateway**: 1M free API calls
- **Cognito**: 50K free MAUs
- **S3**: 5GB free storage
- **CloudFront**: 1TB free data transfer
- **KMS**: 20K free requests/month

### Optimizations Made
- **No Application Load Balancer**: Using S3 Static Website Hosting
- **No AWS Secrets Manager**: Using KMS + DynamoDB
- **Direct Cognito Email**: No custom Lambda functions for email
- **Minimal Lambda Memory**: Optimized resource allocation
- **Efficient API Design**: Minimal API calls and data transfer

## 📁 File Structure

```
migration-20250909-191548/
├── safemate-frontend/          # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/          # API service layers
│   │   ├── contexts/          # React contexts
│   │   ├── dashboard/         # Modular dashboard system
│   │   └── widgets/           # Dashboard widgets
│   ├── .env.development       # Development environment config
│   ├── .env.preprod          # Pre-production environment config
│   └── README.md
├── safemate-backend/          # Lambda microservices
│   ├── user-onboarding/       # User registration service
│   ├── token-vault/          # Secret management service
│   ├── wallet-manager/       # Wallet operations service
│   ├── hedera-service/       # Blockchain operations service
│   ├── group-manager/        # Team collaboration service
│   ├── directory-creator/    # File organization service
│   └── post-confirmation-wallet-creator/ # Cognito trigger
├── safemate-infrastructure/   # Terraform infrastructure
│   ├── terraform/            # Infrastructure as Code
│   └── services/             # Lambda deployment packages
└── safemate-shared/          # Shared utilities and types
    ├── packages/             # Shared packages
    └── lambda-layers/        # Lambda layers
```

## 🚀 Development Workflow

### Local Development
```bash
# Frontend development
cd safemate-frontend
npm install
npm run dev

# Backend development
cd safemate-backend
npm install
npm run build
```

### Environment Management
- **Development**: `npm run dev` (uses `.env.development`)
- **Pre-Production**: `npm run dev:preprod` (uses `.env.preprod`)
- **Production**: `npm run dev:production` (uses `.env.production`)

### Deployment
- **Automatic**: GitHub Actions for each branch
- **Manual**: Terraform for infrastructure updates
- **Lambda**: Individual service deployment

## 📊 Monitoring & Logging

### CloudWatch Integration
- **Lambda Logs**: Comprehensive function logging
- **API Gateway Logs**: Request/response tracking
- **DynamoDB Metrics**: Database performance monitoring
- **Cognito Logs**: Authentication event tracking

### Error Handling
- **Frontend**: React Error Boundaries
- **Backend**: Lambda error handling and logging
- **API**: Proper HTTP status codes and error messages
- **Blockchain**: Transaction failure handling

## 🔄 Recent Updates (2025-09-12)

### Email Verification Fix
- **Removed**: Custom email verification Lambda function
- **Implemented**: Direct Cognito email verification
- **Benefit**: Free Tier compliance and improved reliability

### Environment Configuration
- **Updated**: All API URLs to match Terraform outputs
- **Fixed**: Environment file loading for correct configuration
- **Added**: Comprehensive environment management documentation

### Free Tier Optimization
- **Removed**: AWS Secrets Manager usage
- **Optimized**: Lambda memory allocation
- **Implemented**: S3 Static Website Hosting
- **Added**: KMS + DynamoDB for secure storage

## 🎯 Future Roadmap

### Short Term
- [ ] Complete group collaboration features
- [ ] Implement file sharing permissions
- [ ] Add advanced dashboard widgets
- [ ] Optimize blockchain transaction handling

### Medium Term
- [ ] Production environment setup
- [ ] Advanced analytics and reporting
- [ ] Mobile application development
- [ ] API rate limiting and optimization

### Long Term
- [ ] Multi-blockchain support
- [ ] Enterprise features
- [ ] Advanced security features
- [ ] Global deployment

## 📞 Support & Contact

For technical support or questions about the SafeMate platform:
- **Documentation**: See individual service README files
- **Architecture**: View `SAFEMATE_ARCHITECTURE.html` diagram
- **Environment**: Check `ENVIRONMENT_MANAGEMENT.md` guide

---

**Last Updated**: 2025-09-12  
**Version**: 2.0.0  
**Status**: Development (Free Tier Compliant)
