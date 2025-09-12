# Manual AWS CLI Commands to Fix Missing OPTIONS Methods

## 🎯 **Root Cause Identified**
The AWS CLI output shows that the `/onboarding/start` resource has **no OPTIONS method configured**:
```bash
aws apigateway get-resources --rest-api-id 527ye7o1j0 --query 'items[?path==`/onboarding/start`].resourceMethods.OPTIONS'
[
    {}
]
```

This is why you're getting the CORS error: **No 'Access-Control-Allow-Origin' header is present**.

## 🔧 **Manual Fix Commands**

### **Resource IDs:**
- `/onboarding/start`: `mavtjd`
- `/onboarding/status`: `gyps3r`
- `/onboarding/retry`: `tyidn1`

### **Step 1: Add OPTIONS Method for /onboarding/start**

```bash
# Add OPTIONS method
aws apigateway put-method --rest-api-id 527ye7o1j0 --resource-id mavtjd --http-method OPTIONS --authorization-type NONE

# Add MOCK integration
aws apigateway put-integration --rest-api-id 527ye7o1j0 --resource-id mavtjd --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Add CORS headers to method response
aws apigateway put-method-response --rest-api-id 527ye7o1j0 --resource-id mavtjd --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Max-Age":true}'

# Add CORS header values to integration response
aws apigateway put-integration-response --rest-api-id 527ye7o1j0 --resource-id mavtjd --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"\"http://localhost:5173\"","method.response.header.Access-Control-Allow-Methods":"\"GET,POST,OPTIONS\"","method.response.header.Access-Control-Allow-Headers":"\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\"","method.response.header.Access-Control-Allow-Credentials":"\"true\"","method.response.header.Access-Control-Max-Age":"\"3600\""}'
```

### **Step 2: Add OPTIONS Method for /onboarding/status**

```bash
# Add OPTIONS method
aws apigateway put-method --rest-api-id 527ye7o1j0 --resource-id gyps3r --http-method OPTIONS --authorization-type NONE

# Add MOCK integration
aws apigateway put-integration --rest-api-id 527ye7o1j0 --resource-id gyps3r --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Add CORS headers to method response
aws apigateway put-method-response --rest-api-id 527ye7o1j0 --resource-id gyps3r --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Max-Age":true}'

# Add CORS header values to integration response
aws apigateway put-integration-response --rest-api-id 527ye7o1j0 --resource-id gyps3r --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"\"http://localhost:5173\"","method.response.header.Access-Control-Allow-Methods":"\"GET,POST,OPTIONS\"","method.response.header.Access-Control-Allow-Headers":"\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\"","method.response.header.Access-Control-Allow-Credentials":"\"true\"","method.response.header.Access-Control-Max-Age":"\"3600\""}'
```

### **Step 3: Add OPTIONS Method for /onboarding/retry**

```bash
# Add OPTIONS method
aws apigateway put-method --rest-api-id 527ye7o1j0 --resource-id tyidn1 --http-method OPTIONS --authorization-type NONE

# Add MOCK integration
aws apigateway put-integration --rest-api-id 527ye7o1j0 --resource-id tyidn1 --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Add CORS headers to method response
aws apigateway put-method-response --rest-api-id 527ye7o1j0 --resource-id tyidn1 --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Max-Age":true}'

# Add CORS header values to integration response
aws apigateway put-integration-response --rest-api-id 527ye7o1j0 --resource-id tyidn1 --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"\"http://localhost:5173\"","method.response.header.Access-Control-Allow-Methods":"\"GET,POST,OPTIONS\"","method.response.header.Access-Control-Allow-Headers":"\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\"","method.response.header.Access-Control-Allow-Credentials":"\"true\"","method.response.header.Access-Control-Max-Age":"\"3600\""}'
```

### **Step 4: Configure Gateway Responses for CORS**

```bash
# Configure UNAUTHORIZED response
aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type UNAUTHORIZED --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Origin',value='\"http://localhost:5173\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type UNAUTHORIZED --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Methods',value='\"GET,POST,OPTIONS\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type UNAUTHORIZED --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Headers',value='\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\"'

# Configure DEFAULT_4XX response
aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_4XX --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Origin',value='\"http://localhost:5173\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_4XX --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Methods',value='\"GET,POST,OPTIONS\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_4XX --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Headers',value='\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\"'

# Configure DEFAULT_5XX response
aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_5XX --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Origin',value='\"http://localhost:5173\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_5XX --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Methods',value='\"GET,POST,OPTIONS\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type DEFAULT_5XX --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Headers',value='\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\"'

# Configure ACCESS_DENIED response
aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type ACCESS_DENIED --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Origin',value='\"http://localhost:5173\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type ACCESS_DENIED --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Methods',value='\"GET,POST,OPTIONS\"'

aws apigateway update-gateway-response --rest-api-id 527ye7o1j0 --response-type ACCESS_DENIED --patch-operations op=add,path='/responseParameters/gatewayresponse.header.Access-Control-Allow-Headers',value='\"Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept\"'
```

### **Step 5: Deploy the API**

```bash
# Deploy the API
aws apigateway create-deployment --rest-api-id 527ye7o1j0 --stage-name default --description 'Add OPTIONS methods for CORS'
```

### **Step 6: Verify the Fix**

```bash
# Check if OPTIONS methods now exist
aws apigateway get-resources --rest-api-id 527ye7o1j0 --query 'items[?path==`/onboarding/start`].resourceMethods.OPTIONS'

# Test OPTIONS request
curl -X OPTIONS 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start' -H 'Origin: http://localhost:5173' -v
```

## ✅ **Expected Results**

After running these commands:
- ✅ OPTIONS methods should exist for all resources
- ✅ CORS headers should be returned for OPTIONS requests
- ✅ Gateway responses should include CORS headers
- ✅ Frontend CORS error should be resolved

## 🎯 **Quick Test**

After deployment, test with:
```bash
curl -X OPTIONS 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start' -H 'Origin: http://localhost:5173' -v
```

You should see:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```
