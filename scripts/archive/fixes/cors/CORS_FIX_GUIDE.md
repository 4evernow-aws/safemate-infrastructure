# CORS Fix Guide for SafeMate API

## 🚨 **Current Issue**
```
Access to fetch at 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔧 **Root Cause**
The API Gateway is not configured to handle CORS preflight requests properly. The Lambda function has CORS headers, but the API Gateway needs to be configured to:
1. Handle OPTIONS requests
2. Return CORS headers for all responses (including 401, 500 errors)
3. Allow the frontend origin (`http://localhost:5173`)

## 📋 **Solution Steps**

### **Step 1: Configure API Gateway CORS (Manual)**

1. **Go to AWS API Gateway Console**
   - Navigate to: https://console.aws.amazon.com/apigateway/
   - Select your API: `default-safemate-onboarding-api` (ID: `527ye7o1j0`)

2. **For each resource, enable CORS:**
   - `/onboarding/start`
   - `/onboarding/status` 
   - `/onboarding/retry`

3. **CORS Configuration:**
   ```
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept
   Access-Control-Allow-Methods: GET,POST,OPTIONS
   Access-Control-Allow-Credentials: true
   Access-Control-Max-Age: 3600
   ```

4. **Gateway Responses to configure:**
   - ACCESS_DENIED
   - DEFAULT_4XX
   - DEFAULT_5XX
   - UNAUTHORIZED

5. **Deploy the API:**
   - Actions → Deploy API
   - Stage: `default`
   - Click "Deploy"

### **Step 2: Verify Lambda Function**

The UltimateWalletService already has proper CORS configuration:

```javascript
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};
```

### **Step 3: Test the Fix**

After configuring API Gateway CORS:

1. **Test OPTIONS request:**
   ```bash
   curl -X OPTIONS "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization"
   ```

2. **Expected response:**
   ```
   HTTP/1.1 200 OK
   Access-Control-Allow-Origin: http://localhost:5173
   Access-Control-Allow-Methods: GET,POST,OPTIONS
   Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept
   Access-Control-Allow-Credentials: true
   ```

### **Step 4: Test Frontend**

After the fix:
1. The CORS error should be resolved
2. You may get 401 Unauthorized (expected - need valid auth token)
3. You may get 500 Internal Server Error (Lambda needs environment variables)

## 🔍 **Troubleshooting**

### **If CORS error persists:**
1. Check that API Gateway CORS is properly configured
2. Verify the API is deployed to the `default` stage
3. Clear browser cache and try again

### **If you get 500 Internal Server Error:**
The Lambda function needs environment variables:
```
WALLET_KEYS_TABLE=safemate-wallet-keys
WALLET_METADATA_TABLE=safemate-wallet-metadata
APP_SECRETS_KMS_KEY_ID=alias/safemate-app-secrets
WALLET_KMS_KEY_ID=alias/safemate-wallet-keys
HEDERA_NETWORK=testnet
AWS_REGION=ap-southeast-2
```

### **If you get 401 Unauthorized:**
This is expected - the frontend needs to send a valid Cognito ID token.

## ✅ **Expected Results**

After the fix:
- ✅ CORS error resolved
- ✅ OPTIONS requests return 200 with CORS headers
- ✅ POST/GET requests return 401 (auth required) with CORS headers
- ✅ Frontend can make requests without CORS blocking

## 🎯 **Next Steps**

1. **Configure API Gateway CORS** (manual steps above)
2. **Deploy API Gateway changes**
3. **Test the frontend**
4. **If 500 errors persist, set Lambda environment variables**
5. **If 401 errors persist, ensure frontend sends valid auth tokens**
