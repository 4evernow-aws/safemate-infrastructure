# DynamoDB Verification Checklist - Critical for Wallet Creation

## 🔍 **Critical Issue Identified**

The `ultimate-wallet-service` Lambda function expects these DynamoDB tables to exist:
- **`safemate-wallet-keys`** (or `default-safemate-wallet-keys`)
- **`safemate-wallet-metadata`** (or `default-safemate-wallet-metadata`)

**Most importantly**: The Lambda function expects to find **Hedera operator credentials** in the wallet-keys table.

## 📋 **Verification Checklist**

### **1. Check DynamoDB Tables Exist**

#### **Option A: Check with `safemate-` prefix**
```bash
aws dynamodb describe-table --table-name safemate-wallet-keys
aws dynamodb describe-table --table-name safemate-wallet-metadata
```

#### **Option B: Check with `default-safemate-` prefix**
```bash
aws dynamodb describe-table --table-name default-safemate-wallet-keys
aws dynamodb describe-table --table-name default-safemate-wallet-metadata
```

#### **Option C: List all tables**
```bash
aws dynamodb list-tables --query 'TableNames[?contains(@, `wallet`) || contains(@, `safemate`)]' --output table
```

### **2. Check Hedera Operator Credentials**

If the tables exist, check for the critical operator credentials:

#### **Check for Hedera Operator in wallet-keys table**
```bash
# For safemate-wallet-keys table
aws dynamodb get-item \
  --table-name safemate-wallet-keys \
  --key '{"user_id":{"S":"hedera_operator"}}'

# For default-safemate-wallet-keys table
aws dynamodb get-item \
  --table-name default-safemate-wallet-keys \
  --key '{"user_id":{"S":"hedera_operator"}}'
```

### **3. Expected Data Structure**

The Lambda function expects this data in the wallet-keys table:

```json
{
  "user_id": "hedera_operator",
  "account_id": "0.0.XXXXXX",
  "encrypted_private_key": "base64_encrypted_key"
}
```

## 🚨 **Critical Findings**

### **Issue 1: Table Name Mismatch**
The Lambda function environment variables are set to:
- `WALLET_KEYS_TABLE`: `safemate-wallet-keys`
- `WALLET_METADATA_TABLE`: `safemate-wallet-metadata`

But the AWS services mapping shows tables with `default-safemate-` prefix:
- `default-safemate-wallet-keys`
- `default-safemate-wallet-metadata`

### **Issue 2: Missing Hedera Operator Credentials**
The Lambda function will fail during initialization if it cannot find:
- **Key**: `user_id = "hedera_operator"`
- **Value**: `account_id` and `encrypted_private_key`

## 🔧 **Required Actions**

### **Action 1: Fix Environment Variables**
Update the Lambda function to use the correct table names:

```json
{
  "WALLET_KEYS_TABLE": "default-safemate-wallet-keys",
  "WALLET_METADATA_TABLE": "default-safemate-wallet-metadata"
}
```

### **Action 2: Create Hedera Operator Credentials**
If the operator credentials don't exist, they need to be created:

1. **Generate Hedera testnet account** (if not exists)
2. **Encrypt the private key** using KMS
3. **Store in DynamoDB** with key `user_id = "hedera_operator"`

### **Action 3: Verify Table Structure**
Ensure the tables have the correct schema:
- **Primary Key**: `user_id` (String)
- **Sort Key**: None (Simple key structure)

## 🎯 **Next Steps**

### **Immediate Actions Required:**

1. **Run the verification commands** above to check table existence
2. **Check for Hedera operator credentials** in the wallet-keys table
3. **Update Lambda environment variables** if table names are different
4. **Create Hedera operator credentials** if they don't exist

### **Expected Results:**

✅ **Tables exist** with correct names
✅ **Hedera operator credentials** found in wallet-keys table
✅ **Lambda environment variables** point to correct tables
✅ **KMS encryption** working for operator credentials

## 🚀 **Status**

**🔄 PENDING VERIFICATION**: DynamoDB tables and Hedera operator credentials

**This is the critical missing piece** that will prevent wallet creation from working!

**Next**: Run the verification commands to identify exactly what's missing.
