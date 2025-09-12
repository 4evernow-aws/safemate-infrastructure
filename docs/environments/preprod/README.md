# Pre-Production Environment

## 🚀 **Pre-Production Environment Overview**

The pre-production environment serves as a staging environment for SafeMate, providing a production-like environment for integration testing, user acceptance testing, and stakeholder demonstrations.

### **🌐 Environment Details**
- **URL**: `https://d19a5c2wn4mtdt.cloudfront.net`
- **AWS Region**: `ap-southeast-2` (Sydney)
- **Hedera Network**: Testnet
- **Environment**: `preprod`
- **Status**: 🚀 **Ready to Deploy**

## 🏗️ **Environment Characteristics**

### **Purpose**
- Integration testing and validation
- User acceptance testing (UAT)
- Stakeholder demonstrations
- Performance testing
- Security testing

### **Configuration**
- **Debug Mode**: Disabled
- **Demo Mode**: Disabled
- **Log Level**: INFO
- **Hedera Network**: Testnet
- **Resource Naming**: `preprod-safemate-*`

### **Access Control**
- Development team access
- QA team access
- Stakeholder access (read-only)
- Controlled deployment process

## 📁 **Directory Structure**

```
terraform/
├── preprod.tfvars          # Pre-production configuration
├── environments.tf         # Environment-specific settings
├── lambda.tf              # Lambda functions
├── dynamodb.tf            # Database tables
├── cognito.tf             # Authentication
├── api_gateway.tf         # API endpoints
└── outputs.tf             # Environment outputs
```

## ⚙️ **Configuration Files**

### **Pre-Production Variables** (`terraform/preprod.tfvars`)
```hcl
environment = "preprod"
hedera_network = "testnet"
debug_mode = false
demo_mode = false
app_url = "https://d19a5c2wn4mtdt.cloudfront.net"
bucket_name = "safemate-terraform-state-management"
image_tag = "preprod-latest"
```

### **Environment Configuration** (`terraform/environments.tf`)
```hcl
preprod = {
  hedera_network = "testnet"
  debug_mode     = false
  demo_mode      = false
  log_level      = "INFO"
}
```

## 🚀 **Deployment Process**

### **Quick Deployment**
```powershell
# Run the pre-production deployment script
.\deploy-preprod-only.ps1
```

### **Manual Deployment**
```powershell
# Navigate to terraform directory
cd terraform

# Switch to preprod workspace
terraform workspace select preprod

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan -var-file="preprod.tfvars" -out="preprod-plan.out"

# Apply deployment
terraform apply "preprod-plan.out"
```

### **Deployment Script Details**
The `deploy-preprod-only.ps1` script:
1. Sets environment variables
2. Switches to preprod workspace
3. Initializes and validates Terraform
4. Plans the deployment
5. Prompts for confirmation
6. Applies the deployment
7. Shows deployment outputs

## 🔧 **AWS Resources**

### **API Gateway Services**
- **Group API**: `https://[api-id].execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Hedera API**: `https://[api-id].execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Onboarding API**: `https://[api-id].execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Vault API**: `https://[api-id].execute-api.ap-southeast-2.amazonaws.com/preprod`
- **Wallet API**: `https://[api-id].execute-api.ap-southeast-2.amazonaws.com/preprod`

### **Lambda Functions**
- **Hedera Service**: `preprod-safemate-hedera-service`
- **User Onboarding**: `preprod-safemate-user-onboarding`
- **Token Vault**: `preprod-safemate-token-vault`
- **Wallet Manager**: `preprod-safemate-wallet-manager`

### **Database Tables**
- **Wallet Audit**: `preprod-safemate-wallet-audit`
- **Wallet Keys**: `preprod-safemate-wallet-keys`
- **Wallet Metadata**: `preprod-safemate-wallet-metadata`
- **User Profiles**: `preprod-safemate-user-profiles`
- **Groups**: `preprod-safemate-groups`
- **Files**: `preprod-safemate-files`
- **Folders**: `preprod-safemate-folders`

### **Authentication & Security**
- **Cognito User Pool**: `preprod-safemate-user-pool`
- **Cognito Domain**: `preprod-safemate-auth-[suffix]`
- **KMS Master Key**: `alias/safemate-master-key-preprod`
- **Secrets Manager**: `safemate/hedera/private-keys-preprod`

## 🧪 **Testing Procedures**

