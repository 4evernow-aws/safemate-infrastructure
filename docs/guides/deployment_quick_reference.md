# SafeMate Deployment Quick Reference

## 🚨 **QUICK CHECK BEFORE ANY DEPLOYMENT CHANGES**

**⚠️ ALWAYS CHECK THIS REFERENCE BEFORE:**
- Creating new zip files
- Modifying existing deployments
- Creating new Lambda layers

---

## 📋 **CURRENT ZIP FILES (DO NOT DUPLICATE)**

| Service | Zip File | Size | AWS Function | Status |
|---------|----------|------|--------------|---------|
| **user-onboarding** | `lambda-function.zip` | 2,056 bytes | `default-safemate-user-onboarding` | ✅ **ACTIVE** |
| **token-vault** | `token-vault.zip` | 4,425 bytes | `default-safemate-token-vault` | ✅ **ACTIVE** |
| **wallet-manager** | `wallet-manager.zip` | 3,569 bytes | `default-safemate-wallet-manager` | ✅ **ACTIVE** |
| **safemate-directory-creator** | `safemate-directory-creator.zip` | 5,581 bytes | `default-safemate-directory-creator` | ✅ **ACTIVE** |
| **group-manager** | `group-manager.zip` | 11,121 bytes | `default-safemate-group-manager` | ✅ **ACTIVE** |
| **post-confirmation-wallet-creator** | `post-confirmation-wallet-creator.zip` | 2,802,818 bytes | `default-safemate-post-confirmation-wallet-creator` | ✅ **ACTIVE** |

---

## 🔧 **LAMBDA LAYERS (DO NOT DUPLICATE)**

| Layer Name | Version | Status | Used By |
|------------|---------|--------|---------|
| **hedera-sdk-layer** | 1 | ✅ **ACTIVE** | `default-safemate-user-onboarding` |

**❌ REMOVED LAYERS (DO NOT RECREATE):**
- `default-safemate-hedera-dependencies` (versions 1-12)
- `safemate-hedera-dependencies` (versions 1-3)
- `safemate-aws-layer` (version 1)
- `safemate-axios-layer` (version 1)
- `safemate-onboarding-deps` (version 1)

---

## 📁 **DIRECT DEPLOYMENTS (NO ZIP FILES)**

| Service | Source File | AWS Function | Status |
|---------|-------------|--------------|---------|
| **hedera-service** | `index.js` | `default-safemate-hedera-service` | ✅ **ACTIVE** |

---

## 🚨 **PRE-DEPLOYMENT CHECKLIST**

### **BEFORE CREATING NEW ZIP:**
1. ✅ Check if zip file already exists for this service
2. ✅ Verify AWS mapping is correct
3. ✅ Check file sizes match
4. ✅ Use service name for zip file name
5. ✅ Review `SAFEMATE_RECOMMENDATIONS.md` for best practices
6. ✅ Check `CRITICAL_RECOMMENDATIONS_SUMMARY.md` for immediate requirements

### **BEFORE MODIFYING DEPLOYMENT:**
1. ✅ Check current mapping in this reference
2. ✅ Verify which AWS function is being updated
3. ✅ Check if Lambda layers are involved
4. ✅ Determine if zip or direct deployment
5. ✅ Follow guidelines in `SAFEMATE_RECOMMENDATIONS.md`
6. ✅ Ensure compliance with `CRITICAL_RECOMMENDATIONS_SUMMARY.md`

### **BEFORE CREATING NEW LAYER:**
1. ✅ Check if layer already exists for this functionality
2. ✅ Review removed layers list
3. ✅ Check if existing layers can be reused
4. ✅ Verify dependencies are not already available
5. ✅ Review layer strategy in `SAFEMATE_RECOMMENDATIONS.md`
6. ✅ Check critical requirements in `CRITICAL_RECOMMENDATIONS_SUMMARY.md`

