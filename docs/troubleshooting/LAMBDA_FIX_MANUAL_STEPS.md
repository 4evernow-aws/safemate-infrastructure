# 🔧 **MANUAL LAMBDA FIX - KMS Decryption Issue**

## 🎯 **Issue Identified**
The Lambda function is failing because the KMS decryption returns a `Uint8Array` but the code calls `.toString()` which converts it to `"[object Object]"` instead of the actual private key string.

## 🛠️ **Required Fix**

### **Step 1: Update Lambda Function Code**

**Go to AWS Lambda Console:**
1. Open AWS Lambda Console
2. Find function: `dev-safemate-user-onboarding`
3. Go to **Code** tab
4. Find the `decryptPrivateKey` function (around line 89)

**Replace this line:**
```javascript
const privateKeyString = decryptResult.Plaintext.toString();
```

**With this line:**
```javascript
const privateKeyString = Buffer.from(decryptResult.Plaintext).toString('utf-8').trim();
```

### **Step 2: Deploy the Change**
1. Click **Deploy** button in the Lambda console
2. Wait for deployment to complete

### **Step 3: Test Wallet Creation**

Run this PowerShell command to test:

```powershell
$payload = @{
  httpMethod = "POST"
  path = "/onboarding/start"
  requestContext = @{
    authorizer = @{
      claims = @{
        sub = "d95e5448-e0c1-7012-7477-076b14b725b1"
        email = "test@example.com"
      }
    }
  }
} | ConvertTo-Json -Depth 10 -Compress

$payloadBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload))

aws lambda invoke --function-name dev-safemate-user-onboarding --payload $payloadBase64 wallet-test.json
Get-Content wallet-test.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## 🎯 **Expected Result After Fix**

You should see a **200 response** with real Hedera wallet details:

```json
{
  "statusCode": 200,
  "headers": { ... },
  "body": {
    "success": true,
    "message": "Real Hedera wallet created successfully",
    "hasWallet": true,
    "wallet": {
      "wallet_id": "wallet-...",
      "hedera_account_id": "0.0.XXXXXXX",
      "public_key": "302a300506032b6570032100...",
      "account_type": "personal",
      "network": "testnet",
      "initial_balance_hbar": "0.1",
      "needs_funding": false,
      "created_by_operator": true,
      "transaction_id": "..."
    }
  }
}
```

## 🧪 **Test Frontend After Fix**

1. **Start your dev server**: `npm run dev` (from safemate directory)
2. **Open browser**: `http://localhost:5173`
3. **Sign in** with your account
4. **Try wallet creation** - should now work with real Hedera integration!

## 📊 **What This Fixes**

- ✅ **500 Internal Server Error** will be resolved
- ✅ **Real Hedera testnet wallets** will be created
- ✅ **Wallet data** will be stored in DynamoDB
- ✅ **Frontend** will show real wallet instead of mock data

## 🔍 **If Still Having Issues**

If you still get errors after this fix, check:

1. **CloudWatch Logs**: `/aws/lambda/dev-safemate-user-onboarding`
2. **DynamoDB Tables**: Verify operator credentials are stored correctly
3. **KMS Permissions**: Ensure Lambda role has decrypt permissions

---

**This is the final fix needed for real Hedera wallet creation!** 🚀
