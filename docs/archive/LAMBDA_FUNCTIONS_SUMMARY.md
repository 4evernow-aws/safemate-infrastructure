# Lambda Functions Summary - SafeMate

## 🎯 **Overview**

This document lists all Lambda functions that are defined in the Terraform configuration and will be deployed with environment-specific prefixes.

## 🏗️ **Lambda Functions by Environment**

### **Development Environment (dev- prefix)**
- **dev-safemate-hedera-service** - Comprehensive blockchain operations
- **dev-safemate-user-onboarding** - User registration and onboarding
- **dev-safemate-token-vault** - Token management and vault operations
- **dev-safemate-wallet-manager** - Wallet management operations
- **dev-safemate-group-manager** - Group and team management
- **dev-safemate-directory-creator** - Directory and folder creation
- **dev-safemate-post-confirmation-wallet-creator** - Auto wallet creation after user confirmation

### **Pre-Production Environment (preprod- prefix)**
- **preprod-safemate-hedera-service** - Comprehensive blockchain operations
- **preprod-safemate-user-onboarding** - User registration and onboarding
- **preprod-safemate-token-vault** - Token management and vault operations
- **preprod-safemate-wallet-manager** - Wallet management operations
- **preprod-safemate-group-manager** - Group and team management
- **preprod-safemate-directory-creator** - Directory and folder creation
- **preprod-safemate-post-confirmation-wallet-creator** - Auto wallet creation after user confirmation

## 📋 **Function Details**

### **1. Hedera Service**
- **Purpose**: Comprehensive blockchain operations
- **Runtime**: Node.js 18.x
- **Timeout**: 90 seconds
- **Layers**: Hedera dependencies layer
- **Environment Variables**: All DynamoDB tables, KMS keys, Cognito pool

### **2. User Onboarding**
- **Purpose**: User registration and onboarding
- **Runtime**: Node.js 18.x
- **Timeout**: 30 seconds
- **Environment Variables**: User secrets table, KMS keys

### **3. Token Vault**
- **Purpose**: Token management and vault operations
- **Runtime**: Node.js 18.x
- **Timeout**: 30 seconds
- **Environment Variables**: Wallet tables, KMS keys

### **4. Wallet Manager**
- **Purpose**: Wallet management operations
- **Runtime**: Node.js 18.x
- **Timeout**: 30 seconds
- **Environment Variables**: Wallet tables, KMS keys

### **5. Group Manager**
- **Purpose**: Group and team management
- **Runtime**: Node.js 18.x
- **Timeout**: 30 seconds
- **Environment Variables**: Group tables, KMS keys

### **6. Directory Creator**
- **Purpose**: Directory and folder creation
- **Runtime**: Node.js 18.x
- **Timeout**: 30 seconds
- **Environment Variables**: Folder tables, KMS keys

### **7. Post Confirmation Wallet Creator**
- **Purpose**: Auto wallet creation after user confirmation
- **Runtime**: Node.js 18.x
- **Timeout**: 30 seconds
- **Environment Variables**: User onboarding function name
- **Trigger**: Cognito Post Confirmation

## 🔧 **Deployment Configuration**

### **Terraform Configuration**
All Lambda functions use `${local.name_prefix}` for naming, which automatically resolves to:
- **Development**: `dev-`
- **Pre-Production**: `preprod-`

### **Environment Variables**
Each function gets environment-specific variables including:
- DynamoDB table names with environment prefix
- KMS key IDs
- Cognito user pool ID
- Hedera network configuration

### **IAM Roles**
Each function has its own IAM role with specific permissions:
- DynamoDB access to environment-specific tables
- KMS access for encryption/decryption
- CloudWatch Logs access
- Cognito access (where needed)

## 🚀 **Deployment Process**

### **Development Environment**
```bash
terraform workspace select default
terraform apply -var-file="dev.tfvars"
```

### **Pre-Production Environment**
```bash
terraform workspace select preprod
terraform apply -var-file="preprod.tfvars"
```

## 📊 **Current Status**

- ✅ **Development Environment**: Ready for deployment with `dev-` prefix
- ✅ **Pre-Production Environment**: Ready for deployment with `preprod-` prefix
- ✅ **Configuration**: All functions use environment-specific naming
- ✅ **Documentation**: Updated to reflect correct function names

## 🎯 **Next Steps**

1. **Deploy Development Environment**: Create `dev-` prefixed functions
2. **Deploy Pre-Production Environment**: Create `preprod-` prefixed functions
3. **Test Functions**: Verify all functions work correctly in both environments
4. **Update API Gateway**: Ensure API Gateway routes point to correct functions
5. **Monitor Performance**: Set up CloudWatch monitoring for both environments
