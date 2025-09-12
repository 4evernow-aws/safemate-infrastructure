# Environment Configuration

## ⚙️ **Environment Configuration Overview**

SafeMate uses a centralized configuration management system to maintain consistent settings across all environments while allowing environment-specific customizations. This document covers the configuration structure, management procedures, and best practices.

## 🏗️ **Configuration Architecture**

### **📊 Configuration Hierarchy**

```
Configuration Hierarchy:
├── 📁 Global Configuration (terraform/variables.tf)
│   ├── Region settings
│   ├── Common resource naming
│   └── Default values
├── 📁 Environment Configuration (terraform/environments.tf)
│   ├── Environment detection
│   ├── Environment-specific settings
│   └── Resource naming conventions
├── 📁 Environment Variables (terraform/*.tfvars)
│   ├── dev.tfvars
│   ├── preprod.tfvars
│   └── prod.tfvars
└── 📁 Application Configuration (apps/web/safemate/.env.*)
    ├── .env.development
    ├── .env.staging
    └── .env.production
```

### **🔧 Configuration Components**

#### **1. Terraform Configuration**
- **Global Variables**: Common settings across all environments
- **Environment Detection**: Automatic environment identification
- **Resource Naming**: Consistent naming conventions
- **Infrastructure Settings**: AWS resource configurations

#### **2. Application Configuration**
- **Frontend Settings**: Vite environment variables
- **API Endpoints**: Environment-specific API URLs
- **Feature Flags**: Environment-specific features
- **Debug Settings**: Logging and debugging options

#### **3. Deployment Configuration**
- **Deployment Scripts**: Environment-specific deployment
- **CI/CD Pipeline**: GitHub Actions configuration
- **Monitoring**: Environment-specific monitoring

## 📁 **Configuration Files**

### **Global Configuration** (`terraform/variables.tf`)

```hcl
# Global variables for all environments
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "safemate"
}

variable "environment" {
  description = "Environment name (optional - will auto-detect from workspace if not provided)"
  type        = string
  default     = null
}

# Auto-detect environment from workspace name
locals {
  environment = var.environment != null ? var.environment : terraform.workspace
  name_prefix = "${local.environment}-${var.app_name}"
  
  # Environment-specific configurations
  environment_configs = {
    "dev"        = { log_retention = 3, ecs_desired_count = 1, container_insights = false }
    "preprod"    = { log_retention = 14, ecs_desired_count = 1, container_insights = true }
    "prod"       = { log_retention = 30, ecs_desired_count = 2, container_insights = true }
    "default"    = { log_retention = 7, ecs_desired_count = 1, container_insights = false }
  }
  
  config = lookup(local.environment_configs, local.environment, local.environment_configs["default"])
}
```

### **Environment Configuration** (`terraform/environments.tf`)

```hcl
# Environment Configuration for SafeMate
locals {
  # Override environment if not set
  effective_environment = var.environment != null ? var.environment : "dev"
  
  # Environment-specific naming
  env_prefix = local.effective_environment == "dev" ? "dev" : 
               (local.effective_environment == "preprod" ? "preprod" : 
               (local.effective_environment == "prod" ? "prod" : local.effective_environment))
  
  # Environment-specific settings
  environment_config = {
    dev = {
      hedera_network = "testnet"
      debug_mode     = true
      demo_mode      = true
      log_level      = "DEBUG"
    }
    preprod = {
      hedera_network = "testnet"
      debug_mode     = false
      demo_mode      = false
      log_level      = "INFO"
    }
    prod = {
      hedera_network = "mainnet"
      debug_mode     = false
      demo_mode      = false
      log_level      = "WARN"
    }
    default = {
      hedera_network = "testnet"
      debug_mode     = true
      demo_mode      = true
      log_level      = "DEBUG"
    }
  }
  
  # Current environment config
  current_env = lookup(local.environment_config, local.effective_environment, local.environment_config["default"])
  
  # Resource naming with environment prefix
  name_prefix = "${local.env_prefix}-safemate"
  
  # API Gateway stage names
  api_stage = local.effective_environment
}
```

### **Environment Variables** (`terraform/dev.tfvars`)

```hcl
# Development Environment Variables
environment = "dev"
hedera_network = "testnet"
debug_mode = true
demo_mode = true
app_url = "http://localhost:5173"
bucket_name = "dev-safemate-assets"
image_tag = "latest"
```

### **Frontend Configuration** (`apps/web/safemate/.env.development`)

