# Development Environment

## 🚀 **Development Environment Overview**

The SafeMate development environment is designed for local development and testing. It provides a cost-effective, isolated environment for developers to build and test features before deploying to staging and production.

## 🎯 **Environment Characteristics**

### **📊 Configuration Summary**
- **Environment Name**: `dev`
- **AWS Region**: `us-east-1`
- **Hedera Network**: `testnet`
- **Debug Mode**: ✅ Enabled
- **Demo Mode**: ✅ Enabled
- **Cost Profile**: Free Tier (~$1.40/month)
- **Deployment Method**: Manual via PowerShell scripts

### **🔧 Key Features**
- **Local Development Server**: http://localhost:5173/
- **AWS Integration**: Lambda, API Gateway, DynamoDB, Cognito
- **Blockchain Integration**: Hedera Testnet
- **Debug Tools**: Enhanced logging and error reporting
- **Demo Data**: Pre-configured test data for development

## 🛠️ **Setup Instructions**

### **Prerequisites**
1. **Node.js**: Version 18+ installed
2. **PowerShell**: Windows PowerShell 5.1+
3. **AWS CLI**: Configured with development credentials
4. **Terraform**: Version 1.0+ installed
5. **Git**: For version control

### **Step 1: Clone and Setup**
```powershell
# Clone the repository
git clone https://github.com/your-org/safemate_v2.git
cd safemate_v2

# Install dependencies
npm install
```

### **Step 2: Configure AWS Credentials**
```powershell
# Configure AWS CLI for development
aws configure --profile safemate-dev

# Set environment variables
$env:AWS_PROFILE = "safemate-dev"
$env:AWS_REGION = "us-east-1"
```

### **Step 3: Deploy Development Environment**
```powershell
# Deploy development environment
.\deploy-dev.ps1
```

### **Step 4: Start Local Development Server**
```powershell
# Navigate to frontend directory
cd migration-20250909-191548\safemate-frontend

# Start development server
npm run dev
```

## 📁 **Directory Structure**

```
safemate_v2/
├── 📁 migration-20250909-191548/
│   └── safemate-frontend/     # Frontend application
│       ├── src/               # Source code
│       ├── public/            # Static assets
│       ├── .env.development   # Development environment variables
│       └── package.json       # Frontend dependencies
├── 📁 terraform/
│   ├── cognito.tf            # Cognito User Pool configuration
│   ├── environments.tf       # Environment configuration
│   └── [other terraform files]
├── 📄 deploy-dev.ps1         # Development deployment script
└── 📄 package.json           # Root package.json
```

## ⚙️ **Configuration Files**

### **Frontend Configuration** (`migration-20250909-191548/safemate-frontend/.env.development`)
```env
VITE_DEBUG_MODE=true
VITE_DEMO_MODE=false
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

### **Terraform Configuration** (`terraform/dev.tfvars`)
```hcl
environment = "dev"
hedera_network = "testnet"
debug_mode = true
demo_mode = true
app_url = "http://localhost:5173"
bucket_name = "dev-safemate-assets"
image_tag = "latest"
```

## 🚀 **Deployment Process**

### **Manual Deployment**
```powershell
# Deploy development environment
.\deploy-dev.ps1
```

### **Deployment Script Details**
The `deploy-dev.ps1` script performs the following steps:
1. Sets environment variables for development
2. Initializes Terraform
3. Plans the deployment using `dev.tfvars`
4. Applies the infrastructure changes
5. Displays deployment outputs and URLs

### **Deployment Outputs**
After successful deployment, you'll see:
- **Onboarding API URL**: `https://kbfs45jmnk.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Vault API URL**: `https://73r0aby0k4.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Wallet API URL**: `https://8k2qwmk56d.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Hedera API URL**: `https://vevhttzt1d.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Group API URL**: `https://f0v9l8afc0.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Cognito User Pool ID**: `ap-southeast-2_bUngJqSfu`
- **Cognito Client ID**: `67vhj24nj2b0rrtvhppevv9its`
- **Cognito Domain**: `dev-safemate-auth-7h6ewch5`
- **S3 Bucket**: `dev-safemate-static-hosting`
- **CloudFront URL**: `https://d2lmqwi5ye891h.cloudfront.net`

