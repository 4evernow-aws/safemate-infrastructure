# SafeMate AWS Services Mapping

## Complete Infrastructure Overview

This document provides a detailed mapping of all AWS services used in the SafeMate application, organized by functionality and workflow stage.

---

## 🗂️ Service Categories

### 1. Authentication & Authorization
| Service | Resource | Purpose | Configuration |
|---------|----------|---------|---------------|
| **AWS Cognito** | User Pool | User authentication | `ap-southeast-2_uLgMRpWlw` |
| **AWS Cognito** | App Client | Application integration | `2fg1ckjn1hga2t07lnujpk488a` |
| **AWS Cognito** | Domain | Auth domain hosting | `default-safemate-auth-pscuw96w` |
| **AWS Cognito** | Post-Confirmation Trigger | Auto wallet creation | Lambda trigger |

### 2. Compute Services
| Service | Function Name | Runtime | Purpose |
|---------|---------------|---------|---------|
| **AWS Lambda** | `default-safemate-user-onboarding` | nodejs18.x | Wallet creation |
| **AWS Lambda** | `default-safemate-token-vault` | nodejs18.x | Token management |
| **AWS Lambda** | `default-safemate-wallet-manager` | nodejs18.x | Wallet operations |
| **AWS Lambda** | `default-safemate-hedera-service` | nodejs18.x | Blockchain integration |
| **AWS Lambda** | `default-safemate-group-manager` | nodejs18.x | Group collaboration |
| **AWS Lambda** | `default-safemate-directory-creator` | nodejs18.x | Directory management |
| **AWS Lambda** | `default-safemate-post-confirmation-wallet-creator` | nodejs18.x | Signup trigger |
| **AWS Lambda** | `default-safemate-ultimate-wallet` | nodejs18.x | Consolidated wallet operations |
| **AWS Lambda** | `default-safemate-consolidated-wallet` | nodejs18.x | Legacy wallet operations |

### 3. API Gateway Services
| Service | Gateway ID | Purpose | Base URL |
|---------|------------|---------|----------|
| **API Gateway** | `527ye7o1j0` | User Onboarding & Wallet API | `https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default` |
| **API Gateway** | `229i7zye9f` | Hedera Service API | `https://229i7zye9f.execute-api.ap-southeast-2.amazonaws.com/default` |
| **API Gateway** | `qy3i7ekh08` | Token Vault API | `https://qy3i7ekh08.execute-api.ap-southeast-2.amazonaws.com/default` |
| **API Gateway** | `kmth2kr4hb` | Group Manager API | `https://kmth2kr4hb.execute-api.ap-southeast-2.amazonaws.com/default` |

### 4. Database Services
| Service | Table Name | Purpose | Keys |
|---------|------------|---------|------|
| **DynamoDB** | `default-safemate-wallet-keys` | Encrypted private keys | user_id, account_alias |
| **DynamoDB** | `default-safemate-wallet-metadata` | Wallet information | user_id, wallet_id |
| **DynamoDB** | `default-safemate-wallet-audit` | Wallet operation logs | user_id, timestamp |
| **DynamoDB** | `default-safemate-user-secrets` | User encrypted data | user_id |
| **DynamoDB** | `default-safemate-user-profiles` | User profile data | user_id |
| **DynamoDB** | `default-safemate-user-notifications` | User notifications | user_id, notification_id |
| **DynamoDB** | `default-safemate-groups` | Group definitions | group_id |
| **DynamoDB** | `default-safemate-group-memberships` | Group membership | group_id, user_id |
| **DynamoDB** | `default-safemate-group-permissions` | Group access controls | group_id, permission_id |
| **DynamoDB** | `default-safemate-group-activities` | Group activity logs | group_id, timestamp |
| **DynamoDB** | `default-safemate-group-invitations` | Group invitations | invitation_id |
| **DynamoDB** | `default-safemate-shared-wallets` | Shared wallet configs | wallet_id |
| **DynamoDB** | `default-safemate-hedera-folders` | Hedera file organization | user_id, folder_id |
| **DynamoDB** | `default-safemate-directories` | Directory structure | directory_id |
| **DynamoDB** | `safemate-terraform-lock` | Terraform state locking | LockID |
| **DynamoDB** | `safemate-users` | Legacy user data | user_id |