### **BEFORE ANY DEPLOYMENT CHANGE:**
1. ✅ Check this quick reference
2. ✅ Review full registry (`DEPLOYMENT_MAPPING_REGISTRY.md`)
3. ✅ Follow comprehensive recommendations (`SAFEMATE_RECOMMENDATIONS.md`)
4. ✅ Check critical requirements (`CRITICAL_RECOMMENDATIONS_SUMMARY.md`)
5. ✅ Use verification commands to check current state
6. ✅ Update documentation after changes

---

## 📝 **NAMING CONVENTIONS**

### **✅ ZIP FILES:**
- Use service name: `{service-name}.zip`
- Keep in service directory
- Never create duplicates

### **✅ LAMBDA LAYERS:**
- Use descriptive names
- Check existing layers first
- Document in registry

---

## 🔍 **VERIFICATION COMMANDS**

### **Check AWS Functions:**
```bash
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `default-safemate`)].{Name:FunctionName,CodeSize:CodeSize}' --output table
```

### **Check AWS Layers:**
```bash
aws lambda list-layers --query 'Layers[?starts_with(LayerName, `hedera-sdk`)].{Name:LayerName,Versions:LatestMatchingVersion.Version}' --output table
```

### **Check Local Zip Files:**
```bash
Get-ChildItem -Recurse -File | Where-Object { $_.Extension -eq ".zip" -and $_.Name -notmatch "test.*\.zip$" } | Select-Object Name, Length, Directory
```

---

## 🎯 **BEST PRACTICES**

### **✅ DO:**
- Check this reference before any changes
- Use existing zip files when possible
- Update registry after changes
- Use clear naming conventions
- Verify mappings before deployment
- Follow recommendations in `SAFEMATE_RECOMMENDATIONS.md`
- Check critical requirements in `CRITICAL_RECOMMENDATIONS_SUMMARY.md`

### **❌ DON'T:**
- Create duplicate zip files
- Create duplicate Lambda layers
- Modify deployments without checking
- Ignore existing mappings
- Skip registry updates
- Ignore recommendation documents
- Skip critical requirement checks

---

## 📞 **ESSENTIAL DOCUMENTS**

### **✅ MANDATORY DOCUMENTS (ALWAYS CONSULT):**
- **`DEPLOYMENT_QUICK_REFERENCE.md`** - This document (quick checks)
- **`DEPLOYMENT_MAPPING_REGISTRY.md`** - Complete deployment registry
- **`SAFEMATE_RECOMMENDATIONS.md`** - Comprehensive recommendations and best practices
- **`CRITICAL_RECOMMENDATIONS_SUMMARY.md`** - Critical requirements for immediate action

### **✅ SAFEMATE DOCUMENTATION (`documentation/` directory):**
- **`documentation/HEDERA_WALLET_INTEGRATION.md`** - Hedera wallet integration details
- **`documentation/AWS_SERVICES_MAPPING.md`** - AWS services mapping and configuration
- **`documentation/DEPLOYMENT_GUIDE.md`** - SafeMate-specific deployment procedures
- **`documentation/TECHNOLOGY_STACK.md`** - SafeMate technology stack overview

### **✅ GUIDES (`guides/` directory):**
- **`guides/aws_lambda_guide.md`** - AWS Lambda best practices and procedures
- **`guides/aws_api_gateway_guide.md`** - AWS API Gateway configuration and setup
- **`guides/aws_cors_guide.md`** - CORS configuration and troubleshooting
- **`guides/hedera_sdk_guide.md`** - Hedera SDK usage and best practices
- **`guides/hedera_wallet_guide.md`** - Hedera wallet creation and management
- **`guides/GIT_WORKFLOW_GUIDE.md`** - Git workflow and version control procedures

### **✅ REFERENCE DOCUMENTS:**
- **`CLEANUP_STATUS_REPORT.md`** - Cleanup results and lessons learned
- **`CLEANUP_VERIFICATION_REPORT.md`** - Verification of cleanup completion

---

## 🎉 **QUICK REFERENCE STATUS**

**✅ ACTIVE AND MAINTAINED**

**This quick reference provides fast checks for deployment decisions.**
**Always consult the full registry and recommendation documents for comprehensive guidance.**

**Last Updated:** 2025-08-19  
**Status:** ✅ **CURRENT AND ACCURATE**