```env
# Development Environment Variables
VITE_DEBUG_MODE=true
VITE_DEMO_MODE=true
VITE_HEDERA_NETWORK=testnet
VITE_COGNITO_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_bUngJqSfu
VITE_COGNITO_CLIENT_ID=67vhj24nj2b0rrtvhppevv9its
VITE_COGNITO_DOMAIN=dev-safemate-auth-7h6ewch5
VITE_ONBOARDING_API_URL=https://kbfs45jmnk.execute-api.ap-southeast-2.amazonaws.com/dev
VITE_VAULT_API_URL=https://73r0aby0k4.execute-api.ap-southeast-2.amazonaws.com/dev
VITE_WALLET_API_URL=https://8k2qwmk56d.execute-api.ap-southeast-2.amazonaws.com/dev
VITE_HEDERA_API_URL=https://vevhttzt1d.execute-api.ap-southeast-2.amazonaws.com/dev
VITE_GROUP_API_URL=https://f0v9l8afc0.execute-api.ap-southeast-2.amazonaws.com/dev
```

## 🎯 **Environment-Specific Configurations**

### **Development Environment**

#### **Characteristics**
- **Purpose**: Local development and testing
- **Cost**: Free Tier (~$1.40/month)
- **Security**: Development-level
- **Monitoring**: Basic

#### **Configuration**
```hcl
# Development-specific settings
log_retention = 3
ecs_desired_count = 1
container_insights = false
debug_mode = true
demo_mode = true
hedera_network = "testnet"
```

### **Pre-Production Environment**

#### **Characteristics**
- **Purpose**: Integration testing and staging
- **Cost**: Low Cost (~$5-10/month)
- **Security**: Production-level
- **Monitoring**: Enhanced
- **URL**: https://d19a5c2wn4mtdt.cloudfront.net/

#### **Configuration**
```hcl
# Pre-production-specific settings
log_retention = 14
ecs_desired_count = 1
container_insights = true
debug_mode = false
demo_mode = false
hedera_network = "testnet"
```

#### **Cognito Configuration**
```env
# Pre-Production Cognito Pool
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_pMo5BXFiM
VITE_COGNITO_CLIENT_ID=1a0trpjfgv54odl9csqlcbkuii
VITE_COGNITO_DOMAIN=preprod-safemate-auth-wmacwrsy
```

#### **API Configuration**
```env
# Pre-Production API Endpoints (to be deployed)
VITE_API_BASE_URL=https://[PREPROD_ID].execute-api.ap-southeast-2.amazonaws.com/preprod
VITE_HEDERA_API_URL=https://[PREPROD_HEDERA_ID].execute-api.ap-southeast-2.amazonaws.com/preprod
```

### **Production Environment**

#### **Characteristics**
- **Purpose**: Live application
- **Cost**: Standard Cost (~$20-50/month)
- **Security**: Enterprise-level
- **Monitoring**: Full

#### **Configuration**
```hcl
# Production-specific settings
log_retention = 30
ecs_desired_count = 2
container_insights = true
debug_mode = false
demo_mode = false
hedera_network = "mainnet"
```

## 🔧 **Configuration Management**

### **Adding New Environment Variables**

#### **Step 1: Add to Terraform Variables**
```hcl
# In terraform/variables.tf
variable "new_setting" {
  description = "Description of new setting"
  type        = string
  default     = "default_value"
}
```

#### **Step 2: Add to Environment Configuration**
```hcl
# In terraform/environments.tf
environment_config = {
  dev = {
    # ... existing config
    new_setting = "dev_value"
  }
  preprod = {
    # ... existing config
    new_setting = "preprod_value"
  }
  prod = {
    # ... existing config
    new_setting = "prod_value"
  }
}
```

#### **Step 3: Add to Environment Variables**
```hcl
# In terraform/dev.tfvars
new_setting = "dev_value"

# In terraform/preprod.tfvars
new_setting = "preprod_value"

# In terraform/prod.tfvars
new_setting = "prod_value"
```

#### **Step 4: Add to Frontend Configuration**
```env
# In apps/web/safemate/.env.development
VITE_NEW_SETTING=dev_value

# In apps/web/safemate/.env.staging
VITE_NEW_SETTING=preprod_value

# In apps/web/safemate/.env.production
VITE_NEW_SETTING=prod_value
```

### **Configuration Validation**

