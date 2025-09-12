# SafeMate Cognito Migration Summary: Dev → Preprod

## 🎯 **Migration Overview**

This document summarizes the complete migration from the **dev** Cognito user pool to the **preprod** Cognito user pool.

## 📋 **Pool Details**

### **Dev Pool (Previous)**
- **Pool Name**: `default-safemate-user-pool-v2`
- **Pool ID**: `ap-southeast-2_uLgMRpWlw`
- **Status**: ✅ **Separated for development use**

### **Preprod Pool (Current)**
- **Pool Name**: `preprod-safemate-user-pool-v2`
- **Pool ID**: `ap-southeast-2_pMo5BXFiM`
- **Client ID**: `1a0trpjfgv54odl9csqlcbkuii`
- **Domain**: `preprod-safemate-auth-wmacwrsy`
- **Status**: ✅ **Active for pre-production**

## ✅ **Migration Steps Completed**

### 1. **Configuration Updates**
- ✅ Updated `apps/web/safemate/.env` with preprod Cognito settings
- ✅ Updated `apps/web/safemate/.env.preprod` with preprod Cognito settings
- ✅ Verified all API endpoints point to preprod URLs
- ✅ Confirmed Hedera network set to `testnet`

### 2. **Frontend Deployment**
- ✅ Rebuilt frontend with production configuration
- ✅ Verified built JavaScript contains preprod pool ID
- ✅ Deployed to S3 bucket with cache busting
- ✅ Forced CloudFront invalidation

### 3. **Environment Configuration**
- ✅ Pre-production URL: `https://d19a5c2wn4mtdt.cloudfront.net`
- ✅ All Lambda functions use `preprod-` prefix
- ✅ All API Gateway endpoints use `/preprod` stage
- ✅ Resource naming follows `preprod-` convention

## 🔧 **Technical Details**

### **Cognito Configuration**
```javascript
// Pre-production Cognito Settings
{
  UserPoolId: "ap-southeast-2_pMo5BXFiM",
  ClientId: "1a0trpjfgv54odl9csqlcbkuii",
  Region: "ap-southeast-2"
}
```

### **API Endpoints**
- **Onboarding**: `https://l5epgn3nv3.execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Vault**: `https://t2hd7atpa8.execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Wallet**: `https://ncr4ky9z5h.execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Hedera**: `https://afyj0tno08.execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Group**: `https://njc6cjhmsh.execute-api.ap-southeast-2.amazonaws.com/preprod`

### **Lambda Functions**
- **User Onboarding**: `preprod-safemate-user-onboarding`
- **Post Confirmation**: `preprod-safemate-post-confirmation-wallet-creator`
- **Group Manager**: `preprod-safemate-group-manager`
- **Token Vault**: `preprod-safemate-token-vault`
- **Wallet Manager**: `preprod-safemate-wallet-manager`
- **Hedera Service**: `preprod-safemate-hedera-service`
- **Directory Creator**: `preprod-safemate-directory-creator`

## 🌐 **Environment URLs**

### **Pre-Production**
- **Frontend**: `https://d19a5c2wn4mtdt.cloudfront.net`
- **Cognito Domain**: `https://preprod-safemate-auth-wmacwrsy.auth.ap-southeast-2.amazoncognito.com`

### **Development** (Separate)
- **Frontend**: `http://localhost:5173`
- **Cognito Pool**: `ap-southeast-2_uLgMRpWlw` (default-safemate-user-pool-v2)

## ⚠️ **Important Notes**

### **User Migration**
- ❌ **Users are NOT migrated** between pools
- ✅ **New registrations** go to preprod pool
- ✅ **Dev pool remains separate** for development
- ✅ **No data loss** - both pools maintain their users

### **Authentication Flow**
- ✅ **Preprod users** authenticate against `ap-southeast-2_pMo5BXFiM`
- ✅ **Dev users** authenticate against `ap-southeast-2_uLgMRpWlw`
- ✅ **No conflicts** between environments

## 🧪 **Testing Instructions**

### **1. Clear Browser Cache**
```bash
# Windows
Ctrl + F5

# Mac
Cmd + Shift + R
```

### **2. Test Pre-Production**
1. Visit: `https://d19a5c2wn4mtdt.cloudfront.net`
2. Try to register a new user
3. Verify user appears in `preprod-safemate-user-pool-v2`
4. Check for "account already exists" errors (should be resolved)

### **3. Verify Configuration**
1. Open browser Developer Tools (F12)
2. Check Network tab for JavaScript files
3. Verify `index-CVA8er3U.js` contains `ap-southeast-2_pMo5BXFiM`

## 📊 **Migration Status**

| Component | Status | Details |
|-----------|--------|---------|
| Frontend Configuration | ✅ Complete | Updated to preprod pool |
| API Endpoints | ✅ Complete | All point to preprod |
| Lambda Functions | ✅ Complete | All use preprod prefix |
| S3 Deployment | ✅ Complete | Files deployed with cache busting |
| CloudFront | ✅ Complete | Invalidation completed |
| User Pool | ✅ Complete | Preprod pool active |
| Browser Cache | ⚠️ Manual | Requires cache clearing |

## 🚀 **Next Steps**

### **Immediate (0-5 minutes)**
1. Wait for CloudFront propagation
2. Clear browser cache
3. Test user registration

### **Short-term (1-2 hours)**
1. Monitor for authentication issues
2. Verify all API calls work correctly
3. Test complete user workflow

### **Long-term (1-2 days)**
1. Monitor CloudWatch logs
2. Verify no "account already exists" errors
3. Confirm all features work in preprod

## 🔍 **Troubleshooting**

### **If Still Seeing Dev Environment**
1. **Clear browser cache completely**
2. **Use incognito/private window**
3. **Check browser developer tools**
4. **Wait 5 minutes for CloudFront**

### **If Authentication Fails**
1. **Check Cognito pool configuration**
2. **Verify API Gateway authorizer**
3. **Check CloudWatch logs**
4. **Confirm environment variables**

## ✅ **Migration Complete**

The Cognito migration from dev to preprod is **COMPLETE**. The pre-production environment now uses the correct Cognito user pool and all configuration has been updated accordingly.

**Pre-Production URL**: `https://d19a5c2wn4mtdt.cloudfront.net`
**Cognito Pool**: `ap-southeast-2_pMo5BXFiM`

---
*Migration completed on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')*
