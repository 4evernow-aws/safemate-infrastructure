# Simple Fix Commands for CORS and 500 Errors

## 🔧 **Step 1: Update Lambda Environment Variables**

The Lambda function needs the correct DynamoDB table names. Run this command:

```bash
aws lambda update-function-configuration \
  --function-name default-safemate-ultimate-wallet \
  --environment Variables='{"WALLET_KEYS_TABLE":"default-safemate-wallet-keys","WALLET_METADATA_TABLE":"default-safemate-wallet-metadata","APP_SECRETS_KMS_KEY_ID":"alias/safemate-master-key-dev","WALLET_KMS_KEY_ID":"alias/safemate-master-key-dev","HEDERA_NETWORK":"testnet","USER_ONBOARDING_FUNCTION":"default-safemate-user-onboarding"}'
```

## 🔧 **Step 2: Verify Environment Variables**

Check if the update worked:

```bash
aws lambda get-function-configuration \
  --function-name default-safemate-ultimate-wallet \
  --query 'Environment.Variables'
```

## 🔧 **Step 3: Test CORS Preflight**

Test if CORS is working:

```bash
curl -X OPTIONS \
  https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

## 🔧 **Step 4: Test Direct Lambda Invocation**

Test the Lambda function directly:

```bash
aws lambda invoke \
  --function-name default-safemate-ultimate-wallet \
  --payload '{"httpMethod":"POST","path":"/onboarding/start","body":"{\"action\":\"start\"}","headers":{"Content-Type":"application/json"}}' \
  response.json

cat response.json
rm response.json
```

## 🔧 **Step 5: Test API Gateway (should return 401 without auth)**

```bash
curl -X POST \
  https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}' \
  -v
```

## 🎯 **Expected Results**

### **Step 1**: Should show Lambda configuration update
### **Step 2**: Should show environment variables with correct table names
### **Step 3**: Should return 200 OK with CORS headers
### **Step 4**: Should return Lambda response (not 500 error)
### **Step 5**: Should return 401 Unauthorized (expected without auth)

## 🚨 **If Still Getting Errors**

If you're still getting CORS or 500 errors after these steps, the issue might be:

1. **API Gateway CORS configuration** - May need to be reconfigured
2. **Lambda function code** - May have an error in the handler
3. **Lambda layer dependencies** - May be missing required dependencies

## 🔍 **Next Diagnostic Steps**

If the above doesn't work, run these diagnostic commands:

```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/default-safemate-ultimate-wallet'

# Check API Gateway resources
aws apigateway get-resources --rest-api-id 527ye7o1j0

# Check DynamoDB tables
aws dynamodb describe-table --table-name default-safemate-wallet-keys --query 'Table.TableStatus'
aws dynamodb describe-table --table-name default-safemate-wallet-metadata --query 'Table.TableStatus'
```