#### **Terraform Validation**
```powershell
# Validate Terraform configuration
terraform validate

# Check configuration syntax
terraform fmt -check

# Validate environment variables
terraform plan -var-file="dev.tfvars"
```

#### **Frontend Configuration Validation**
```powershell
# Validate environment variables
cd apps/web/safemate
npm run validate-env

# Check configuration consistency
npm run check-config
```

## 🔄 **Configuration Deployment**

### **Deployment Process**

#### **Step 1: Update Configuration**
```powershell
# Update Terraform configuration
git add terraform/
git commit -m "Update environment configuration"

# Update frontend configuration
git add apps/web/safemate/.env.*
git commit -m "Update frontend configuration"
```

#### **Step 2: Deploy Configuration**
```powershell
# Deploy to development
.\deploy-dev.ps1

# Deploy to pre-production
.\deploy-preprod.ps1

# Deploy to production (requires approval)
.\deploy-prod.ps1
```

#### **Step 3: Validate Deployment**
```powershell
# Validate configuration deployment
.\validate-config.ps1

# Check environment variables
.\check-env-vars.ps1
```

### **Configuration Rollback**

#### **Rollback Process**
```powershell
# Rollback Terraform configuration
terraform plan -var-file="dev.tfvars" -out=rollback.tfplan
terraform apply rollback.tfplan

# Rollback frontend configuration
git checkout HEAD~1 -- apps/web/safemate/.env.*
npm run build
```

## 🛡️ **Security Considerations**

### **Configuration Security**

#### **Sensitive Data Management**
```hcl
# Use AWS Secrets Manager for sensitive data
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "${local.name_prefix}-secrets"
}

resource "aws_secretsmanager_secret_version" "app_secrets_version" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_password = var.database_password
    api_key          = var.api_key
  })
}
```

#### **Environment Variable Security**
```env
# Never commit sensitive data to version control
# Use environment-specific secret management
VITE_API_KEY=${API_KEY}
VITE_DATABASE_URL=${DATABASE_URL}
```

### **Access Control**

#### **Configuration Access**
- **Development**: Developer access
- **Pre-Production**: DevOps team access
- **Production**: Restricted production team access

#### **Audit Logging**
```powershell
# Log configuration changes
.\log-config-change.ps1

# Audit configuration access
.\audit-config-access.ps1
```

## 📊 **Configuration Monitoring**

### **Configuration Health Checks**

#### **Terraform Configuration**
```powershell
# Check configuration health
.\check-config-health.ps1

# Validate resource configuration
.\validate-resources.ps1
```

#### **Application Configuration**
```powershell
# Check application configuration
.\check-app-config.ps1

# Validate environment variables
.\validate-env-vars.ps1
```

### **Configuration Alerts**

#### **Alert Configuration**
```powershell
# Set up configuration alerts
.\setup-config-alerts.ps1

# Monitor configuration changes
.\monitor-config-changes.ps1
```

## 📚 **Best Practices**

### **Configuration Management**

1. **Version Control**: All configuration in version control
2. **Environment Separation**: Clear separation between environments
3. **Validation**: Automated configuration validation
4. **Documentation**: Comprehensive configuration documentation
5. **Security**: Secure handling of sensitive data

### **Configuration Standards**

1. **Naming Conventions**: Consistent naming across environments
2. **Default Values**: Sensible defaults for all variables
3. **Validation**: Input validation for all configuration
4. **Documentation**: Clear documentation for all settings
5. **Testing**: Configuration testing in CI/CD pipeline

### **Configuration Maintenance**

1. **Regular Reviews**: Monthly configuration reviews
2. **Cleanup**: Remove unused configuration
3. **Updates**: Regular security and feature updates
4. **Backup**: Configuration backup procedures
5. **Recovery**: Configuration recovery procedures

## 📚 **Related Documentation**

- [Development Environment](../development/README.md)
- [Pre-Production Environment](../preprod/README.md)
- [Production Environment](../production/README.md)
- [Terraform Configuration](../terraform/README.md)
- [AWS Resource Management](../aws-resources/README.md)
- [Monitoring & Logging](../monitoring/README.md)

## 📞 **Support**

### **Configuration Team**
- **DevOps Engineer**: [Contact Information]
- **Infrastructure Engineer**: [Contact Information]
- **Security Engineer**: [Contact Information]

### **Escalation Process**
1. Check configuration validation
2. Review configuration logs
3. Contact configuration team
4. Escalate to infrastructure team if needed

---

*Last Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')*
