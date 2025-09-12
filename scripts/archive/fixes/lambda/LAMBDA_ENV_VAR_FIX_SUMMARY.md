# Final Lambda Fix Commands

## 🚨 **Current Status: 500 Internal Server Error**

The CORS issue is resolved, but the Lambda function is returning 500 Internal Server Error because it's missing required environment variables.

## 🔧 **Required Action: Set Lambda Environment Variables**

### **Step 1: Set Environment Variables**
Run this AWS CLI command to set the required environment variables:

```bash
aws lambda update-function-configuration \
  --function-name default-safemate-ultimate-wallet \
  --environment Variables='{"WALLET_KEYS_TABLE":"safemate-wallet-keys","WALLET_METADATA_TABLE":"safemate-wallet-metadata","APP_SECRETS_KMS_KEY_ID":"alias/safemate-app-secrets","WALLET_KMS_KEY_ID":"alias/safemate-wallet-keys","HEDERA_NETWORK":"testnet","AWS_REGION":"ap-southeast-2"}'
```

### **Step 2: Verify Environment Variables**
Check if the environment variables were set correctly:

```bash
aws lambda get-function-configuration \
  --function-name default-safemate-ultimate-wallet \
  --query 'Environment.Variables' \
  --output json
```

### **Step 3: Test the Lambda**
Test if the Lambda is working:

```bash
curl -X POST "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

## 🎯 **Expected Results**

After setting the environment variables:

1. **CORS**: ✅ Already fixed - no more CORS blocking
2. **500 Error**: Should be resolved
3. **Authentication**: May get 401 Unauthorized (expected without valid auth token)

## 🔍 **Troubleshooting Commands**

### **Check Lambda Function Status**
```bash
aws lambda get-function \
  --function-name default-safemate-ultimate-wallet \
  --query 'Configuration.{FunctionName:FunctionName,Runtime:Runtime,CodeSize:CodeSize}' \
  --output table
```

### **Check Lambda Logs**
```bash
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/default-safemate-ultimate-wallet"
```

### **Test Lambda Directly**
```bash
aws lambda invoke \
  --function-name default-safemate-ultimate-wallet \
  --payload '{"httpMethod":"POST","path":"/onboarding/start","body":"{\"action\":\"start\"}","headers":{"Content-Type":"application/json"}}' \
  response.json \
  --cli-binary-format raw-in-base64-out
```

## 📝 **PowerShell Alternative**

If you prefer PowerShell, you can also run:

```powershell
.\setup-ultimate-wallet-env.ps1
```

## 🎉 **Status Summary**

- ✅ **CORS Issue**: RESOLVED
- ❌ **500 Error**: NEEDS ENVIRONMENT VARIABLES
- 🔄 **Next Step**: Run the AWS CLI command above to set environment variables

## 🚀 **Quick Fix**

**Just run this single command:**

```bash
aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables='{"WALLET_KEYS_TABLE":"safemate-wallet-keys","WALLET_METADATA_TABLE":"safemate-wallet-metadata","APP_SECRETS_KMS_KEY_ID":"alias/safemate-app-secrets","WALLET_KMS_KEY_ID":"alias/safemate-wallet-keys","HEDERA_NETWORK":"testnet","AWS_REGION":"ap-southeast-2"}'
```

**Then test your frontend again!**
