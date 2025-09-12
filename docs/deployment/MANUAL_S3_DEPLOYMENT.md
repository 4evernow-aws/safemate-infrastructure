# Manual S3 Deployment Commands

## 🔧 **Deploy Lambda Function via S3 (Large Package)**

The deployment package is 61MB, which exceeds the 50MB direct upload limit. We need to use S3.

### **Step 1: Create S3 Bucket**
```powershell
# Navigate to Lambda directory
cd services/ultimate-wallet-service

# Create a unique S3 bucket name
$bucketName = "safemate-lambda-deployments-$(Get-Random -Minimum 1000 -Maximum 9999)"
echo "Using bucket: $bucketName"

# Create S3 bucket
aws s3 mb s3://$bucketName --region ap-southeast-2
```

### **Step 2: Upload Package to S3**
```powershell
# Upload the zip file to S3
aws s3 cp ultimate-wallet-service-20250824-124152.zip s3://$bucketName/ultimate-wallet-service-20250824-124152.zip
```

### **Step 3: Deploy Lambda from S3**
```powershell
# Deploy Lambda function from S3
aws lambda update-function-code --function-name default-safemate-ultimate-wallet --s3-bucket $bucketName --s3-key ultimate-wallet-service-20250824-124152.zip --region ap-southeast-2
```

### **Step 4: Clean Up S3**
```powershell
# Remove the S3 bucket
aws s3 rb s3://$bucketName --force
```

### **Step 5: Test the Fix**
```powershell
# Go back to root directory
cd ../..

# Test the Lambda function
.\test-lambda-working.ps1
```

## 🎯 **Expected Results**
After deployment:
- **Lambda function** will have the missing `@smithy/util-middleware` dependency
- **HTTP 500 errors** should be resolved
- **Wallet creation** should work properly

## 📞 **Quick Fix Script**
If you prefer to run the automated script:
```powershell
.\deploy-via-s3.ps1
```

**The main goal is to deploy the large package via S3 to fix the missing dependency issue.**
