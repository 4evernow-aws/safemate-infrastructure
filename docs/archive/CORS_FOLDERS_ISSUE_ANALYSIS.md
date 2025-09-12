# CORS Issue Analysis: /folders Endpoint

## 🚨 **Current Issue**

### **Error Message:**
```
Access to fetch at 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/folders' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

### **Affected Endpoint:**
- **URL**: `https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/folders`
- **Method**: GET
- **Origin**: `http://localhost:5173`
- **API Gateway ID**: `527ye7o1j0`

---

## 🔍 **Root Cause Analysis**

### **1. CORS Preflight Request Failure**
The browser sends an OPTIONS request (preflight) before the actual GET request, but the API Gateway is not properly configured to handle OPTIONS requests for the `/folders` endpoint.

### **2. Missing OPTIONS Method Configuration**
- The `/folders` endpoint has GET and POST methods configured
- The OPTIONS method either doesn't exist or is not properly configured with CORS headers
- API Gateway needs to return proper CORS headers for preflight requests

### **3. Lambda Function CORS Headers**
The Lambda function (`ultimate-wallet-service`) has CORS headers configured, but they're not being returned for OPTIONS requests because the request never reaches the Lambda function.

---

## 🏗️ **Current Architecture**

### **API Gateway Configuration:**
```
API ID: 527ye7o1j0
Stage: default
Resources:
  - /folders (GET, POST) ✅
  - /folders (OPTIONS) ❌ Missing or misconfigured
```

### **Lambda Function:**
```
Function: default-safemate-ultimate-wallet
Handler: index.js
CORS Headers: ✅ Configured in Lambda
```

### **Frontend Service:**
```
Service: HederaApiService
URL: https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/folders
Origin: http://localhost:5173
```

---

## 🛠️ **Solution Options**

### **Option 1: AWS CLI Direct Fix (Recommended)**
Use the provided PowerShell script to configure the OPTIONS method for `/folders`:

```powershell
.\scripts\fix-folders-cors.ps1
```

**This script will:**
1. Find the `/folders` resource ID
2. Create/configure OPTIONS method
3. Set up Mock integration for OPTIONS
4. Configure CORS headers in method response
5. Configure CORS header values in integration response
6. Deploy the API
7. Test the CORS configuration

### **Option 2: AWS Console Manual Fix**
1. Go to API Gateway Console
2. Select API: `default-safemate-onboarding-api`
3. Find `/folders` resource
4. Create OPTIONS method
5. Configure Mock integration
6. Add CORS headers
7. Deploy API

### **Option 3: Terraform Update**
Update the Terraform configuration to include proper OPTIONS method for `/folders`.

---

## 📋 **Required CORS Headers**

### **For OPTIONS Method:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

### **For GET/POST Methods:**
The Lambda function already returns these headers, but they need to be accessible through OPTIONS preflight.

---

## 🔧 **Implementation Steps**

### **Step 1: Run CORS Fix Script**
```powershell
cd D:\cursor_projects\safemate_v2
.\scripts\fix-folders-cors.ps1
```

### **Step 2: Verify Fix**
Test the OPTIONS request:
```powershell
Invoke-WebRequest -Uri "https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default/folders" -Method OPTIONS -Headers @{"Origin"="http://localhost:5173"}
```

### **Step 3: Test Frontend**
Refresh the frontend application and check if the `/folders` endpoint works without CORS errors.

---

## 🎯 **Expected Results**

### **Before Fix:**
- ❌ CORS error in browser console
- ❌ OPTIONS request fails
- ❌ GET request blocked

### **After Fix:**
- ✅ OPTIONS request returns 200 with CORS headers
- ✅ GET request succeeds
- ✅ Frontend can access `/folders` endpoint
- ✅ No CORS errors in browser console

---

## 🔍 **Additional Considerations**

### **1. Multiple Origins**
If you need to support multiple origins (development, staging, production), update the `Access-Control-Allow-Origin` header accordingly.

### **2. Security**
The current configuration allows `http://localhost:5173` for development. For production, this should be restricted to your actual domain.

### **3. Lambda Function Verification**
Ensure the Lambda function (`ultimate-wallet-service`) is properly handling the `/folders` endpoint and returning the expected data structure.

### **4. DynamoDB Table**
Verify that the `SAFEMATE_FOLDERS_TABLE` exists and contains the expected data structure.

---

## 📊 **Testing Checklist**

- [ ] OPTIONS request to `/folders` returns 200
- [ ] CORS headers are present in OPTIONS response
- [ ] GET request to `/folders` works from frontend
- [ ] No CORS errors in browser console
- [ ] Folder data loads correctly in the application
- [ ] Authentication works properly with Cognito

---

## 🚀 **Next Steps**

1. **Run the CORS fix script**
2. **Test the endpoint**
3. **Verify frontend functionality**
4. **Monitor for any additional issues**
5. **Update documentation if needed**

---

## 📞 **Support**

If the fix doesn't resolve the issue:
1. Check AWS CloudWatch logs for Lambda function errors
2. Verify API Gateway deployment status
3. Test with different authentication tokens
4. Check DynamoDB table permissions and data
