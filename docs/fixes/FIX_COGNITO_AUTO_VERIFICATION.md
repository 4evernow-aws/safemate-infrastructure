# 🔧 Fix Cognito Auto Verification Issue - Preprod

## **Issue:** 
Still getting "Cannot resend codes. Auto verification not turned on" error in preprod environment.

## **Root Cause:**
The Cognito User Pool configuration changes may not have been fully applied to the preprod environment, or there's a caching issue.

## **✅ Solution: Redeploy Preprod Environment**

### **Step 1: Force Redeploy Cognito Configuration**

```powershell
# Navigate to infrastructure directory
cd d:\safemate-infrastructure\terraform

# Set environment to preprod
$env:TF_VAR_environment = "preprod"

# Force refresh and apply
terraform refresh
terraform plan -var-file="preprod.tfvars"
terraform apply -var-file="preprod.tfvars" -auto-approve
```

### **Step 2: Verify Cognito Configuration**

```powershell
# Check the actual Cognito User Pool configuration
aws cognito-idp describe-user-pool --user-pool-id ap-southeast-2_pMo5BXFiM --region ap-southeast-2

# Look for this in the output:
# "AutoVerifiedAttributes": ["email"]
```

### **Step 3: Alternative - Manual AWS CLI Fix**

If Terraform doesn't work, manually update the User Pool:

```powershell
# Update the User Pool to ensure auto verification is enabled
aws cognito-idp update-user-pool \
  --user-pool-id ap-southeast-2_pMo5BXFiM \
  --region ap-southeast-2 \
  --auto-verified-attributes email
```

### **Step 4: Clear Any Caching Issues**

```powershell
# Force update the User Pool Client
aws cognito-idp update-user-pool-client \
  --user-pool-id ap-southeast-2_pMo5BXFiM \
  --client-id 1a0trpjfgv54odl9csqlcbkuii \
  --region ap-southeast-2 \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_ADMIN_USER_PASSWORD_AUTH ALLOW_USER_PASSWORD_AUTH
```

### **Step 5: Test the Fix**

1. **Clear browser cache** completely
2. **Try the email verification flow** again
3. **Check for the error** - it should be resolved

## **🚀 Quick Fix Script**

Create and run this PowerShell script:

```powershell
# Quick fix for Cognito auto verification
Write-Host "🔧 Fixing Cognito Auto Verification..." -ForegroundColor Green

# Set environment
$env:TF_VAR_environment = "preprod"
$USER_POOL_ID = "ap-southeast-2_pMo5BXFiM"
$CLIENT_ID = "1a0trpjfgv54odl9csqlcbkuii"

# Navigate to terraform
Set-Location "d:\safemate-infrastructure\terraform"

# Force apply
Write-Host "Applying Terraform changes..." -ForegroundColor Yellow
terraform apply -var-file="preprod.tfvars" -auto-approve

# Verify configuration
Write-Host "Verifying Cognito configuration..." -ForegroundColor Yellow
$userPool = aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region ap-southeast-2 --output json | ConvertFrom-Json
$autoVerified = $userPool.UserPool.AutoVerifiedAttributes

if ($autoVerified -contains "email") {
    Write-Host "✅ Auto verification is enabled for email" -ForegroundColor Green
} else {
    Write-Host "❌ Auto verification not enabled - applying manual fix..." -ForegroundColor Red
    aws cognito-idp update-user-pool --user-pool-id $USER_POOL_ID --region ap-southeast-2 --auto-verified-attributes email
}

Write-Host "🎯 Fix complete! Please test the email verification flow." -ForegroundColor Green
```

## **🔍 Verification Steps**

After applying the fix:

1. **Open preprod frontend**: http://preprod-safemate-static-hosting.s3-website-ap-southeast-2.amazonaws.com
2. **Try to sign in** with an existing account
3. **Request verification code** - should work without the error
4. **Check browser console** for any remaining errors

## **⚠️ If Issue Persists**

If you still get the error after redeployment:

1. **Check CloudWatch logs** for any Lambda errors
2. **Verify the frontend is using correct API endpoints**
3. **Clear all browser data** (cookies, cache, local storage)
4. **Try in incognito/private mode**

## **📊 Expected Result**

- ✅ No more "Auto verification not turned on" error
- ✅ Email verification codes sent successfully
- ✅ Users can complete verification process
- ✅ All preprod services working normally

---

*This fix addresses the persistent Cognito auto-verification issue by ensuring the configuration is properly applied to the preprod environment.*