### 5. Security Services
| Service | Resource | Purpose | Configuration |
|---------|----------|---------|---------------|
| **AWS KMS** | Master Key | Private key encryption | `WALLET_KMS_KEY_ID` |
| **AWS KMS** | App Secrets Key | Application secrets | `APP_SECRETS_KMS_KEY_ID` |
| **IAM** | Lambda Execution Roles | Service permissions | Role-based access |
| **IAM** | API Gateway Policies | API access control | Resource-based policies |

### 6. Content Delivery
| Service | Resource | Purpose | Configuration |
|---------|----------|---------|---------------|
| **CloudFront** | Distribution | CDN and static hosting | `d19a5c2wn4mtdt.cloudfront.net` |
| **S3** | Static Assets | Frontend hosting | Origin for CloudFront |

### 7. Monitoring & Logging
| Service | Resource | Purpose | Retention |
|---------|----------|---------|-----------|
| **CloudWatch** | Lambda Logs | Function execution logs | 14 days |
| **CloudWatch** | API Gateway Logs | API request/response logs | 14 days |
| **CloudWatch** | Application Logs | Custom application logging | 14 days |

---

## 🎯 **NEW: Frontend Architecture**

### **Modular Dashboard System**
| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| **DashboardProvider** | `src/dashboard/core/DashboardProvider.tsx` | Widget state management | ✅ Active |
| **WidgetRegistry** | `src/dashboard/core/WidgetRegistry.tsx` | Widget registration system | ✅ Active |
| **WidgetErrorBoundary** | `src/dashboard/core/WidgetErrorBoundary.tsx` | Error handling | ✅ Active |
| **DashboardGrid** | `src/dashboard/layouts/DashboardGrid.tsx` | Grid layout system | ✅ Active |
| **BaseWidget** | `src/widgets/shared/BaseWidget.tsx` | Base widget component | ✅ Active |

### **Widget Categories**
| Category | Location | Widgets | Status |
|----------|----------|---------|--------|
| **Wallet Widgets** | `src/widgets/wallet/` | Overview, Send, Receive, Details | ✅ Active |
| **Stats Widgets** | `src/widgets/stats/` | Platform statistics | ✅ Active |
| **Action Widgets** | `src/widgets/actions/` | Quick actions | ✅ Active |
| **File Widgets** | `src/widgets/files/` | File management | ✅ Active |
| **Dashboard Widgets** | `src/widgets/dashboard/` | Dashboard-specific | ✅ Active |
| **Analytics Widgets** | `src/widgets/analytics/` | Data visualization | 🔄 Planned |
| **Group Widgets** | `src/widgets/groups/` | Group management | 🔄 Planned |
| **NFT Widgets** | `src/widgets/nft/` | NFT functionality | 🔄 Planned |

### **Navigation Structure**
| Route | Component | Purpose | Status |
|-------|-----------|---------|--------|
| `/app/dashboard` | DashboardRoutes | Modular widget system | ✅ Active |
| `/app/files` | ModernMyFiles | File management | ✅ Active |
| `/app/upload` | ModernUpload | File upload | ✅ Active |
| `/app/wallet` | ModernBlockchainDashboard | Blockchain operations | ✅ Active |
| `/app/shared` | ModernGroupDashboard | Group collaboration | ✅ Active |
| `/app/gallery` | Placeholder | Coming Soon | 🔄 Planned |
| `/app/monetise` | Placeholder | Coming Soon | 🔄 Planned |
| `/app/how-to` | HowToPage | User guide | ✅ Active |
| `/app/help` | HelpPage | Support | ✅ Active |
| `/app/profile` | ModernProfile | User settings | ✅ Active |

---

## 🔄 Service Interaction Flow

### User Registration Flow
```
User → CloudFront → S3 (Frontend)
                ↓
Frontend → API Gateway → Lambda (Auth)
                ↓
Lambda → Cognito User Pool → DynamoDB (User Data)
                ↓
Cognito → Post-Confirmation Trigger → Lambda (Wallet Creation)
                ↓
Lambda → KMS (Encrypt Keys) → DynamoDB (Wallet Data)
```

### User Authentication Flow
```
User → Frontend → Cognito (Sign In)
                ↓
Cognito → JWT Token → Frontend
                ↓
Frontend → Dashboard (Modular Widget System)
                ↓
Widgets → API Gateway → Lambda (Data)
                ↓
Lambda → DynamoDB → Frontend (Response)
```

