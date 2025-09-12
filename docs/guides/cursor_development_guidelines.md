# 🎯 Cursor Development Guidelines for SafeMate

## 📋 **Purpose**
This document serves as a reference guide for Cursor (AI assistant) when working on the SafeMate project to ensure consistent file structure, proper documentation placement, and prevention of file duplication.

---

## 🏗️ **Project Structure Rules**

### **📁 Directory Organization**
```
safemate_v2/
├── apps/web/safemate/          # Frontend React application ONLY
├── services/                   # Backend Lambda functions ONLY
├── utils/                      # Shared utility modules ONLY
├── tests/                      # Test files ONLY (api/, terraform/)
├── terraform/                  # Infrastructure as Code ONLY
├── documentation/              # ALL documentation files
├── aws-layer/                  # AWS SDK layer
├── hedera-layer/               # Hedera SDK layer
├── lambda-layer/               # General Lambda layer
├── minimal-hedera-layer/       # Minimal Hedera layer
├── optimized-layer/            # Optimized layer
└── cors-config-manager.json    # Unified CORS configuration
```

### **❌ FORBIDDEN Locations**
- **NEVER** create files in the root directory (except README.md)
- **NEVER** create documentation outside `documentation/` directory
- **NEVER** create test files outside `tests/` directory
- **NEVER** create utility files outside `utils/` directory

---

## 📚 **Documentation Placement Rules**

### **✅ CORRECT Documentation Locations**

#### **`documentation/` Directory - ALL Documentation Files**
- **Project Documentation**: `SAFEMATE_PROJECT_DOCUMENTATION.md`
- **Workflow Documentation**: `SAFEMATE_WORKFLOW_DOCUMENTATION.md`
- **Team Guides**: `TEAM_DEVELOPMENT_GUIDE.md`, `TEAM_SETUP_GUIDE.md`
- **Technical References**: `TECHNOLOGY_STACK.md`, `AWS_SERVICES_MAPPING.md`
- **Testing Guides**: `test-services.md`, `LIVE_WALLET_TEST_GUIDE.md`
- **Deployment Guides**: `DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_QUICK_REFERENCE.md`
- **Cleanup Reports**: `CLEANUP_COMPLETION_REPORT.md`, `CODEBASE_CLEANUP_GUIDE.md`
- **Status Reports**: `SAFEMATE_RECOMMENDATIONS.md`
- **Integration Guides**: `HEDERA_WALLET_INTEGRATION.md`
- **Analysis Files**: `CLOUDFRONT_S3_ANALYSIS.md`

#### **Root Directory - ONLY README.md**
- **Main README**: `README.md` (project overview and quick start)

### **❌ FORBIDDEN Documentation Locations**
- **NEVER** create `.md` files in root directory (except README.md)
- **NEVER** create documentation in service directories
- **NEVER** create documentation in frontend directories
- **NEVER** create documentation in terraform directory

---

## 🔄 **File Creation and Update Rules**

### **📄 When Creating New Files**

#### **1. Documentation Files**
```bash
# ✅ CORRECT - Always in documentation/ directory
documentation/NEW_FEATURE_GUIDE.md
documentation/API_REFERENCE.md
documentation/TROUBLESHOOTING.md

# ❌ WRONG - Never in root
NEW_FEATURE_GUIDE.md
API_REFERENCE.md
```

#### **2. Code Files**
```bash
# ✅ CORRECT - In appropriate directories
apps/web/safemate/src/components/NewComponent.tsx
services/new-service/index.js
utils/shared-utility.js
tests/api/test-new-feature.js

# ❌ WRONG - Never in root
NewComponent.tsx
new-service.js
```

#### **3. Configuration Files**
```bash
# ✅ CORRECT - In appropriate directories
terraform/new-resource.tf
apps/web/safemate/vite.config.ts
services/new-service/package.json

# ❌ WRONG - Never in root
new-config.json
```

### **📝 When Updating Existing Files**

#### **1. Always Check for Duplicates First**
```bash
# Before creating a new file, search for existing similar files
grep -r "similar content" .
find . -name "*similar*" -type f
```

#### **2. Update Existing Files Instead of Creating New**
- If similar functionality exists, update the existing file
- If documentation exists, update it rather than creating new
- If configuration exists, modify it rather than creating new

---

## 🚫 **Duplication Prevention Rules**

### **🔍 Pre-Creation Checklist**
Before creating ANY new file, check:

1. **Search for Similar Files**
   ```bash
   # Search for similar names
   find . -name "*similar-name*" -type f
   
   # Search for similar content
   grep -r "similar content" .
   ```

2. **Check Documentation Directory**
   ```bash
   # List all documentation files
   ls documentation/*.md
   ```

3. **Check Service Directories**
   ```bash
   # List all service directories
   ls services/
   ```

4. **Check Frontend Directories**
   ```bash
   # List all frontend files
   find apps/web/safemate/src -name "*.tsx" -o -name "*.ts"
   ```

### **📋 Duplication Prevention Examples**

#### **❌ AVOID These Duplications**
```bash
# ❌ WRONG - Multiple similar files
documentation/WALLET_GUIDE.md
documentation/HEDERA_WALLET_GUIDE.md
documentation/WALLET_INTEGRATION.md

# ✅ CORRECT - Single comprehensive file
documentation/HEDERA_WALLET_INTEGRATION.md
```

```bash
# ❌ WRONG - Multiple test files
test-wallet.js
test-hedera.js
wallet-test.js

# ✅ CORRECT - Organized test structure
tests/api/wallet-tests.js
tests/api/hedera-tests.js
```

