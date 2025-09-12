# AWS Console Configuration Checklist for Preprod APIs

## Overview
This checklist will guide you through configuring all 6 preprod APIs using the AWS Console approach.

## Preprod APIs to Configure

### 1. Hedera API
- **API Name**: `preprod-safemate-hedera-api`
- **API ID**: `2kwe2ly8vh`
- **Lambda Function**: `preprod-safemate-hedera-service`
- **Status**: ⏳ Pending

### 2. Vault API
- **API Name**: `preprod-safemate-vault-api`
- **API ID**: `fg85dzr0ag`
- **Lambda Function**: `preprod-safemate-token-vault`
- **Status**: ⏳ Pending

### 3. Wallet API
- **API Name**: `preprod-safemate-wallet-api`
- **API ID**: `9t9hk461kh`
- **Lambda Function**: `preprod-safemate-wallet-manager`
- **Status**: ⏳ Pending

### 4. Group API
- **API Name**: `preprod-safemate-group-api`
- **API ID**: `8a6qaslcbc`
- **Lambda Function**: `preprod-safemate-group-manager`
- **Status**: ⏳ Pending

### 5. Directory API
- **API Name**: `preprod-safemate-directory-api`
- **API ID**: `e3k7nfvzab`
- **Lambda Function**: `preprod-safemate-directory-creator`
- **Status**: ⏳ Pending

### 6. Onboarding API
- **API Name**: `preprod-safemate-onboarding-api`
- **API ID**: `ol212feqdl`
- **Lambda Function**: `preprod-safemate-user-onboarding`
- **Status**: ⏳ Pending

## Configuration Steps for Each API

### Step 1: Navigate to API Gateway
1. [ ] Go to AWS Console
2. [ ] Navigate to API Gateway service
3. [ ] Verify you're in the correct region (ap-southeast-2)

### Step 2: Select API
1. [ ] Find and click on the API name from the list above
2. [ ] Verify you're on the "Resources" tab

### Step 3: Configure OPTIONS Method (CORS)
1. [ ] Click "Actions" → "Create Method"
2. [ ] Select "OPTIONS" from the dropdown
3. [ ] Click "Save"
4. [ ] Set Integration Type to "Mock"
5. [ ] Click "Save"
6. [ ] Click "Integration Response"
7. [ ] Add the following headers:
   - [ ] `Access-Control-Allow-Credentials`: `'true'`
   - [ ] `Access-Control-Allow-Headers`: `'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'`
   - [ ] `Access-Control-Allow-Methods`: `'GET,POST,PUT,DELETE,OPTIONS'`
   - [ ] `Access-Control-Allow-Origin`: `'http://localhost:5173'`

### Step 4: Configure POST Method (Lambda Integration)
1. [ ] Click "Actions" → "Create Method"
2. [ ] Select "POST" from the dropdown
3. [ ] Click "Save"
4. [ ] Set Integration Type to "Lambda Function"
5. [ ] Select the corresponding Lambda function name
6. [ ] Click "Save"
7. [ ] Click "Integration Response"
8. [ ] Add the same CORS headers as OPTIONS method

### Step 5: Deploy API
1. [ ] Click "Actions" → "Deploy API"
2. [ ] Select "preprod" as the deployment stage
3. [ ] Click "Deploy"

## Individual API Configuration Tracking

### Hedera API (2kwe2ly8vh)
- [ ] **Step 1**: Navigate to API Gateway
- [ ] **Step 2**: Select `preprod-safemate-hedera-api`
- [ ] **Step 3**: Configure OPTIONS method
- [ ] **Step 4**: Configure POST method with `preprod-safemate-hedera-service`
- [ ] **Step 5**: Deploy to preprod stage
- **Status**: ⏳ Pending
- **Endpoint**: `https://2kwe2ly8vh.execute-api.ap-southeast-2.amazonaws.com/preprod/`

### Vault API (fg85dzr0ag)
- [ ] **Step 1**: Navigate to API Gateway
- [ ] **Step 2**: Select `preprod-safemate-vault-api`
- [ ] **Step 3**: Configure OPTIONS method
- [ ] **Step 4**: Configure POST method with `preprod-safemate-token-vault`
- [ ] **Step 5**: Deploy to preprod stage
- **Status**: ⏳ Pending
- **Endpoint**: `https://fg85dzr0ag.execute-api.ap-southeast-2.amazonaws.com/preprod/`

### Wallet API (9t9hk461kh)
- [ ] **Step 1**: Navigate to API Gateway
- [ ] **Step 2**: Select `preprod-safemate-wallet-api`
- [ ] **Step 3**: Configure OPTIONS method
- [ ] **Step 4**: Configure POST method with `preprod-safemate-wallet-manager`
- [ ] **Step 5**: Deploy to preprod stage
- **Status**: ⏳ Pending
- **Endpoint**: `https://9t9hk461kh.execute-api.ap-southeast-2.amazonaws.com/preprod/`

### Group API (8a6qaslcbc)
- [ ] **Step 1**: Navigate to API Gateway
- [ ] **Step 2**: Select `preprod-safemate-group-api`
- [ ] **Step 3**: Configure OPTIONS method
- [ ] **Step 4**: Configure POST method with `preprod-safemate-group-manager`
- [ ] **Step 5**: Deploy to preprod stage
- **Status**: ⏳ Pending
- **Endpoint**: `https://8a6qaslcbc.execute-api.ap-southeast-2.amazonaws.com/preprod/`

### Directory API (e3k7nfvzab)
- [ ] **Step 1**: Navigate to API Gateway
- [ ] **Step 2**: Select `preprod-safemate-directory-api`
- [ ] **Step 3**: Configure OPTIONS method
- [ ] **Step 4**: Configure POST method with `preprod-safemate-directory-creator`
- [ ] **Step 5**: Deploy to preprod stage
- **Status**: ⏳ Pending
- **Endpoint**: `https://e3k7nfvzab.execute-api.ap-southeast-2.amazonaws.com/preprod/`

### Onboarding API (ol212feqdl)
- [ ] **Step 1**: Navigate to API Gateway
- [ ] **Step 2**: Select `preprod-safemate-onboarding-api`
- [ ] **Step 3**: Configure OPTIONS method
- [ ] **Step 4**: Configure POST method with `preprod-safemate-user-onboarding`
- [ ] **Step 5**: Deploy to preprod stage
- **Status**: ⏳ Pending
- **Endpoint**: `https://ol212feqdl.execute-api.ap-southeast-2.amazonaws.com/preprod/`

## CORS Headers Reference

For each API's OPTIONS and POST methods, add these integration response headers:

```
Access-Control-Allow-Credentials: 'true'
Access-Control-Allow-Headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token'
Access-Control-Allow-Methods: 'GET,POST,PUT,DELETE,OPTIONS'
Access-Control-Allow-Origin: 'http://localhost:5173'
```

## Verification Commands

After configuring each API, test with:

```bash
# Test CORS preflight
curl -X OPTIONS <API_ENDPOINT>

# Test Lambda integration
curl -X POST <API_ENDPOINT> -H "Content-Type: application/json" -d '{"test": "data"}'
```

## Final Status
- [ ] All 6 preprod APIs configured
- [ ] All APIs have CORS enabled
- [ ] All APIs have Lambda integrations
- [ ] All APIs deployed to preprod stage
- [ ] Ready to update frontend configuration

## Next Steps After Configuration
1. Update frontend environment variables to use preprod endpoints
2. Test the complete preprod environment
3. Verify all Lambda integrations are working correctly