### **Integration Testing**
1. **API Endpoint Testing**
   - Test all API endpoints
   - Verify authentication flows
   - Test error handling

2. **Database Testing**
   - Test CRUD operations
   - Verify data consistency
   - Test backup/restore procedures

3. **Authentication Testing**
   - Test user registration/login
   - Verify role-based access
   - Test password reset flows

### **Performance Testing**
1. **Load Testing**
   - Test API response times
   - Verify concurrent user handling
   - Monitor resource usage

2. **Stress Testing**
   - Test system limits
   - Verify error handling under load
   - Monitor CloudWatch metrics

### **Security Testing**
1. **Authentication Security**
   - Test authentication bypass attempts
   - Verify token validation
   - Test session management

2. **Authorization Testing**
   - Test role-based access control
   - Verify data isolation
   - Test privilege escalation attempts

## 📊 **Monitoring & Alerting**

### **CloudWatch Metrics**
- **API Gateway**: Request count, latency, error rate
- **Lambda**: Invocation count, duration, error rate
- **DynamoDB**: Read/write capacity, throttling
- **Cognito**: Authentication success/failure rates

### **Log Monitoring**
- **Application Logs**: INFO level logging
- **Error Logs**: Error tracking and alerting
- **Security Logs**: Authentication and authorization events

### **Alerting**
- **High Error Rates**: API Gateway and Lambda errors
- **Performance Issues**: High latency alerts
- **Security Events**: Failed authentication attempts
- **Resource Usage**: High resource utilization

## 🔒 **Security Configuration**

### **Network Security**
- **Security Groups**: Restricted access to resources
- **VPC Configuration**: Private subnets for databases
- **API Gateway**: HTTPS only, CORS configured

### **Data Protection**
- **Encryption**: KMS encryption for sensitive data
- **Secrets Management**: AWS Secrets Manager for keys
- **Access Control**: IAM roles and policies

### **Authentication & Authorization**
- **Cognito User Pool**: Multi-factor authentication
- **API Authorization**: Cognito authorizers
- **Role-Based Access**: Fine-grained permissions

## 🛠️ **Maintenance Procedures**

### **Regular Maintenance**
1. **Weekly**
   - Review CloudWatch metrics
   - Check for security updates
   - Verify backup procedures

2. **Monthly**
   - Performance optimization
   - Security audit
   - Cost optimization review

### **Update Procedures**
1. **Configuration Updates**
   - Update Terraform configuration
   - Plan and test changes
   - Deploy during maintenance window

2. **Application Updates**
   - Deploy new Lambda functions
   - Update API Gateway configuration
   - Test all endpoints

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Deployment Failures**
```powershell
# Check Terraform state
terraform state list

# Validate configuration
terraform validate

# Check workspace
terraform workspace show
```

#### **API Gateway Issues**
```powershell
# Check API Gateway logs
aws logs describe-log-groups --log-group-name-prefix "API-Gateway-Execution-Logs"

# Test API endpoints
curl -X GET "https://[api-id].execute-api.ap-southeast-2.amazonaws.com/preprod/health"
```

#### **Lambda Function Issues**
```powershell
# Check Lambda logs
aws logs describe-log-streams --log-group-name "preprod-safemate-[function-name]"

# Test Lambda function
aws lambda invoke --function-name "preprod-safemate-[function-name]" --payload '{}' response.json
```

### **Support Resources**
- **AWS Console**: CloudWatch, Lambda, API Gateway
- **Terraform State**: `terraform state show [resource]`
- **Logs**: CloudWatch Logs for detailed debugging

## 📋 **Checklist**

### **Pre-Deployment**
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security review completed
- [ ] Performance testing completed

### **Deployment**
- [ ] Terraform workspace selected
- [ ] Configuration validated
- [ ] Deployment plan reviewed
- [ ] Stakeholder approval obtained
- [ ] Deployment executed

### **Post-Deployment**
- [ ] All endpoints tested
- [ ] Authentication working
- [ ] Database connectivity verified
- [ ] Monitoring configured
- [ ] Stakeholder notification sent

## 📞 **Support**

### **Emergency Contacts**
- **Development Team**: Primary support
- **DevOps Team**: Infrastructure issues
- **Security Team**: Security incidents

### **Escalation Procedures**
1. **Level 1**: Development team investigation
2. **Level 2**: DevOps team involvement
3. **Level 3**: Security team review
4. **Level 4**: Management escalation

---

*Last Updated: 2025-01-26*
*Next Review: 2025-02-26*
