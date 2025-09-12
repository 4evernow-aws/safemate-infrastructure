# 🚨 MANUAL LAMBDA FIX STEPS - 500 Error Resolution

## 🎯 **CRITICAL ISSUE IDENTIFIED**
The **500 Internal Server Error** is caused by **missing environment variables** in the Lambda function.

## 🔧 **IMMEDIATE FIX REQUIRED**

### **Step 1: Set Lambda Environment Variables**

Run this AWS CLI command in your terminal:

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

### **Step 2: Verify Environment Variables**

```bash
aws lambda get-function-configuration \
  --function-name dev-safemate-user-onboarding \
  --query 'Environment.Variables' \
  --output json
```

### **Step 3: Test Lambda Function**

```bash
# Test payload
aws lambda invoke \
  --function-name dev-safemate-user-onboarding \
  --payload '{
    "httpMethod": "GET",
    "path": "/onboarding/status",
    "requestContext": {
      "authorizer": {
        "claims": {
          "sub": "test-user-123",
          "email": "test@example.com"
        }
      }
    }
  }' \
  response.json
```

### **Step 4: Test API Gateway Endpoint**

```bash
# Test CORS preflight
curl -X OPTIONS \
  "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev/onboarding/status" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

# Test actual endpoint
curl -X GET \
  "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/dev/onboarding/status" \
  -H "Content-Type: application/json" \
  -v
```

## 🔍 **What This Fixes**

### **✅ Before Fix:**
- Lambda function missing environment variables
- 500 Internal Server Error on all requests
- No access to DynamoDB tables
- No access to KMS keys
- Hedera integration completely broken

### **✅ After Fix:**
- Lambda function has all required environment variables
- Can access DynamoDB tables for wallet data
- Can access KMS for encryption/decryption
- Real Hedera wallet creation will work
- 500 errors should be resolved

## 🗺️ **Complete Flow After Fix**

1. **User signs in** → Cognito authentication ✅
2. **Frontend calls API** → API Gateway ✅
3. **API Gateway calls Lambda** → Lambda function ✅
4. **Lambda checks DynamoDB** → Wallet status ✅
5. **Lambda creates Hedera wallet** → Real testnet account ✅
6. **Lambda stores in DynamoDB** → Persistent storage ✅
7. **Frontend receives response** → Real wallet data ✅

## 🚀 **Expected Results**

After applying this fix:

1. **No more 500 errors** in browser console
2. **Real Hedera wallet creation** will work
3. **Wallet data will persist** in DynamoDB
4. **Real testnet accounts** will be created
5. **No more mock/default wallet** data

## 🔍 **Troubleshooting**

If you still get errors after this fix:

1. **Check CloudWatch logs** for Lambda function
2. **Verify DynamoDB tables** exist and are accessible
3. **Check KMS key permissions** for Lambda execution role
4. **Verify API Gateway** CORS configuration
5. **Check Lambda execution role** has proper permissions

## 📋 **Required AWS Resources**

- ✅ **Lambda Function**: `dev-safemate-user-onboarding`
- ✅ **DynamoDB Tables**: `safemate-wallet-keys`, `safemate-wallet-metadata`
- ✅ **KMS Keys**: `alias/safemate-master-key-dev`
- ✅ **API Gateway**: `527ye7o1j0` with `/dev` stage
- ✅ **Cognito User Pool**: For authentication

## 🎯 **Next Steps After Fix**

1. **Test the application** in your browser
2. **Sign in and try to create a wallet**
3. **Check if 500 errors are gone**
4. **Verify real Hedera account creation**
5. **Check DynamoDB for wallet data**

---

**⚠️ IMPORTANT**: This fix addresses the root cause of the 500 error. The Lambda function code is correct, but it was missing the environment variables needed to access AWS services.
