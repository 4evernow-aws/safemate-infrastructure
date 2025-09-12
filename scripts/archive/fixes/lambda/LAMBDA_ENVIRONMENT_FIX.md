# Lambda Environment Variables Fix

## 🚨 **500 Internal Server Error - Environment Variables Missing**

The CORS issue is now resolved, but the Lambda function is returning a 500 Internal Server Error because it's missing required environment variables.

## 🔧 **Required Environment Variables**

The `default-safemate-ultimate-wallet` Lambda function needs these environment variables:

```json
{
  "WALLET_KEYS_TABLE": "safemate-wallet-keys",
  "WALLET_METADATA_TABLE": "safemate-wallet-metadata", 
  "APP_SECRETS_KMS_KEY_ID": "alias/safemate-app-secrets",
  "WALLET_KMS_KEY_ID": "alias/safemate-wallet-keys",
  "HEDERA_NETWORK": "testnet",
  "AWS_REGION": "ap-southeast-2"
}
```

## 📋 **AWS CLI Commands to Run**

### **Step 1: Set Environment Variables**
```bash
aws lambda update-function-configuration \
  --function-name default-safemate-ultimate-wallet \
  --environment Variables='{"WALLET_KEYS_TABLE":"safemate-wallet-keys","WALLET_METADATA_TABLE":"safemate-wallet-metadata","APP_SECRETS_KMS_KEY_ID":"alias/safemate-app-secrets","WALLET_KMS_KEY_ID":"alias/safemate-wallet-keys","HEDERA_NETWORK":"testnet","AWS_REGION":"ap-southeast-2"}'
```

### **Step 2: Verify Environment Variables**
```bash
aws lambda get-function-configuration \
  --function-name default-safemate-ultimate-wallet \
  --query 'Environment.Variables' \
  --output json
```

### **Step 3: Test the Lambda**
```bash
curl -X POST "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

## 🎯 **Expected Results**

After setting the environment variables:

1. **CORS**: ✅ Already fixed - no more CORS blocking
2. **Authentication**: Should get 401 Unauthorized (expected without valid token)
3. **Lambda Function**: Should no longer return 500 Internal Server Error

## 🔍 **Troubleshooting**

If you still get 500 errors after setting environment variables:

1. **Check DynamoDB Tables**: Ensure `safemate-wallet-keys` and `safemate-wallet-metadata` exist
2. **Check KMS Keys**: Ensure `alias/safemate-app-secrets` and `alias/safemate-wallet-keys` exist
3. **Check Lambda Logs**: Use CloudWatch to see detailed error messages

## 📝 **PowerShell Alternative**

If AWS CLI doesn't work, you can also use the existing script:
```powershell
.\setup-ultimate-wallet-env.ps1
```

## 🎉 **Status**

- ✅ **CORS Issue**: RESOLVED
- ❌ **500 Error**: NEEDS ENVIRONMENT VARIABLES
- 🔄 **Next Step**: Set environment variables using AWS CLI commands above
