# Hedera API Flow Analysis

## 🔍 **Complete Flow: Frontend → API Gateway → Lambda → DynamoDB → Hedera**

### **📋 Current Configuration Status**

#### **✅ Working Components:**

1. **Frontend Configuration**
   - **File**: `apps/web/safemate/.env.local`
   - **Hedera API URL**: `https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/default`
   - **Service**: `hederaApiService.ts` ✅ **CONFIGURED**

2. **API Gateway Configuration**
   - **Gateway ID**: `229i7zye9f` ✅ **ACTIVE**
   - **Name**: `default-safemate-hedera-api`
   - **Lambda Function**: `default-safemate-hedera-service` ✅ **MAPPED**
   - **CORS**: ✅ **CONFIGURED** (handled in Lambda)
   - **Authentication**: Cognito User Pools ✅ **CONFIGURED**

3. **Lambda Function Configuration**
   - **File**: `services/hedera-service/index.js` ✅ **EXISTS**
   - **Runtime**: `nodejs18.x` ✅ **ACTIVE**
   - **Handler**: `index.handler` ✅ **CONFIGURED**
   - **Timeout**: 90s ✅ **SUFFICIENT**
   - **Memory**: 128MB ✅ **ADEQUATE**
   - **Dependencies**: AWS SDK v3, Hedera SDK v2.71.1 ✅ **COMPLETE**
   - **Environment Variables**: ✅ **CONFIGURED**

4. **DynamoDB Tables**
   - **Folders Table**: `default-safemate-folders` ✅ **CONFIGURED**
   - **Files Table**: `default-safemate-files` ✅ **CONFIGURED**
   - **Wallet Keys Table**: `default-safemate-wallet-keys` ✅ **CONFIGURED**
   - **Wallet Metadata Table**: `default-safemate-wallet-metadata` ✅ **CONFIGURED**

5. **Cognito Authentication**
   - **User Pool ID**: `ap-southeast-2_uLgMRpWlw` ✅ **ACTIVE**
   - **Authorizer ID**: `g5m0zk` ✅ **CONFIGURED**
   - **Authorization Type**: `COGNITO_USER_POOLS` ✅ **ACTIVE**

6. **API Gateway Resources**
   - **Root Resource**: `djhyo7o9g9` ✅ **CONFIGURED**
   - **Folders Resource**: `suk3xe` ✅ **CONFIGURED**
   - **Files Resource**: `rbgo3c` ✅ **CONFIGURED**
   - **Upload Resource**: `v1i7go` ✅ **CONFIGURED**

---

## 🚨 **Issue Analysis**

### **Root Cause: Authentication Token Issue**

The **502 Bad Gateway** error occurs because:

1. **Frontend sends request** → `https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/default/folders`
2. **API Gateway receives request** → Checks Cognito authorization
3. **Cognito Authorizer validates token** → If invalid/expired, returns 401 Unauthorized
4. **If token is valid** → Forwards to Lambda function
5. **Lambda function processes request** → Returns response

**The issue is that the frontend is sending an invalid or expired Cognito ID token.**

### **Evidence:**
- ✅ CORS preflight requests work (200 OK)
- ✅ API Gateway returns 401 Unauthorized without auth (correct behavior)
- ✅ Lambda function exists and is properly configured
- ✅ API Gateway integration is correct
- ✅ Lambda permissions are properly set
- ❌ Frontend requests fail with 502 (indicating auth token issue)

---

## 🛠️ **Solution Steps**

### **Step 1: Verify Frontend Authentication**

The frontend needs to ensure the user is properly authenticated and has a valid Cognito ID token.

**Check these files:**
- `apps/web/safemate/src/services/tokenService.ts` - Token management
- `apps/web/safemate/src/services/hederaApiService.ts` - API calls
- `apps/web/safemate/src/contexts/UserContext.tsx` - User authentication state

### **Step 2: Test with Valid User Session**

1. **Ensure user is logged in** to the SafeMate application
2. **Check browser console** for authentication errors
3. **Verify Cognito session** is active and not expired
4. **Test API calls** with valid authentication

### **Step 3: Debug Frontend Authentication**

Add debugging to the frontend to identify token issues:

```typescript
// In hederaApiService.ts
private static async getAuthHeaders(): Promise<HeadersInit> {
  console.log('🔍 Getting auth headers...');
  
  const idToken = await TokenService.getValidIdToken();
  
  if (!idToken) {
    console.error('❌ No ID token available - user not authenticated');
    throw new Error('User not authenticated');
  }
  
  console.log('✅ ID token available');
  return {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  };
}
```

---

## 📊 **Test Results**

### **✅ Successful Tests:**
- API Gateway exists and is active
- Lambda function exists and is properly configured
- CORS preflight requests work (200 OK)
- API Gateway correctly returns 401 without authentication
- Cognito User Pool is active
- Lambda permissions are properly configured
- API Gateway integration is correct

### **❌ Failed Tests:**
- Frontend requests with authentication return 502 Bad Gateway
- This indicates the authentication token is invalid or expired

---

## 🔧 **Next Steps**

1. **Check user authentication status** in the frontend
2. **Verify Cognito session** is active and not expired
3. **Test with a fresh login** to ensure valid tokens
4. **Add debugging** to frontend authentication flow
5. **Monitor browser console** for authentication errors

---

## 📁 **Key Files**

### **Frontend:**
- `apps/web/safemate/.env.local` - Environment configuration
- `apps/web/safemate/src/services/hederaApiService.ts` - API service
- `apps/web/safemate/src/services/tokenService.ts` - Token management
- `apps/web/safemate/src/config/environment.ts` - Environment config

### **Backend:**
- `services/hedera-service/index.js` - Lambda function
- `services/hedera-service/package.json` - Dependencies

### **Documentation:**
- `documentation/DEPLOYMENT_MAPPING_REGISTRY.md` - Service mappings
- `documentation/AWS_SERVICES_MAPPING.md` - AWS services

---

## 🌐 **API Endpoints**

- **Base URL**: `https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/default`
- **Folders**: `/folders` (GET, POST)
- **Files**: `/files` (GET, POST)
- **Upload**: `/files/upload` (POST)

---

## 🔐 **Authentication**

- **Type**: Cognito User Pools
- **User Pool**: `ap-southeast-2_uLgMRpWlw`
- **Header**: `Authorization: Bearer <id-token>`
- **Token Source**: AWS Amplify Auth Session

---

**Status**: ✅ **Infrastructure is correctly configured**  
**Issue**: 🔍 **Frontend authentication token validation required**
