# Manual Commands for Testing and Fixing Lambda Function

## 🔧 **Step-by-Step Manual Commands**

### **Step 1: Test Current Lambda Function**

Create test payload:
```powershell
@'
{
  "httpMethod": "GET",
  "path": "/onboarding/status",
  "headers": {
    "Authorization": "Bearer test"
  }
}
'@ | Out-File -FilePath "test-payload.json" -Encoding UTF8
```

Test Lambda function:
```powershell
aws lambda invoke --function-name "default-safemate-ultimate-wallet" --payload "file://test-payload.json" --region "ap-southeast-2" test-response.json
```

Check response:
```powershell
Get-Content test-response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### **Step 2: Deploy Updated Lambda Function**

Navigate to Lambda directory:
```powershell
cd services/ultimate-wallet-service
```

Install dependencies:
```powershell
npm install
```

Create deployment package:
```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFile = "ultimate-wallet-service-$timestamp.zip"
Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath $zipFile -Force
```

Deploy to AWS:
```powershell
aws lambda update-function-code --function-name "default-safemate-ultimate-wallet" --zip-file "fileb://$zipFile" --region "ap-southeast-2"
```

Clean up:
```powershell
Remove-Item $zipFile -Force
cd ../..
```

### **Step 3: Test Again**

Test the updated Lambda function:
```powershell
aws lambda invoke --function-name "default-safemate-ultimate-wallet" --payload "file://test-payload.json" --region "ap-southeast-2" test-response.json
```

Check the response:
```powershell
Get-Content test-response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### **Step 4: Test in Browser**

1. Open your browser to `http://localhost:5173`
2. Try the wallet creation process
3. Check the browser console for detailed error messages

## 🎯 **Expected Results**

After the fix:
- **Detailed error messages** instead of generic "Internal server error"
- **Specific error information** to identify the exact issue
- **Better debugging information** in CloudWatch logs

## 🔍 **If You Still Get Errors**

1. **Check CloudWatch Logs**:
   - Go to AWS Console → CloudWatch → Log Groups
   - Find `/aws/lambda/default-safemate-ultimate-wallet`
   - Look for detailed error information

2. **Common Issues**:
   - **KMS Key**: Check if `alias/safemate-master-key-dev` exists
   - **DynamoDB**: Check if tables exist and Lambda has permissions
   - **Hedera**: Check if operator account `0.0.6428427` exists

3. **Share Error Details**:
   - Copy the detailed error message from the response
   - Share CloudWatch log entries
   - Share browser console errors

## 📞 **Quick Fix Script**

If you prefer to run the automated script:
```powershell
.\test-and-fix-lambda.ps1
```

**The main goal is to get detailed error information so we can fix the specific issue causing the 500 errors.**
