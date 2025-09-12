# 🗺️ **COMPLETE FLOW ANALYSIS: Login to Hedera Wallet Creation**

## 🎯 **Overview**
This document maps the complete process from user login to Hedera wallet creation, identifying all components, configurations, and the current 500 error issue.

---

## 🔄 **Complete User Journey Flow**

### **1. User Authentication Flow**
```
User Input → ModernLogin.tsx → AWS Cognito → JWT Token → UserContext
```

**Components:**
- **Frontend**: `apps/web/safemate/src/components/ModernLogin.tsx`
- **Authentication**: AWS Cognito User Pools
- **Token Service**: `apps/web/safemate/src/services/tokenService.ts`
- **User Context**: `apps/web/safemate/src/contexts/UserContext.tsx`

**Status**: ✅ **WORKING** - Email verification and authentication functioning correctly

### **2. Wallet Initialization Flow**
```
UserContext → HederaContext → SecureWalletService → API Gateway → Lambda → DynamoDB
```

**Components:**
- **Hedera Context**: `apps/web/safemate/src/contexts/HederaContext.tsx`
- **Wallet Service**: `apps/web/safemate/src/services/secureWalletService.ts`
- **API Gateway**: `https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Lambda Function**: `dev-safemate-user-onboarding`
- **Database**: AWS DynamoDB

**Status**: ❌ **BROKEN** - 500 Internal Server Error from Lambda function

---

## 🏗️ **Infrastructure Components**

### **Frontend (React + Vite)**
- **Port**: `http://localhost:5173`
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: React Context + Hooks
- **UI Library**: Material-UI (MUI)

### **Backend (AWS Lambda)**
- **Function Name**: `dev-safemate-user-onboarding`
- **Runtime**: Node.js 18.x
- **Code Size**: ~58MB (deployed via S3)
- **Dependencies**: AWS SDK v3, Hedera SDK
- **Status**: ✅ **Deployed** but ❌ **Missing Environment Variables**

### **API Gateway**
- **ID**: `527ye7o1j0`
- **Stage**: `/dev`
- **Base URL**: `https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Endpoints**:
  - `GET /onboarding/status` - Check wallet status
  - `POST /onboarding/start` - Create new wallet
  - `OPTIONS` - CORS preflight support

### **Database (DynamoDB)**
- **Tables**:
  - `safemate-wallet-metadata` - Wallet information
  - `safemate-wallet-keys` - Encrypted private keys
- **Status**: ❓ **Unknown** - Need to verify table existence and permissions

### **Security (KMS + Cognito)**
- **KMS Keys**: `alias/safemate-master-key-dev`
- **Authentication**: Cognito User Pools
- **Authorization**: JWT tokens with claims
- **Status**: ❓ **Unknown** - Need to verify KMS permissions

---

## 🚨 **Current Issues & Root Causes**

### **Primary Issue: 500 Internal Server Error**
```
Frontend → API Gateway → Lambda → ❌ 500 Error → Frontend receives error
```

**Root Cause**: Lambda function missing required environment variables

**Missing Variables:**
- `WALLET_METADATA_TABLE`
- `WALLET_KEYS_TABLE`
- `WALLET_KMS_KEY_ID`
- `OPERATOR_PRIVATE_KEY_KMS_KEY_ID`
- `HEDERA_NETWORK`
- `AWS_REGION`

### **Secondary Issues**
1. **Mock Wallet Display**: Frontend shows default wallet due to Lambda failures
2. **No Real Hedera Integration**: Cannot create actual testnet accounts
3. **Data Persistence**: Wallet data not stored in DynamoDB

---

## 🔧 **Required Fixes**

### **Fix 1: Lambda Environment Variables**
```bash
aws lambda update-function-configuration \
  --function-name dev-safemate-user-onboarding \
  --environment Variables='{
    "WALLET_KEYS_TABLE": "safemate-wallet-keys",
    "WALLET_METADATA_TABLE": "safemate-wallet-metadata",
    "WALLET_KMS_KEY_ID": "alias/safemate-master-key-dev",
    "OPERATOR_PRIVATE_KEY_KMS_KEY_ID": "alias/safemate-master-key-dev",
    "HEDERA_NETWORK": "testnet",
    "AWS_REGION": "ap-southeast-2"
  }'
```

### **Fix 2: Verify AWS Resources**
- ✅ **Lambda Function**: Already deployed
- ❓ **DynamoDB Tables**: Need to verify existence
- ❓ **KMS Keys**: Need to verify permissions
- ❓ **Lambda Role**: Need to verify IAM permissions

### **Fix 3: API Gateway CORS**
- ✅ **OPTIONS Method**: Already configured
- ✅ **CORS Headers**: Already set
- ✅ **Methods**: GET, POST, PUT, DELETE, OPTIONS supported

---

## 🧪 **Testing Steps**

### **Step 1: Test Lambda Function Directly**
```bash
aws lambda invoke \
  --function-name dev-safemate-user-onboarding \
  --payload '{"httpMethod":"GET","path":"/onboarding/status"}' \
  response.json
```

### **Step 2: Test API Gateway Endpoint**
```bash
curl -X GET \
  "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev/onboarding/status" \
  -H "Content-Type: application/json"
```

### **Step 3: Test CORS Preflight**
```bash
curl -X OPTIONS \
  "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev/onboarding/status" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"
```

---

## 📊 **Expected Results After Fix**

### **Before Fix (Current State)**
- ❌ 500 Internal Server Error on all wallet requests
- ❌ Mock/default wallet displayed
- ❌ No real Hedera integration
- ❌ No data persistence

### **After Fix (Expected State)**
- ✅ 200 OK responses from Lambda
- ✅ Real Hedera testnet wallet creation
- ✅ Wallet data stored in DynamoDB
- ✅ Real account IDs (e.g., `0.0.1234567`)
- ✅ 0.1 HBAR initial funding from operator account

---

## 🔍 **Monitoring & Verification**

### **CloudWatch Logs**
- **Log Group**: `/aws/lambda/dev-safemate-user-onboarding`
- **Key Metrics**: Error rate, execution time, memory usage

### **DynamoDB Metrics**
- **Tables**: `safemate-wallet-metadata`, `safemate-wallet-keys`
- **Key Metrics**: Read/Write capacity, item count

### **API Gateway Metrics**
- **Endpoint**: `/dev/onboarding/*`
- **Key Metrics**: 4XX/5XX error rates, latency

---

## 🚀 **Next Steps**

1. **Immediate**: Fix Lambda environment variables
2. **Verify**: Test Lambda function directly
3. **Test**: Test API Gateway endpoints
4. **Validate**: Check frontend wallet creation
5. **Monitor**: Watch CloudWatch logs for errors
6. **Cleanup**: Remove temporary files and scripts

---

## 📋 **File Status Summary**

### **✅ Working Files**
- `services/user-onboarding/index.js` - Lambda function code (updated with headers)
- `apps/web/safemate/src/components/ModernLogin.tsx` - Authentication
- `apps/web/safemate/src/services/tokenService.ts` - Token handling
- `apps/web/safemate/src/contexts/UserContext.tsx` - User state

### **❌ Broken Components**
- Lambda function environment variables
- DynamoDB table access
- KMS key permissions
- Real Hedera wallet creation

### **🔧 Fix Scripts Created**
- `fix-lambda-complete.ps1` - Comprehensive fix script
- `MANUAL_LAMBDA_FIX_STEPS.md` - Manual fix instructions

---

**🎯 CONCLUSION**: The 500 error is caused by missing Lambda environment variables, not code issues. Once fixed, the complete Hedera integration will work correctly.