### **Pre-Production Configuration**
For pre-production environment (https://d19a5c2wn4mtdt.cloudfront.net/):
- **Cognito User Pool ID**: `ap-southeast-2_pMo5BXFiM`
- **Cognito Client ID**: `1a0trpjfgv54odl9csqlcbkuii`
- **Environment File**: Use `.env.preprod` for pre-production builds

## 🧪 **Testing Procedures**

### **Local Testing**
```powershell
# Start development server
cd apps\web\safemate
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### **API Testing**
```powershell
# Test API endpoints
.\test-safemate-api.ps1

# Test Lambda functions
.\test-lambda-simple.ps1
```

### **Blockchain Testing**
```powershell
# Test Hedera integration
.\test-hedera-api.ps1

# Test wallet creation
.\test-wallet-creation.ps1
```

## 🔧 **Development Workflow**

### **Daily Development Process**
1. **Start Development Server**: `npm run dev` in `migration-20250909-191548/safemate-frontend/`
2. **Make Code Changes**: Edit files in `src/` directory
3. **Test Locally**: Use browser at http://localhost:5173/
4. **Test AWS Integration**: Use provided test scripts
5. **Commit Changes**: Follow Git workflow guidelines

### **Feature Development**
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Develop Feature**: Implement in development environment
3. **Test Thoroughly**: Use all available test scripts
4. **Deploy to Dev**: Use `deploy-dev.ps1` if AWS changes needed
5. **Create Pull Request**: Merge to `dev` branch

## 📊 **Monitoring and Logging**

### **CloudWatch Logs**
- **Lambda Logs**: `/aws/lambda/dev-safemate-*`
- **API Gateway Logs**: `/aws/apigateway/dev-safemate-api`
- **Application Logs**: `/aws/safemate/dev`

### **Local Logging**
```javascript
// Debug logging (only in development)
if (import.meta.env.VITE_DEBUG_MODE === 'true') {
    console.log('Debug info:', data);
}
```

### **Error Tracking**
- **Frontend Errors**: Browser console and error boundaries
- **Backend Errors**: CloudWatch Lambda logs
- **API Errors**: API Gateway logs and CloudWatch metrics

## 🛡️ **Security Considerations**

### **Development Security**
- **Local Access Only**: Development server accessible only locally
- **Test Data**: No real user data in development
- **Debug Mode**: Enhanced logging for troubleshooting
- **Demo Mode**: Pre-configured test accounts

### **AWS Security**
- **IAM Roles**: Minimal permissions for development
- **VPC**: Default VPC configuration
- **Encryption**: Standard AWS encryption
- **Access Control**: Developer access only

## 💰 **Cost Management**

### **Free Tier Resources**
- **Lambda**: 1M requests/month free
- **API Gateway**: 1M requests/month free
- **DynamoDB**: 25GB storage free
- **CloudWatch**: Basic monitoring free

### **Paid Resources**
- **KMS**: ~$1/month for key management
- **Secrets Manager**: ~$0.40/month for secrets storage

### **Cost Optimization**
- **Auto-scaling**: Disabled in development
- **Log Retention**: 3 days (minimum)
- **Resource Cleanup**: Regular cleanup of unused resources

## 🔄 **Maintenance Procedures**

### **Regular Maintenance**
```powershell
# Clean up old logs
aws logs delete-log-group --log-group-name /aws/lambda/dev-safemate-* --force

# Update dependencies
npm update

# Clean Terraform state
terraform state list
terraform state rm [unused-resources]
```

### **Environment Reset**
```powershell
# Destroy and recreate environment
terraform destroy -var-file="dev.tfvars"
.\deploy-dev.ps1
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Development Server Won't Start**
```powershell
# Kill existing processes
taskkill /F /IM node.exe

# Clear cache
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue

# Restart server
npm run dev
```

#### **AWS Deployment Fails**
```powershell
# Check AWS credentials
aws sts get-caller-identity

# Validate Terraform
terraform validate

# Check for conflicts
terraform plan -var-file="dev.tfvars"
```

#### **API Integration Issues**
```powershell
# Test API connectivity
.\test-api-simple.ps1

# Check CORS configuration
.\test-cors-fix.js

# Verify Lambda permissions
.\test-lambda-diagnosis.ps1
```

### **Debug Mode Features**
- **Enhanced Logging**: Detailed request/response logging
- **Error Details**: Full error stack traces
- **Performance Metrics**: Request timing information
- **State Inspection**: Component state debugging

## 📚 **Related Documentation**

- [Environment Configuration](../configuration/README.md)
- [Terraform Configuration](../terraform/README.md)
- [AWS Resource Management](../aws-resources/README.md)
- [Troubleshooting Guides](../../troubleshooting/)
- [API Documentation](../../api/)

## 📞 **Support**

### **Development Team**
- **Lead Developer**: [Contact Information]
- **DevOps Engineer**: [Contact Information]
- **QA Engineer**: [Contact Information]

### **Escalation Process**
1. Check troubleshooting guides
2. Review CloudWatch logs
3. Contact development team
4. Escalate to DevOps if needed

---

*Last Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')*
