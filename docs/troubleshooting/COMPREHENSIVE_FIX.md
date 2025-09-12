# Comprehensive Fix for SafeMate Hedera Integration

## 🚨 **Current Issues**

1. **CORS Policy Blocked**: Frontend can't access API
2. **500 Internal Server Error**: Lambda function failing
3. **Environment Variables**: May need additional configuration

## 🔧 **Step-by-Step Fix**

### **Step 1: Check Current Environment Variables**

```bash
aws lambda get-function-configuration --function-name default-safemate-ultimate-wallet --query 'Environment.Variables' --output json
```

### **Step 2: Add Missing Environment Variables**

The Lambda might need additional environment variables. Create a new configuration:

```json
{
  "FunctionName": "default-safemate-ultimate-wallet",
  "Environment": {
    "Variables": {
      "WALLET_KEYS_TABLE": "safemate-wallet-keys",
      "WALLET_METADATA_TABLE": "safemate-wallet-metadata",
      "APP_SECRETS_KMS_KEY_ID": "alias/safemate-app-secrets",
      "WALLET_KMS_KEY_ID": "alias/safemate-wallet-keys",
      "HEDERA_NETWORK": "testnet",
      "USER_ONBOARDING_FUNCTION": "default-safemate-user-onboarding"
    }
  }
}
```

### **Step 3: Update Lambda Configuration**

```bash
aws lambda update-function-configuration --cli-input-json file://lambda-config-updated.json
```

### **Step 4: Check Lambda Logs**

```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/default-safemate-ultimate-wallet"
```

### **Step 5: Test API Directly**

```bash
curl -X POST "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action":"start"}'
```

### **Step 6: Verify CORS Configuration**

Check if CORS is still properly configured:

```bash
aws apigateway get-method --rest-api-id 527ye7o1j0 --resource-id mavtjd --http-method OPTIONS
```

## 🎯 **Expected Results**

After these fixes:
1. **Environment Variables**: All required variables set
2. **500 Error**: Resolved
3. **CORS**: Working properly
4. **Frontend**: Can communicate with API

## 🔍 **Troubleshooting Commands**

### **Check Lambda Status**
```bash
aws lambda get-function --function-name default-safemate-ultimate-wallet
```

### **Test Lambda Directly**
```bash
aws lambda invoke --function-name default-safemate-ultimate-wallet \
  --payload '{"httpMethod":"POST","path":"/onboarding/start","body":"{\"action\":\"start\"}","headers":{"Content-Type":"application/json"}}' \
  response.json --cli-binary-format raw-in-base64-out
```

### **Check API Gateway**
```bash
aws apigateway get-rest-api --rest-api-id 527ye7o1j0
```

## 📝 **Next Steps**

1. Run the commands above
2. Check Lambda logs for specific error messages
3. Update environment variables if needed
4. Test the frontend again
