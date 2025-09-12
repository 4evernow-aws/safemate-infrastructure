# Manual API Gateway Fix Guide

## 🚨 **PROBLEM IDENTIFIED**
The API Gateway `527ye7o1j0` is still pointing to old Lambda functions instead of the new `ultimate-wallet-service`.

## 🛠️ **IMMEDIATE FIX REQUIRED**

### **Step 1: Get Lambda Function ARN**
```powershell
aws lambda get-function --function-name default-safemate-ultimate-wallet --region ap-southeast-2 --query 'Configuration.FunctionArn' --output text
```

### **Step 2: Get API Gateway Resources**
```powershell
aws apigateway get-resources --rest-api-id 527ye7o1j0 --region ap-southeast-2 --output json
```

### **Step 3: Update Each Integration**

#### **Update /onboarding/status (GET)**
```powershell
aws apigateway update-integration --rest-api-id 527ye7o1j0 --resource-id [RESOURCE_ID] --http-method GET --patch-operations op=replace,path=/uri,value="[LAMBDA_ARN]" --region ap-southeast-2
```

#### **Update /onboarding/start (POST)**
```powershell
aws apigateway update-integration --rest-api-id 527ye7o1j0 --resource-id [RESOURCE_ID] --http-method POST --patch-operations op=replace,path=/uri,value="[LAMBDA_ARN]" --region ap-southeast-2
```

#### **Update /onboarding/retry (POST)**
```powershell
aws apigateway update-integration --rest-api-id 527ye7o1j0 --resource-id [RESOURCE_ID] --http-method POST --patch-operations op=replace,path=/uri,value="[LAMBDA_ARN]" --region ap-southeast-2
```

#### **Update /wallet/get (GET)**
```powershell
aws apigateway update-integration --rest-api-id 527ye7o1j0 --resource-id [RESOURCE_ID] --http-method GET --patch-operations op=replace,path=/uri,value="[LAMBDA_ARN]" --region ap-southeast-2
```

#### **Update /wallet/balance (GET)**
```powershell
aws apigateway update-integration --rest-api-id 527ye7o1j0 --resource-id [RESOURCE_ID] --http-method GET --patch-operations op=replace,path=/uri,value="[LAMBDA_ARN]" --region ap-southeast-2
```

#### **Update /wallet/delete (DELETE)**
```powershell
aws apigateway update-integration --rest-api-id 527ye7o1j0 --resource-id [RESOURCE_ID] --http-method DELETE --patch-operations op=replace,path=/uri,value="[LAMBDA_ARN]" --region ap-southeast-2
```

#### **Update /status (GET)**
```powershell
aws apigateway update-integration --rest-api-id 527ye7o1j0 --resource-id [RESOURCE_ID] --http-method GET --patch-operations op=replace,path=/uri,value="[LAMBDA_ARN]" --region ap-southeast-2
```

### **Step 4: Deploy API Gateway**
```powershell
aws apigateway create-deployment --rest-api-id 527ye7o1j0 --stage-name default --region ap-southeast-2
```

## 🎯 **ALTERNATIVE: Use the Automated Script**
Run the automated script instead:
```powershell
.\fix-api-gateway-integration.ps1
```

## ✅ **VERIFICATION**
After the fix, test in browser:
- Open `http://localhost:5173`
- Try wallet creation
- Should work without HTTP 500 errors
