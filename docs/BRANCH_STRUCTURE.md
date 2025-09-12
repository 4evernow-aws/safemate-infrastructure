# SafeMate v2 - Branch Structure and Migration Guide

## 📋 **Current Branch Structure**

### **Active Branches**
- **`dev`** - Development environment (Local Development)
  - Environment: Development
  - AWS Cognito Pool: `ap-southeast-2_2fMWFFs8i`
  - Hedera Network: Testnet
  - Cost Profile: Free Tier (~$1-5/month)
  - **URL**: `http://localhost:5173/`

- **`preprod`** - Pre-production environment (AWS-Deployed)
  - Environment: Pre-Production
  - AWS Cognito Pool: `ap-southeast-2_pMo5BXFiM`
  - Hedera Network: Testnet
  - Cost Profile: Standard Cost (~$20-50/month)
  - **URL**: `https://d1f6ux6bexgm7o.cloudfront.net`

### **Future Branches**
- **`production`** - Future production branch (when ready)
  - Environment: Production
  - AWS Cognito Pool: TBD
  - Hedera Network: Mainnet
  - Cost Profile: Production Cost (~$100-500/month)

## 🔄 **Migration Workflow**

### **Current Simple Process**
```
dev → preprod
```

### **Future Process (when ready for production)**
```
dev → preprod → production
```

## 🛠️ **Migration Scripts**

### **PowerShell Script**
```powershell
# Development to Pre-Production (AWS deployment)
.\migrate-complete-v3.ps1 -MigrationPath "dev-to-preprod" -GitPush -GitMerge
```

### **Bash Script**
```bash
# Development to Pre-Production (AWS deployment)
bash migrate-complete-v3.sh --migration-path dev-to-preprod --git-push --git-merge
```

## 🔧 **Git Operations**

The migration scripts automatically handle:

### **Commit Operations**
- Commits all changes with descriptive messages
- Auto-generates commit messages if not provided
- Format: `feat: Complete dev-to-preprod migration - <timestamp>`

### **Push Operations**
- Pushes changes to current branch (if `-GitPush` specified)
- Pushes merged branches to remote repository

### **Merge Operations**
- **`dev-to-preprod`**: Merges `dev` into `preprod` branch

## 📁 **Environment Files**

### **Development Environment**
- **File**: `apps/web/safemate/.env`
- **Header**: `# Development Environment Configuration`
- **Status**: Active Development Environment
- **Usage**: Local development at `http://localhost:5173/`

### **Pre-Production Environment**
- **File**: `apps/web/safemate/.env.preprod`
- **Header**: `# Pre-Production Environment Configuration`
- **Status**: AWS-Deployed Environment
- **Usage**: Live environment at `https://d1f6ux6bexgm7o.cloudfront.net`

## 🎯 **Migration Best Practices**

### **Before Migration**
1. Ensure all changes are committed to `dev` branch
2. Verify environment configurations are correct
3. Test the migration in a dry-run mode first
4. Backup important data if needed

### **During Migration**
1. Monitor the migration progress
2. Check for any error messages
3. Verify git operations complete successfully
4. Test the target environment after migration

### **After Migration**
1. Verify all services are running correctly
2. Test key functionality in the target environment
3. Update documentation if needed
4. Notify team of successful migration

## 🚨 **Troubleshooting**

### **Common Issues**
- **Git merge conflicts**: Resolve manually and continue
- **AWS resource conflicts**: Check existing resources and resolve conflicts
- **Environment configuration issues**: Verify `.env` files are correct
- **Migration script failures**: Check logs and retry with appropriate flags

### **Recovery Steps**
1. Check git status and resolve any conflicts
2. Verify environment configurations
3. Re-run migration with appropriate skip flags
4. Contact team if issues persist

## 📊 **Branch Status**

| Branch | Status | Last Updated | Environment | Deployment Type | Ready for Production |
|--------|--------|--------------|-------------|-----------------|---------------------|
| `dev` | Active | Current | Development | Local | No |
| `preprod` | Active | Current | Pre-Production | AWS | Yes (Current) |
| `production` | Future | TBD | Production | AWS | TBD |

## 🔮 **Future Plans**

### **Phase 1: Current State**
- ✅ `dev` → `preprod` workflow
- ✅ Automated git operations
- ✅ Environment-specific configurations
- ✅ AWS-deployed preprod environment

### **Phase 2: Production Ready**
- 🔄 Create `production` branch
- 🔄 Update migration scripts for 2-step process
- 🔄 Configure production AWS resources
- 🔄 Set up production monitoring

### **Phase 3: Advanced Features**
- 🔄 Automated testing in each environment
- 🔄 Rollback capabilities
- 🔄 Blue-green deployments
- 🔄 Advanced monitoring and alerting

## 🌐 **Environment URLs**

### **Development**
- **Local URL**: `http://localhost:5173/`
- **Environment**: Development
- **Purpose**: Local development and testing

### **Pre-Production**
- **Live URL**: `https://d1f6ux6bexgm7o.cloudfront.net`
- **Environment**: Pre-Production
- **Purpose**: Staging and pre-production testing

### **Production** (Future)
- **Live URL**: TBD
- **Environment**: Production
- **Purpose**: Live production environment

## 🎯 **Key Benefits of Simplified Structure**

1. **Clear Separation**: Local development vs AWS deployment
2. **No Confusion**: No ambiguity about what each branch represents
3. **Simple Workflow**: Easy to understand and follow
4. **Standard Practice**: Aligns with industry best practices
5. **Future Ready**: Easy to add production when ready

---

**Last Updated**: September 2025  
**Version**: 3.2.0  
**Status**: Active Development