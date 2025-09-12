# Corrected Lambda Environment Variables Command

## 🚨 **JSON Formatting Issue Fixed**

The AWS CLI command needs proper JSON formatting. Here are the correct commands:

## 🔧 **Option 1: Single Line Command (Recommended)**

```bash
aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables='{"WALLET_KEYS_TABLE":"safemate-wallet-keys","WALLET_METADATA_TABLE":"safemate-wallet-metadata","APP_SECRETS_KMS_KEY_ID":"alias/safemate-app-secrets","WALLET_KMS_KEY_ID":"alias/safemate-wallet-keys","HEDERA_NETWORK":"testnet","AWS_REGION":"ap-southeast-2"}'
```

## 🔧 **Option 2: Multi-line Command**

```bash
aws lambda update-function-configuration \
  --function-name default-safemate-ultimate-wallet \
  --environment Variables='{"WALLET_KEYS_TABLE":"safemate-wallet-keys","WALLET_METADATA_TABLE":"safemate-wallet-metadata","APP_SECRETS_KMS_KEY_ID":"alias/safemate-app-secrets","WALLET_KMS_KEY_ID":"alias/safemate-wallet-keys","HEDERA_NETWORK":"testnet","AWS_REGION":"ap-southeast-2"}'
```

## 🔧 **Option 3: Using JSON File (Most Reliable)**

Create a file called `env-vars.json`:

```json
{
  "WALLET_KEYS_TABLE": "safemate-wallet-keys",
  "WALLET_METADATA_TABLE": "safemate-wallet-metadata",
  "APP_SECRETS_KMS_KEY_ID": "alias/safemate-app-secrets",
  "WALLET_KMS_KEY_ID": "alias/safemate-wallet-keys",
  "HEDERA_NETWORK": "testnet",
  "AWS_REGION": "ap-southeast-2"
}
```

Then run:

```bash
aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables=file://env-vars.json
```

## 🔧 **Option 4: PowerShell Command**

If you're using PowerShell, use this format:

```powershell
aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables='{\"WALLET_KEYS_TABLE\":\"safemate-wallet-keys\",\"WALLET_METADATA_TABLE\":\"safemate-wallet-metadata\",\"APP_SECRETS_KMS_KEY_ID\":\"alias/safemate-app-secrets\",\"WALLET_KMS_KEY_ID\":\"alias/safemate-wallet-keys\",\"HEDERA_NETWORK\":\"testnet\",\"AWS_REGION\":\"ap-southeast-2\"}'
```

## 🎯 **Recommended: Use Option 3 (JSON File)**

This is the most reliable method:

1. Create `env-vars.json` with the content above
2. Run: `aws lambda update-function-configuration --function-name default-safemate-ultimate-wallet --environment Variables=file://env-vars.json`

## ✅ **Verify the Fix**

After running the command, verify it worked:

```bash
aws lambda get-function-configuration --function-name default-safemate-ultimate-wallet --query 'Environment.Variables' --output json
```

## 🚀 **Test the API**

Then test your frontend or run:

```bash
curl -X POST "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/onboarding/start" -H "Content-Type: application/json" -d '{"action":"start"}'
```
