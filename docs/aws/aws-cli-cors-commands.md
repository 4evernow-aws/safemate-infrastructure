# AWS CLI Commands to Check CORS Configuration

## 🔍 **Quick Diagnostic Commands**

### **1. Check API Gateway Resources**
```bash
aws apigateway get-resources --rest-api-id 527ye7o1j0 --output table
```

### **2. Check Specific Resources (Onboarding)**
```bash
aws apigateway get-resources --rest-api-id 527ye7o1j0 --query 'items[?path==`/onboarding/start` || path==`/onboarding/status` || path==`/onboarding/retry`]'
```

### **3. Check if OPTIONS Methods Exist**
```bash
# For /onboarding/start
aws apigateway get-resources --rest-api-id 527ye7o1j0 --query 'items[?path==`/onboarding/start`].resourceMethods.OPTIONS'

# For /onboarding/status  
aws apigateway get-resources --rest-api-id 527ye7o1j0 --query 'items[?path==`/onboarding/status`].resourceMethods.OPTIONS'

# For /onboarding/retry
aws apigateway get-resources --rest-api-id 527ye7o1j0 --query 'items[?path==`/onboarding/retry`].resourceMethods.OPTIONS'
```

### **4. Check Method Configuration (Replace {RESOURCE_ID})**
```bash
# Check OPTIONS method
aws apigateway get-method --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS

# Check POST method
aws apigateway get-method --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method POST

# Check GET method
aws apigateway get-method --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method GET
```

### **5. Check Method Responses (CORS Headers)**
```bash
aws apigateway get-method-response --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS --status-code 200
```

### **6. Check Integration Responses (CORS Header Values)**
```bash
aws apigateway get-integration-response --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS --status-code 200
```

### **7. Check Gateway Responses (for 401, 500 errors)**
```bash
# Check UNAUTHORIZED response
aws apigateway get-gateway-response --rest-api-id 527ye7o1j0 --response-type UNAUTHORIZED

# Check DEFAULT_4XX response
aws apigateway get-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_4XX

# Check DEFAULT_5XX response
aws apigateway get-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_5XX

# Check ACCESS_DENIED response
aws apigateway get-gateway-response --rest-api-id 527ye7o1j0 --response-type ACCESS_DENIED
```

### **8. Check API Deployments**
```bash
aws apigateway get-deployments --rest-api-id 527ye7o1j0 --output table
```

### **9. Check Stage Configuration**
```bash
aws apigateway get-stage --rest-api-id 527ye7o1j0 --stage-name default
```

### **10. Check Lambda Function Configuration**
```bash
# Check if function exists
aws lambda get-function --function-name default-safemate-ultimate-wallet

# Check environment variables
aws lambda get-function --function-name default-safemate-ultimate-wallet --query 'Configuration.Environment.Variables'

# Check function status
aws lambda get-function --function-name default-safemate-ultimate-wallet --query 'Configuration.{FunctionName:FunctionName,LastModified:LastModified,Runtime:Runtime,Handler:Handler}'
```

### **11. Check Lambda Function Logs**
```bash
# Check if log group exists
aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/default-safemate-ultimate-wallet'

# Get latest log stream
aws logs describe-log-streams --log-group-name '/aws/lambda/default-safemate-ultimate-wallet' --order-by LastEventTime --descending --max-items 1

# Get latest events (replace {LOG_STREAM_NAME})
aws logs get-log-events --log-group-name '/aws/lambda/default-safemate-ultimate-wallet' --log-stream-name {LOG_STREAM_NAME} --limit 10
```

### **12. Check API Gateway Authorizers**
```bash
aws apigateway get-authorizers --rest-api-id 527ye7o1j0
```

### **13. Test API Endpoints**
```bash
# Test OPTIONS request
curl -X OPTIONS 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start' \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type,Authorization' \
  -v

# Test POST request (should return 401)
curl -X POST 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5173' \
  -d '{"action":"start"}' \
  -v
```

## 🎯 **Step-by-Step Diagnostic Process**

### **Step 1: Check Resources**
```bash
aws apigateway get-resources --rest-api-id 527ye7o1j0 --output table
```

### **Step 2: Check OPTIONS Methods**
```bash
# Look for OPTIONS methods in the output
aws apigateway get-resources --rest-api-id 527ye7o1j0 --query 'items[?path==`/onboarding/start`].resourceMethods'
```

### **Step 3: Check CORS Headers**
```bash
# If OPTIONS method exists, check its responses
aws apigateway get-method-response --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS --status-code 200
```

### **Step 4: Check Gateway Responses**
```bash
aws apigateway get-gateway-response --rest-api-id 527ye7o1j0 --response-type UNAUTHORIZED
```

### **Step 5: Check Lambda Function**
```bash
aws lambda get-function --function-name default-safemate-ultimate-wallet
```

### **Step 6: Test Endpoint**
```bash
curl -X OPTIONS 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start' -H 'Origin: http://localhost:5173' -v
```

## ✅ **Expected Results**

### **✅ What Should Work:**
- OPTIONS methods should exist for all resources
- Method responses should include CORS headers
- Integration responses should have CORS header values
- Gateway responses should include CORS headers
- Lambda function should be active
- API should be deployed to `default` stage

### **❌ Common Issues:**
- Missing OPTIONS methods
- Missing CORS headers in method responses
- Missing CORS header values in integration responses
- API not deployed to correct stage
- Lambda function missing environment variables

## 🔧 **Quick Fix Commands**

If you find missing OPTIONS methods, you can add them:

```bash
# Add OPTIONS method
aws apigateway put-method --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS --authorization-type NONE

# Add MOCK integration
aws apigateway put-integration --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Add CORS headers to method response
aws apigateway put-method-response --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Headers":true}'

# Add CORS header values to integration response
aws apigateway put-integration-response --rest-api-id 527ye7o1j0 --resource-id {RESOURCE_ID} --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"\"http://localhost:5173\"","method.response.header.Access-Control-Allow-Methods":"\"GET,POST,OPTIONS\"","method.response.header.Access-Control-Allow-Headers":"\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\""}'

# Deploy the API
aws apigateway create-deployment --rest-api-id 527ye7o1j0 --stage-name default --description 'CORS fix'
```
