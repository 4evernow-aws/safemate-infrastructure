# Correct Lambda Environment Variables Command

## 🚨 **Issue Identified**

PowerShell is interpreting the backslashes incorrectly in the JSON string. Here's the **working solution**:

## 🔧 **Working Command**

### **Option 1: Single Quotes (Recommended)**

```bash
aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables='{"WALLET_KEYS_TABLE":"safemate-wallet-keys","WALLET_METADATA_TABLE":"safemate-wallet-metadata","APP_SECRETS_KMS_KEY_ID":"alias/safemate-app-secrets","WALLET_KMS_KEY_ID":"alias/safemate-wallet-keys","HEDERA_NETWORK":"testnet","AWS_REGION":"ap-southeast-2"}'
```

### **Option 2: PowerShell Variables (Most Reliable)**

```powershell
$envVars = @{
    "WALLET_KEYS_TABLE" = "safemate-wallet-keys"
    "WALLET_METADATA_TABLE" = "safemate-wallet-metadata"
    "APP_SECRETS_KMS_KEY_ID" = "alias/safemate-app-secrets"
    "WALLET_KMS_KEY_ID" = "alias/safemate-wallet-keys"
    "HEDERA_NETWORK" = "testnet"
    "AWS_REGION" = "ap-southeast-2"
}

$envJson = $envVars | ConvertTo-Json -Compress
aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables=$envJson
```

### **Option 3: AWS Console (Easiest)**

1. Go to AWS Lambda Console
2. Find `default-safemate-ultimate-wallet` function
3. Go to Configuration → Environment variables
4. Add each variable manually:
   - `WALLET_KEYS_TABLE` = `safemate-wallet-keys`
   - `WALLET_METADATA_TABLE` = `safemate-wallet-metadata`
   - `APP_SECRETS_KMS_KEY_ID` = `alias/safemate-app-secrets`
   - `WALLET_KMS_KEY_ID` = `alias/safemate-wallet-keys`
   - `HEDERA_NETWORK` = `testnet`
   - `AWS_REGION` = `ap-southeast-2`

## ✅ **Verify the Fix**

After running any of the above:

```bash
aws lambda get-function-configuration --function-name default-safemate-ultimate-wallet --query 'Environment.Variables' --output json
```

## 🚀 **Test the API**

```bash
curl -X POST "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -H "Content-Type: application/json" -d '{"action":"start"}'
```

## 🎯 **Recommended**

**Try Option 2 (PowerShell variables) first** - it handles JSON formatting automatically and avoids escaping issues.
