# Secrets Manager Removal - KMS + DynamoDB Migration

## Overview

This document outlines the removal of AWS Secrets Manager from the SafeMate infrastructure and the migration to a KMS + DynamoDB approach for secure data storage.

## Why Remove Secrets Manager?

### Free Tier Compliance
- **Cost**: Secrets Manager charges $0.40 per secret per month + $0.05 per 10,000 API calls
- **Free Tier**: Only 30 days free trial, then charges apply
- **Alternative**: KMS + DynamoDB stays within Free Tier limits

### Simplified Architecture
- **Fewer Services**: Reduces complexity by removing one AWS service
- **Direct Control**: KMS + DynamoDB provides direct control over encryption and storage
- **Consistency**: All data (user data, metadata, secrets) stored in DynamoDB

## New Architecture: KMS + DynamoDB

### How It Works

1. **Encryption**: All sensitive data encrypted using AWS KMS
2. **Storage**: Encrypted data stored in DynamoDB tables
3. **Access**: Lambda functions decrypt data using KMS when needed
4. **Security**: KMS handles key rotation and access control

### Data Storage Strategy

#### DynamoDB Tables for Secrets
- **`wallet_keys`**: Encrypted private keys for user wallets
- **`user_secrets`**: Other encrypted user secrets
- **`wallet_metadata`**: Wallet information and metadata

#### KMS Integration
- **Master Key**: `alias/safemate-master-key-dev`
- **Encryption**: All sensitive data encrypted before storage
- **Decryption**: Data decrypted in Lambda functions when needed

## Migration Details

### Removed Components
- ✅ `secrets_manager.tf` - Deleted
- ✅ Secrets Manager IAM policies - Removed
- ✅ Secrets Manager CloudWatch alarms - Removed

### Updated Components
- ✅ Lambda functions now use KMS + DynamoDB
- ✅ IAM policies updated for KMS access
- ✅ Documentation updated

### Environment Variables
Lambda functions now use these environment variables:
```bash
WALLET_KMS_KEY_ID=arn:aws:kms:region:account:key/key-id
WALLET_KEYS_TABLE=preprod-safemate-wallet-keys
WALLET_METADATA_TABLE=preprod-safemate-wallet-metadata
```

## Security Benefits

### Enhanced Security
- **KMS Encryption**: Industry-standard encryption with automatic key rotation
- **IAM Integration**: Fine-grained access control through IAM policies
- **Audit Trail**: CloudTrail logs all KMS operations
- **No Plain Text**: No sensitive data stored in plain text anywhere

### Cost Benefits
- **Free Tier**: KMS provides 20,000 requests/month free
- **DynamoDB**: 25GB storage free
- **No Monthly Fees**: No per-secret monthly charges

## Implementation Status

### ✅ Completed
- [x] Removed `secrets_manager.tf`
- [x] Updated Lambda functions to use KMS + DynamoDB
- [x] Updated documentation
- [x] Updated README.md
- [x] Fixed user-onboarding service 502 errors

### 🔄 In Progress
- [ ] Deploy updated Lambda functions
- [ ] Test wallet creation functionality
- [ ] Verify all services work without Secrets Manager

### 📋 Next Steps
- [ ] Configure operator credentials in KMS
- [ ] Enable real Hedera integration
- [ ] Remove mock wallet creation

## Code Examples

### Encrypting Data with KMS
```javascript
const encryptCommand = new EncryptCommand({
  KeyId: WALLET_KMS_KEY_ID,
  Plaintext: sensitiveData
});
const encryptResult = await kms.send(encryptCommand);
const encryptedData = encryptResult.CiphertextBlob.toString('base64');
```

### Decrypting Data with KMS
```javascript
const decryptCommand = new DecryptCommand({
  KeyId: WALLET_KMS_KEY_ID,
  CiphertextBlob: Buffer.from(encryptedData, 'base64')
});
const decryptResult = await kms.send(decryptCommand);
const decryptedData = Buffer.from(decryptResult.Plaintext).toString();
```

### Storing in DynamoDB
```javascript
await dynamodbDoc.send(new PutCommand({
  TableName: WALLET_KEYS_TABLE,
  Item: {
    user_id: userId,
    encrypted_private_key: encryptedData,
    kms_key_id: WALLET_KMS_KEY_ID,
    created_at: new Date().toISOString()
  }
}));
```

## Monitoring and Alerts

### CloudWatch Metrics
- **KMS Usage**: Monitor encryption/decryption operations
- **DynamoDB**: Monitor read/write capacity and throttling
- **Lambda**: Monitor function execution and errors

### Cost Monitoring
- **KMS Costs**: Track encryption/decryption costs
- **DynamoDB Costs**: Monitor storage and request costs
- **Free Tier Usage**: Ensure staying within limits

## Rollback Plan

If issues arise, the rollback plan includes:
1. Restore `secrets_manager.tf` from git history
2. Re-run Terraform apply
3. Update Lambda functions to use Secrets Manager
4. Migrate data back to Secrets Manager

## Conclusion

The migration from Secrets Manager to KMS + DynamoDB provides:
- **Cost Savings**: Stays within Free Tier limits
- **Simplified Architecture**: Fewer AWS services to manage
- **Enhanced Security**: Better encryption and access control
- **Consistency**: All data stored in DynamoDB

This change aligns with SafeMate's goal of maintaining Free Tier compliance while providing enterprise-grade security.

---

**Last Updated**: September 18, 2025  
**Status**: Completed  
**Environment**: Preprod (ap-southeast-2)