### Widget System Flow
```
Dashboard → WidgetRegistry → Load Widgets
                ↓
Widgets → DashboardProvider → State Management
                ↓
Widgets → API Gateway → Lambda (Data Fetch)
                ↓
Lambda → DynamoDB/Hedera → Widgets (Display)
```

---

## 📍 Resource Locations

### AWS Region
- **Primary Region**: `ap-southeast-2` (Asia Pacific - Sydney)
- **Availability Zones**: Multi-AZ deployment for high availability

### Resource Naming Convention
```
Pattern: {environment}-{application}-{service-type}[-{specific-identifier}]
Examples:
- default-safemate-user-onboarding
- default-safemate-wallet-keys
- default-safemate-auth-domain
```

---

## 🏗️ Infrastructure as Code

### Terraform Resources
```hcl
# Primary Terraform files location
terraform/
├── main.tf              # Main configuration
├── lambda.tf            # Lambda functions
├── dynamodb.tf          # Database tables
├── cognito.tf           # Authentication
├── api-gateway.tf       # API endpoints
├── iam.tf              # Permissions
├── kms.tf              # Encryption keys
├── cloudfront.tf       # CDN configuration
└── variables.tf        # Configuration variables
```

### Terraform State
- **Backend**: S3 bucket for state storage
- **Locking**: DynamoDB table `safemate-terraform-lock`
- **Workspace**: `default`

---

## 💰 Cost Optimization

### Service Tiers
| Service | Tier | Monthly Estimate |
|---------|------|------------------|
| **Lambda** | Pay per request | $5-20 |
| **DynamoDB** | On-demand | $10-50 |
| **API Gateway** | Pay per request | $3-15 |
| **Cognito** | Pay per user | $5-25 |
| **KMS** | Pay per operation | $1-5 |
| **CloudFront** | Pay per transfer | $2-10 |
| **CloudWatch** | Basic monitoring | $2-8 |

### Cost Controls
- **Lambda**: 30-90 second timeouts
- **DynamoDB**: On-demand billing
- **API Gateway**: Request-based pricing
- **CloudWatch**: 14-day log retention

---

## 🔒 Security Configuration

### Encryption
- **At Rest**: All DynamoDB tables encrypted
- **In Transit**: HTTPS/TLS for all communications
- **KMS**: Customer-managed keys for sensitive data

### Access Control
```json
{
  "Authentication": "AWS Cognito JWT",
  "Authorization": "IAM Roles + Resource Policies",
  "API Security": "API Gateway + Lambda Authorizers",
  "Network Security": "VPC + Security Groups",
  "Data Security": "KMS Encryption + Field-level encryption"
}
```

### CORS Configuration
```json
{
  "AllowedOrigins": ["http://localhost:5173"],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowedHeaders": ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key"],
  "AllowCredentials": true
}
```

---

## 📊 Performance Metrics

### Service Limits
| Service | Limit | Current Usage |
|---------|-------|---------------|
| **Lambda** | 1000 concurrent executions | <10 |
| **API Gateway** | 10,000 requests/second | <100 |
| **DynamoDB** | 40,000 read/write units | On-demand |
| **Cognito** | 100 requests/second | <10 |

### Response Times
| Endpoint | Average | Target |
|----------|---------|--------|
| **Authentication** | 500ms | <1s |
| **Wallet Creation** | 3s | <5s |
| **API Calls** | 200ms | <500ms |
| **Frontend Load** | 2s | <3s |

---

## 🚨 Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery enabled
- **Lambda**: Code stored in version control
- **Configuration**: Infrastructure as Code in Git
- **Secrets**: KMS key backup and rotation

### Recovery Procedures
1. **Infrastructure**: Terraform re-deployment
2. **Data**: DynamoDB point-in-time recovery
3. **Code**: Git repository restoration
4. **Secrets**: KMS key recovery

---

## 📞 Support Resources

### AWS Support
- **Support Plan**: Basic (included)
- **Documentation**: AWS documentation links
- **Monitoring**: CloudWatch dashboards
- **Alerting**: CloudWatch alarms for critical metrics

### Troubleshooting
- **Logs**: CloudWatch log groups for each service
- **Metrics**: Custom metrics for application performance
- **Tracing**: Lambda function execution tracking
- **Debugging**: Detailed error logging and stack traces

---

*Last Updated: January 2025*
*Environment: Production (ap-southeast-2)*
*Status: All services operational*
