# Lambda Deployment Package Size Solution

## Problem Summary
- **Original package size**: 186.66 MB (19,600 files)
- **Lambda limit**: 50 MB (uncompressed) / 250 MB (compressed)
- **Main culprit**: Hedera SDK pulling in React Native dependencies (71.99 MB)

## Root Cause Analysis
The `@hashgraph/sdk` dependency was pulling in unnecessary React Native dependencies:
- `react-native` (71.99 MB)
- `@react-native` (17.6 MB) 
- `react-devtools-core` (16.18 MB)
- `@babel` (8.81 MB)

These are not needed for a Lambda function running in a Node.js environment.

## Solution: Lambda Layer Architecture

### 1. Minimal Lambda Package (5.26 MB)
**Location**: `lambda-minimal/`
**Contents**:
- `index.js` - Main Lambda function
- `package.json` - Dependencies (AWS SDK only)
- `node_modules/@aws-sdk/` - AWS SDK packages only

**Size**: 5.26 MB (well under 50MB limit)

### 2. Hedera SDK Lambda Layer
**Location**: `hedera-layer/`
**Contents**:
- `@hashgraph/sdk` and dependencies
- Excludes React Native dependencies

**Size**: ~25-30 MB (acceptable for Lambda layer)

## Deployment Strategy

### Option 1: Deploy Without Hedera SDK (Immediate)
1. Use the minimal package (`lambda-minimal/`)
2. Deploy to Lambda function
3. Function will return error when Hedera SDK is needed
4. Add Hedera SDK layer later

### Option 2: Deploy With Hedera SDK Layer (Recommended)
1. Create Hedera SDK layer
2. Deploy minimal package to Lambda function
3. Attach Hedera SDK layer to function
4. Full functionality available

## Files Created

### Core Files
- `index.js` - Original Lambda function with Hedera SDK
- `index-without-hedera.js` - Modified version for layer architecture
- `package.json` - Original dependencies
- `package-minimal.json` - Minimal dependencies (AWS SDK only)

### Deployment Packages
- `lambda-minimal/` - Minimal deployment package (5.26 MB)
- `user-onboarding-minimal.zip` - Compressed minimal package
- `hedera-layer/` - Hedera SDK layer directory

### Scripts
- `create-minimal-package.ps1` - Creates minimal package
- `deploy-optimized.ps1` - Creates optimized deployment
- `create-hedera-layer.ps1` - Creates Hedera SDK layer

## Next Steps

### Immediate Deployment
1. **Deploy minimal package**:
   ```bash
   aws lambda update-function-code \
     --function-name preprod-safemate-user-onboarding \
     --zip-file fileb://user-onboarding-minimal.zip
   ```

2. **Test function**:
   - Status endpoint should work
   - Start endpoint will return "Hedera SDK not available" error

### Full Deployment with Layer
1. **Create Hedera SDK layer**:
   ```bash
   aws lambda publish-layer-version \
     --layer-name hedera-sdk-layer \
     --zip-file fileb://hedera-sdk-layer.zip \
     --compatible-runtimes nodejs18.x
   ```

2. **Attach layer to function**:
   ```bash
   aws lambda update-function-configuration \
     --function-name preprod-safemate-user-onboarding \
     --layers arn:aws:lambda:ap-southeast-2:ACCOUNT:layer:hedera-sdk-layer:1
   ```

3. **Update function code**:
   ```bash
   aws lambda update-function-code \
     --function-name preprod-safemate-user-onboarding \
     --zip-file fileb://user-onboarding-minimal.zip
   ```

## Benefits of This Solution

1. **Size Compliance**: Package is now 5.26 MB (vs 186.66 MB)
2. **Fast Deployment**: Minimal package deploys quickly
3. **Modular Architecture**: Hedera SDK can be updated independently
4. **Cost Effective**: Smaller package = faster cold starts
5. **Maintainable**: Clear separation of concerns

## Environment Variables Required
- `WALLET_METADATA_TABLE`
- `WALLET_KEYS_TABLE` 
- `WALLET_KMS_KEY_ID`
- `OPERATOR_PRIVATE_KEY_KMS_KEY_ID`
- `OPERATOR_ACCOUNT_ID`
- `OPERATOR_PRIVATE_KEY_ENCRYPTED`
- `HEDERA_NETWORK`
- `AWS_REGION`

## Testing
1. Deploy minimal package first
2. Test status endpoint (should work)
3. Test start endpoint (should return SDK missing error)
4. Deploy Hedera SDK layer
5. Test start endpoint (should create real Hedera wallets)

## Status
✅ **Package size issue resolved**
✅ **Minimal deployment package created (5.26 MB)**
✅ **Lambda layer architecture designed**
⏳ **Ready for deployment**
