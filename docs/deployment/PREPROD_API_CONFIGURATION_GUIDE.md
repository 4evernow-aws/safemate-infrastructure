# Preprod API Configuration Guide

## Overview
This guide provides step-by-step instructions to configure all preprod APIs with CORS and Lambda integrations.

## Preprod APIs to Configure
1. `preprod-safemate-hedera-api` - ID: `2kwe2ly8vh`
2. `preprod-safemate-vault-api` - ID: `fg85dzr0ag`
3. `preprod-safemate-wallet-api` - ID: `9t9hk461kh`
4. `preprod-safemate-group-api` - ID: `8a6qaslcbc`
5. `preprod-safemate-directory-api` - ID: `e3k7nfvzab`
6. `preprod-safemate-onboarding-api` - ID: `ol212feqdl`

## Lambda Functions (Preprod)
- `preprod-safemate-hedera-service`
- `preprod-safemate-token-vault`
- `preprod-safemate-wallet-manager`
- `preprod-safemate-group-manager`
- `preprod-safemate-directory-creator`
- `preprod-safemate-user-onboarding`

## Configuration Steps for Each API

### Step 1: Get Root Resource ID
```bash
aws apigateway get-resources --rest-api-id <API_ID> --region ap-southeast-2 --output json
```

### Step 2: Create OPTIONS Method (CORS)
```bash
aws apigateway put-method --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --authorization-type NONE --region ap-southeast-2
```

### Step 3: Set OPTIONS Method Response
```bash
aws apigateway put-method-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region ap-southeast-2
```

### Step 4: Set OPTIONS Integration Response
```bash
aws apigateway put-integration-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":"'\''true'\''","method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''http://localhost:5173'\''"}' --region ap-southeast-2
```

### Step 5: Create MOCK Integration for OPTIONS
```bash
aws apigateway put-integration --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}' --region ap-southeast-2
```

### Step 6: Create POST Method
```bash
aws apigateway put-method --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --authorization-type NONE --region ap-southeast-2
```

### Step 7: Set POST Method Response
```bash
aws apigateway put-method-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":true,"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region ap-southeast-2
```

### Step 8: Set POST Integration Response
```bash
aws apigateway put-integration-response --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Credentials":"'\''true'\''","method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''http://localhost:5173'\''"}' --region ap-southeast-2
```

### Step 9: Create Lambda Integration for POST
```bash
aws apigateway put-integration --rest-api-id <API_ID> --resource-id <ROOT_RESOURCE_ID> --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-2:<ACCOUNT_ID>:function:<LAMBDA_FUNCTION_NAME>/invocations" --region ap-southeast-2
```

### Step 10: Create Deployment
```bash
aws apigateway create-deployment --rest-api-id <API_ID> --stage-name preprod --region ap-southeast-2
```

## Quick Configuration Commands

### For Hedera API (2kwe2ly8vh):
```bash
# Get root resource ID first
aws apigateway get-resources --rest-api-id 2kwe2ly8vh --region ap-southeast-2 --output json

# Then run the configuration commands with the root resource ID
```

## Alternative: Use AWS Console
For easier configuration, you can also use the AWS Console:
1. Go to API Gateway
2. Select each preprod API
3. Go to Resources
4. Add OPTIONS method with CORS headers
5. Add POST method with Lambda integration
6. Deploy to 'preprod' stage

## Verification
After configuration, test each API endpoint:
```bash
# Test OPTIONS (CORS preflight)
curl -X OPTIONS https://<API_ID>.execute-api.ap-southeast-2.amazonaws.com/preprod/

# Test POST
curl -X POST https://<API_ID>.execute-api.ap-southeast-2.amazonaws.com/preprod/ -H "Content-Type: application/json" -d '{"test": "data"}'
```

## Status
- [ ] Hedera API configured
- [ ] Vault API configured
- [ ] Wallet API configured
- [ ] Group API configured
- [ ] Directory API configured
- [ ] Onboarding API configured
