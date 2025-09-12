# Preprod API Configuration Plan

## Current Status
✅ **Cleanup Complete**: All duplicate preprod APIs have been removed
⏳ **Configuration Pending**: Need to configure CORS and Lambda integrations for 6 preprod APIs

## Preprod APIs to Configure

### 1. Hedera API
- **API ID**: `2kwe2ly8vh`
- **Name**: `preprod-safemate-hedera-api`
- **Lambda**: `preprod-safemate-hedera-service`
- **Root Resource ID**: `8ktrgs3sza` (from previous output)

### 2. Vault API
- **API ID**: `fg85dzr0ag`
- **Name**: `preprod-safemate-vault-api`
- **Lambda**: `preprod-safemate-token-vault`

### 3. Wallet API
- **API ID**: `9t9hk461kh`
- **Name**: `preprod-safemate-wallet-api`
- **Lambda**: `preprod-safemate-wallet-manager`

### 4. Group API
- **API ID**: `8a6qaslcbc`
- **Name**: `preprod-safemate-group-api`
- **Lambda**: `preprod-safemate-group-manager`

### 5. Directory API
- **API ID**: `e3k7nfvzab`
- **Name**: `preprod-safemate-directory-api`
- **Lambda**: `preprod-safemate-directory-creator`

### 6. Onboarding API
- **API ID**: `ol212feqdl`
- **Name**: `preprod-safemate-onboarding-api`
- **Lambda**: `preprod-safemate-user-onboarding`

## Configuration Steps for Each API

### Step 1: Get Root Resource ID
```bash
aws apigateway get-resources --rest-api-id <API_ID> --region ap-southeast-2 --output json
```

### Step 2: Configure CORS (OPTIONS Method)
```bash
# Create OPTIONS method
aws apigateway put-method --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --authorization-type NONE --region ap-southeast-2

# Set method response
aws apigateway put-method-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region ap-southeast-2

# Set integration response
aws apigateway put-integration-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":"'\''true'\''","method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''http://localhost:5173'\''"}' --region ap-southeast-2

# Create MOCK integration
aws apigateway put-integration --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}' --region ap-southeast-2
```

### Step 3: Configure Lambda Integration (POST Method)
```bash
# Create POST method
aws apigateway put-method --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --authorization-type NONE --region ap-southeast-2

# Set method response
aws apigateway put-method-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region ap-southeast-2

# Set integration response
aws apigateway put-integration-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":"'\''true'\''","method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''http://localhost:5173'\''"}' --region ap-southeast-2

# Create Lambda integration
aws apigateway put-integration --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-2:<ACCOUNT_ID>:function:<LAMBDA_FUNCTION_NAME>/invocations" --region ap-southeast-2
```

### Step 4: Deploy API
```bash
aws apigateway create-deployment --rest-api-id <API_ID> --stage-name preprod --region ap-southeast-2
```

## Alternative: AWS Console Configuration

For easier configuration, use the AWS Console:

1. **Go to API Gateway** in AWS Console
2. **Select each preprod API** one by one
3. **Go to Resources** tab
4. **Add OPTIONS method**:
   - Click "Actions" → "Create Method"
   - Select "OPTIONS" → "Save"
   - Set up CORS headers in integration response
5. **Add POST method**:
   - Click "Actions" → "Create Method"
   - Select "POST" → "Save"
   - Set integration type to "Lambda Function"
   - Select the corresponding preprod Lambda function
6. **Deploy to 'preprod' stage**:
   - Click "Actions" → "Deploy API"
   - Select "preprod" stage → "Deploy"

## Configuration Status

- [ ] **Hedera API** (`2kwe2ly8vh`) - Ready to configure
- [ ] **Vault API** (`fg85dzr0ag`) - Ready to configure
- [ ] **Wallet API** (`9t9hk461kh`) - Ready to configure
- [ ] **Group API** (`8a6qaslcbc`) - Ready to configure
- [ ] **Directory API** (`e3k7nfvzab`) - Ready to configure
- [ ] **Onboarding API** (`ol212feqdl`) - Ready to configure

## Next Steps

1. **Get AWS Account ID** for Lambda ARN construction
2. **Configure each API** using CLI or Console
3. **Test each endpoint** to verify CORS and Lambda integration
4. **Update frontend configuration** to use preprod endpoints

## Verification Commands

After configuration, test each API:
```bash
# Test CORS preflight
curl -X OPTIONS https://<API_ID>.execute-api.ap-southeast-2.amazonaws.com/preprod/

# Test Lambda integration
curl -X POST https://<API_ID>.execute-api.ap-southeast-2.amazonaws.com/preprod/ -H "Content-Type: application/json" -d '{"test": "data"}'
```

## Expected Final Result

After configuration, you should have:
- **6 preprod APIs** with CORS enabled
- **6 preprod APIs** with Lambda integrations
- **6 preprod APIs** deployed to 'preprod' stage
- **Frontend ready** to connect to preprod environment
