# Update Hedera Operator Wallet to Real Testnet Account

## 🔍 **Current Operator Credentials**

**Account ID**: `0.0.6428427`  
**Network**: `testnet`  
**Key Type**: `ED25519`  
**Status**: Currently active in DynamoDB

## 🔧 **Steps to Update to Real Testnet Wallet**

### **Step 1: Prepare Your Real Testnet Account**

You need:
1. **Real testnet account ID** (e.g., `0.0.XXXXXXX`)
2. **Private key** for that account (PEM file or raw bytes)
3. **Public key** (can be derived from private key)

### **Step 2: Encrypt the Private Key**

The private key needs to be encrypted using the KMS key `alias/safemate-master-key-dev` before storing in DynamoDB.

### **Step 3: Update DynamoDB**

Replace the current operator credentials with your real testnet account.

## 📋 **Required Information**

Please provide:

1. **Real Testnet Account ID**: `0.0.XXXXXXX`
2. **Private Key File Path**: Path to your PEM file or private key
3. **Network**: Should be `testnet`

## 🔧 **Update Commands**

Once you provide the account details, I'll help you:

1. **Encrypt the private key** using KMS
2. **Update the DynamoDB record** with new credentials
3. **Verify the update** worked correctly

## 🚨 **Important Notes**

- **Backup**: Make sure you have a backup of your real testnet private key
- **Testnet Only**: This should only be used for testnet, never mainnet
- **Security**: The private key will be encrypted with KMS before storage
- **Testing**: After update, test wallet creation to ensure it works

## 🎯 **Next Steps**

Please provide:
1. Your real testnet account ID
2. The private key (or path to PEM file)

Then I'll help you update the operator credentials in DynamoDB.
