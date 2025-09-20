# SafeMate Operator Credentials Configuration

**⚠️ IMPORTANT: SafeMate operates under a strict NO MOCK WALLETS policy. Only real Hedera testnet wallets are created.**

## 🔐 **Hedera Operator Account Details**

### **Account Information**
- **Account ID**: `0.0.6428427`
- **Network**: Hedera Testnet
- **Status**: ✅ Active and configured
- **Purpose**: Fund new user wallets during onboarding

### **Key Information**
- **DER Encoded Private Key**: `302e020100300506032b657004220420a74b2a24706db9034445e6e03a0f3fd7a82a926f6c4a95bc5de9a720d453f9f9`
- **DER Encoded Public Key**: `302a300506032b6570032100c5712af6c6211bd23fbd24ca2d3440938aa7ed958750f5064be8817072283a`
- **Key Type**: Ed25519
- **Encryption**: ✅ Encrypted with AWS KMS

### **AWS KMS Encryption**
- **KMS Key ID**: `arn:aws:kms:ap-southeast-2:994220462693:key/3b18b0c0-dd1f-41db-8bac-6ec857c1ed05`
- **Encrypted Private Key**: `AQICAHgUtdmQXEUFoyM2NR2tvylEt/FUkRWpR0fCQW5e6oKOEwFBXoYt2q/MBWlgTgH53gbzAAAAqjCBpwYJKoZIhvcNAQcGoIGZMIGWAgEAMIGQBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDCF4HNZDPzHBF8EiSgIBEIBjfTpyl5kyNAR5FK+H4ih2BMSO+l9++LdfUzFqwiH84Xs+muDN8eVBVhgp+mIhPi7GBcqZmf29/IjynqO8Q+xhqfhhwCblLKudCSiln3ZrEg0kx+OJLvJBhk3yql7LV0ra4F2d`
- **Encryption Status**: ✅ Secure

### **Environment Configuration**
- **Lambda Function**: `preprod-safemate-user-onboarding`
- **Environment Variables**:
  - `OPERATOR_ACCOUNT_ID`: `0.0.6428427`
  - `OPERATOR_PRIVATE_KEY_ENCRYPTED`: [KMS Encrypted Value]
  - `OPERATOR_PRIVATE_KEY_KMS_KEY_ID`: [KMS Key ARN]

### **Functionality**
- **Initial Funding**: ✅ Can fund new user wallets with 0.1 HBAR
- **Account Creation**: ✅ Can create new Hedera accounts on testnet
- **Transaction Signing**: ✅ Can sign transactions for new account creation
- **Fallback Mode**: ✅ System works without operator (creates unfunded accounts)

### **Security Features**
- **Private Key Protection**: ✅ Never stored in plain text
- **KMS Encryption**: ✅ Encrypted at rest with AWS KMS
- **Access Control**: ✅ Only Lambda function can decrypt
- **Audit Trail**: ✅ All operations logged in CloudWatch

### **Usage in Application**
1. **Wallet Creation**: When a user creates a wallet, the operator account funds it with 0.1 HBAR
2. **Account Creation**: The operator account signs the account creation transaction
3. **Initial Balance**: New accounts start with 0.1 HBAR for immediate use
4. **Graceful Fallback**: If operator credentials fail, system creates unfunded accounts

### **Monitoring**
- **CloudWatch Logs**: All operator operations are logged
- **Error Handling**: Graceful fallback if operator credentials are unavailable
- **Balance Monitoring**: Monitor operator account balance for funding capacity

### **Last Updated**
- **Date**: September 19, 2025
- **Environment**: Preprod (ap-southeast-2)
- **Status**: ✅ Active and operational

---

## 🔧 **Technical Implementation**

### **Lambda Function Integration**
```javascript
// Operator credentials are automatically decrypted from KMS
const { privateKey, accountId } = await getOperatorCredentials();

// Used for funding new accounts
const initialBalance = 0.1; // HBAR
const transaction = new AccountCreateTransaction()
  .setKey(newAccountPublicKey)
  .setInitialBalance(new Hbar(initialBalance));
```

### **KMS Decryption Process**
1. Lambda function receives encrypted private key from environment
2. KMS decrypts the private key using the configured KMS key
3. Private key is used to sign Hedera transactions
4. Private key is never stored in memory after use

### **Error Handling**
- If operator credentials fail to decrypt, system falls back to unfunded account creation
- All errors are logged for debugging
- User experience is not impacted by operator credential issues

---

*This document contains sensitive information and should be kept secure. The operator account is used for funding new user wallets on the Hedera testnet.*
