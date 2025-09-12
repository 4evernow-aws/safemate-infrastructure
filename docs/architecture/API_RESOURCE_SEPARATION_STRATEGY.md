# API Resource Separation Strategy

## 🎯 **Overview**

This document outlines the strategy for separating API resources between development and pre-production environments in SafeMate.

## 🏗️ **Resource Naming Convention**

### **Development Environment**
- **Prefix**: `dev-`
- **Purpose**: Local development and testing
- **URL**: `http://localhost:5173`
- **Cognito Pool**: `ap-southeast-2_uLgMRpWlw`

### **Pre-Production Environment**
- **Prefix**: `preprod-`
- **Purpose**: Pre-production testing and staging
- **URL**: `https://d19a5c2wn4mtdt.cloudfront.net`
- **Cognito Pool**: `ap-southeast-2_pMo5BXFiM`

## 📋 **API Resources Mapping**

### **Lambda Functions**

| Service | Development | Pre-Production |
|---------|-------------|----------------|
| **User Onboarding** | `dev-safemate-user-onboarding` | `preprod-safemate-user-onboarding` |
| **Token Vault** | `dev-safemate-token-vault` | `preprod-safemate-token-vault` |
| **Wallet Manager** | `dev-safemate-wallet-manager` | `preprod-safemate-wallet-manager` |
| **Hedera Service** | `dev-safemate-hedera-service` | `preprod-safemate-hedera-service` |
| **Group Manager** | `dev-safemate-group-manager` | `preprod-safemate-group-manager` |
| **Directory Creator** | `dev-safemate-directory-creator` | `preprod-safemate-directory-creator` |
| **Post Confirmation** | `dev-safemate-post-confirmation-wallet-creator` | `preprod-safemate-post-confirmation-wallet-creator` |

### **API Gateways**

| Service | Development | Pre-Production |
|---------|-------------|----------------|
| **User Onboarding & Wallet API** | `https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev` | `https://[NEW_ID].execute-api.ap-southeast-2.amazonaws.com/preprod` |
| **Hedera Service API** | `https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/dev` | `https://[NEW_ID].execute-api.ap-southeast-2.amazonaws.com/preprod` |
| **Token Vault API** | `https://qy3i7ekh08.execute-api.ap-southeast-2.amazonaws.com/dev` | `https://[NEW_ID].execute-api.ap-southeast-2.amazonaws.com/preprod` |
| **Group Manager API** | `https://kmth2kr4hb.execute-api.ap-southeast-2.amazonaws.com/dev` | `https://[NEW_ID].execute-api.ap-southeast-2.amazonaws.com/preprod` |

### **DynamoDB Tables**

| Service | Development | Pre-Production |
|---------|-------------|----------------|
| **Wallet Keys** | `dev-safemate-wallet-keys` | `preprod-safemate-wallet-keys` |
| **Wallet Metadata** | `dev-safemate-wallet-metadata` | `preprod-safemate-wallet-metadata` |
| **User Secrets** | `dev-safemate-user-secrets` | `preprod-safemate-user-secrets` |
| **Groups** | `dev-safemate-groups` | `preprod-safemate-groups` |
| **Files** | `dev-safemate-files` | `preprod-safemate-files` |
| **Folders** | `dev-safemate-folders` | `preprod-safemate-folders` |

## 🔧 **Implementation Steps**

### **Step 1: Deploy Pre-Production Resources**
```powershell
# Run the deployment script
.\deploy-preprod-api-resources.ps1
```

### **Step 2: Update Frontend Configuration**
Update `apps/web/safemate/.env.preprod` with new API endpoints:
```env
# Pre-Production API Endpoints
VITE_API_BASE_URL=https://[NEW_PREPROD_API_ID].execute-api.ap-southeast-2.amazonaws.com/preprod
VITE_HEDERA_API_URL=https://[NEW_PREPROD_HEDERA_API_ID].execute-api.ap-southeast-2.amazonaws.com/preprod
```

### **Step 3: Update Environment Variables**
Update `config/env-vars.json` to include preprod API configurations:
```json
{
  "environments": {
    "development": {
      "API_BASE_URL": "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev",
      "HEDERA_API_URL": "https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/dev"
    },
    "preprod": {
      "API_BASE_URL": "https://[NEW_PREPROD_API_ID].execute-api.ap-southeast-2.amazonaws.com/preprod",
      "HEDERA_API_URL": "https://[NEW_PREPROD_HEDERA_API_ID].execute-api.ap-southeast-2.amazonaws.com/preprod"
    }
  }
}
```

## ✅ **Benefits of Resource Separation**

1. **Environment Isolation**: Changes in dev don't affect preprod
2. **Independent Scaling**: Each environment can scale independently
3. **Security**: Separate IAM roles and permissions
4. **Testing**: Can test new features safely in preprod
5. **Cost Tracking**: Separate billing and monitoring
6. **Data Isolation**: Separate databases prevent data mixing

## 🚨 **Important Considerations**

1. **Cost Impact**: Separate resources will increase AWS costs
2. **Maintenance**: Need to maintain two sets of resources
3. **Deployment**: Need separate deployment processes for each environment
4. **Monitoring**: Need separate monitoring and alerting

## 📊 **Current Status**

- ✅ **Development Resources**: Deployed and active
- ✅ **Pre-Production Cognito**: Deployed and active
- 🔄 **Pre-Production API Resources**: Ready for deployment
- 🔄 **Frontend Configuration**: Needs updating after API deployment

## 🎯 **Next Steps**

1. **Deploy pre-production API resources** using `deploy-preprod-api-resources.ps1`
2. **Update frontend environment variables** with new preprod API endpoints
3. **Test pre-production API endpoints** to ensure they work correctly
4. **Update documentation** with new preprod resource names
5. **Set up monitoring** for pre-production resources