```bash
# ❌ WRONG - Multiple configuration files
cors-config.json
cors-fix.json
fix-cors.json

# ✅ CORRECT - Single unified configuration
cors-config-manager.json
```

---

## 📁 **Directory-Specific Rules**

### **`apps/web/safemate/` - Frontend Only**
- **Allowed**: React components, TypeScript files, CSS, assets
- **Forbidden**: Documentation, backend code, configuration files
- **Structure**:
  ```
  apps/web/safemate/
  ├── src/
  │   ├── components/     # React components
  │   ├── services/       # Frontend services
  │   ├── contexts/       # React contexts
  │   ├── types/          # TypeScript types
  │   ├── utils/          # Frontend utilities
  │   └── widgets/        # Dashboard widgets
  ├── public/             # Static assets
  ├── package.json        # Dependencies
  └── vite.config.ts      # Build configuration
  ```

### **`services/` - Backend Only**
- **Allowed**: Lambda functions, Node.js code, service-specific configs
- **Forbidden**: Documentation, frontend code, shared utilities
- **Structure**:
  ```
  services/
  ├── user-onboarding/    # User onboarding service
  ├── wallet-manager/     # Wallet management service
  ├── hedera-service/     # Hedera blockchain service
  ├── group-manager/      # Group management service
  └── shared/             # Shared backend utilities
  ```

### **`utils/` - Shared Utilities Only**
- **Allowed**: Reusable utility functions, shared modules
- **Forbidden**: Service-specific code, documentation
- **Structure**:
  ```
  utils/
  ├── hedera-client.js    # Shared Hedera client
  ├── encryption.js       # Shared encryption utilities
  └── validation.js       # Shared validation utilities
  ```

### **`tests/` - Test Files Only**
- **Allowed**: Test files, test configurations, test utilities
- **Forbidden**: Production code, documentation
- **Structure**:
  ```
  tests/
  ├── api/                # API test files
  └── terraform/          # Terraform test files
  ```

### **`terraform/` - Infrastructure Only**
- **Allowed**: Terraform configurations, infrastructure code
- **Forbidden**: Application code, documentation
- **Structure**:
  ```
  terraform/
  ├── lambda.tf           # Lambda function definitions
  ├── cognito.tf          # Authentication configuration
  ├── dynamodb.tf         # Database configuration
  ├── api-gateway.tf      # API Gateway configuration
  └── kms.tf              # Encryption key management
  ```

---

## 🔧 **File Naming Conventions**

### **📄 Documentation Files**
```bash
# ✅ CORRECT - Descriptive, consistent naming
SAFEMATE_PROJECT_DOCUMENTATION.md
TEAM_DEVELOPMENT_GUIDE.md
DEPLOYMENT_GUIDE.md
HEDERA_WALLET_INTEGRATION.md

# ❌ WRONG - Inconsistent, unclear naming
project-docs.md
team-guide.md
deploy.md
wallet.md
```

### **💻 Code Files**
```bash
# ✅ CORRECT - Descriptive, consistent naming
UserOnboardingService.ts
HederaWalletManager.ts
EnhancedFileService.ts

# ❌ WRONG - Unclear, inconsistent naming
service.ts
wallet.ts
file.ts
```

### **⚙️ Configuration Files**
```bash
# ✅ CORRECT - Clear, descriptive naming
cors-config-manager.json
lambda-function-config.json
api-gateway-settings.json

# ❌ WRONG - Unclear, generic naming
config.json
settings.json
config.json
```

---

## 🎯 **Action Checklist for Cursor**

### **Before Creating Any File**
- [ ] Check if similar file already exists
- [ ] Verify correct directory placement
- [ ] Use consistent naming convention
- [ ] Check for potential duplications
- [ ] Update existing files if possible

### **Before Creating Documentation**
- [ ] Check `documentation/` directory for existing similar files
- [ ] Verify topic isn't already covered
- [ ] Place in `documentation/` directory
- [ ] Update `documentation/README.md` if adding new file
- [ ] Use consistent naming and formatting

### **Before Creating Code Files**
- [ ] Check appropriate service/frontend directory
- [ ] Verify functionality doesn't exist elsewhere
- [ ] Use shared utilities when possible
- [ ] Follow existing naming conventions
- [ ] Place in correct subdirectory

### **Before Creating Configuration Files**
- [ ] Check for existing configuration
- [ ] Verify correct directory placement
- [ ] Use descriptive naming
- [ ] Consolidate with existing configs when possible
- [ ] Update related documentation

---

## 📞 **Reference Documents**

### **Essential References**
- `documentation/README.md` - Main documentation index
- `documentation/SAFEMATE_PROJECT_DOCUMENTATION.md` - Project overview
- `documentation/CODEBASE_CLEANUP_GUIDE.md` - Cleanup guidelines
- `README.md` - Project structure and quick start

### **When in Doubt**
1. **Check existing documentation first**
2. **Search for similar files**
3. **Update existing files rather than creating new**
4. **Place everything in appropriate directories**
5. **Follow established naming conventions**

---

## 🚨 **Emergency Rules**

### **If Unsure About Placement**
1. **Default to `documentation/` for any documentation**
2. **Default to `utils/` for any shared utilities**
3. **Default to `tests/` for any test files**
4. **NEVER place files in root directory**
5. **ALWAYS check for existing similar files first**

### **If Duplication is Found**
1. **Consolidate files immediately**
2. **Update references in other files**
3. **Remove redundant files**
4. **Update documentation index**
5. **Verify no broken links**

---

**Remember: When in doubt, check existing structure and follow established patterns! 🎯**
