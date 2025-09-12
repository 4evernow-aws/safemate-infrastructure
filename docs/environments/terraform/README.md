# SafeMate Terraform Configuration

## 🏗️ **Overview**

This guide covers Terraform configuration for SafeMate infrastructure as code, including workspace management, resource definitions, and environment-specific configurations.

## 📁 **Terraform Structure**

### **Directory Layout**
```
terraform/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Variable definitions
├── environments.tf         # Environment-specific logic
├── outputs.tf              # Output values
├── providers.tf            # Provider configurations
├── dev.tfvars              # Development environment variables
├── preprod.tfvars          # Pre-production environment variables
├── prod.tfvars             # Production environment variables
├── modules/                # Reusable Terraform modules
│   ├── lambda/             # Lambda function module
│   ├── dynamodb/           # DynamoDB table module
│   ├── api-gateway/        # API Gateway module
│   └── monitoring/         # Monitoring resources module
└── backend.tf              # Backend configuration
```

## 🔧 **Workspace Management**

### **Workspace Setup**
```bash
# Initialize Terraform
terraform init

# Create workspaces for each environment
terraform workspace new dev
terraform workspace new preprod
terraform workspace new prod

# List workspaces
terraform workspace list

# Switch to development workspace
terraform workspace select dev
```

### **Workspace Configuration**
```hcl
# backend.tf - S3 backend configuration
terraform {
  backend "s3" {
    bucket = "safemate-terraform-state"
    key    = "environments/terraform.tfstate"
    region = "us-east-1"
    
    # Enable state locking with DynamoDB
    dynamodb_table = "safemate-terraform-locks"
    encrypt        = true
  }
  
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

## 📊 **Variable Definitions**

### **Global Variables**
```hcl
# variables.tf
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

variable "bucket_name" {
  description = "S3 bucket name for Terraform state"
  type        = string
  default     = "safemate-terraform-state"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "app_url" {
  description = "Application URL"
  type        = string
  default     = "https://d19a5c2wn4mtdt.cloudfront.net/"
}

variable "hedera_network" {
  description = "Hedera network (testnet or mainnet)"
  type        = string
  default     = "testnet"
  
  validation {
    condition     = contains(["testnet", "mainnet"], var.hedera_network)
    error_message = "Hedera network must be either 'testnet' or 'mainnet'."
  }
}
```

### **Environment-Specific Variables**
```hcl
# environments.tf
locals {
  # Auto-detect environment from workspace name
  environment = var.environment != null ? var.environment : terraform.workspace
  name_prefix = "${local.environment}-${var.app_name}"
  
  # Environment-specific configurations
  environment_configs = {
    "dev" = {
      log_retention = 3
      ecs_desired_count = 1
      container_insights = false
      hedera_network = "testnet"
      debug_mode = true
      demo_mode = true
    }
    "preprod" = {
      log_retention = 7
      ecs_desired_count = 1
      container_insights = true
      hedera_network = "testnet"
      debug_mode = false
      demo_mode = false
    }
    "prod" = {
      log_retention = 30
      ecs_desired_count = 2
      container_insights = true
      hedera_network = "mainnet"
      debug_mode = false
      demo_mode = false
    }
    "default" = {
      log_retention = 7
      ecs_desired_count = 1
      container_insights = false
      hedera_network = "testnet"
      debug_mode = true
      demo_mode = true
    }
  }
  
  config = lookup(local.environment_configs, local.environment, local.environment_configs["default"])
}
```

## 🏗️ **Resource Definitions**

### **Provider Configuration**
```hcl
# providers.tf
provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Environment = local.environment
      Project     = var.app_name
      ManagedBy   = "terraform"
    }
  }
}

# Configure additional providers as needed
provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}
```

### **Main Configuration**
```hcl
# main.tf
# S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = var.bucket_name
  
  tags = {
    Name        = "Terraform State"
    Environment = local.environment
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name           = "safemate-terraform-locks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
  
  tags = {
    Name        = "Terraform Locks"
    Environment = local.environment
  }
}

# Lambda functions
module "lambda_functions" {
  source = "./modules/lambda"
  
  environment = local.environment
  app_name    = var.app_name
  region      = var.region
  
  functions = {
    wallet_manager = {
      handler = "index.handler"
      runtime = "nodejs18.x"
      timeout = 30
      memory_size = 256
    }
    user_onboarding = {
      handler = "index.handler"
      runtime = "nodejs18.x"
      timeout = 60
      memory_size = 512
    }
    hedera_service = {
      handler = "index.handler"
      runtime = "nodejs18.x"
      timeout = 30
      memory_size = 256
    }
  }
}

# DynamoDB tables
module "dynamodb_tables" {
  source = "./modules/dynamodb"
  
  environment = local.environment
  app_name    = var.app_name
  
  tables = {
    users = {
      hash_key = "userId"
      attributes = [
        {
          name = "userId"
          type = "S"
        }
      ]
    }
    wallets = {
      hash_key = "walletId"
      attributes = [
        {
          name = "walletId"
          type = "S"
        }
      ]
    }
    transactions = {
      hash_key = "transactionId"
      range_key = "timestamp"
      attributes = [
        {
          name = "transactionId"
          type = "S"
        },
        {
          name = "timestamp"
          type = "S"
        }
      ]
    }
  }
}

# API Gateway
module "api_gateway" {
  source = "./modules/api-gateway"
  
  environment = local.environment
  app_name    = var.app_name
  
  lambda_functions = module.lambda_functions.function_arns
  
  routes = {
    "POST /wallet/create" = "wallet_manager"
    "GET /wallet/{id}" = "wallet_manager"
    "POST /user/onboard" = "user_onboarding"
    "GET /user/{id}" = "user_onboarding"
    "POST /hedera/transaction" = "hedera_service"
  }
}

# Monitoring resources
module "monitoring" {
  source = "./modules/monitoring"
  
  environment = local.environment
  app_name    = var.app_name
  
  lambda_functions = module.lambda_functions.function_names
  api_gateway_id   = module.api_gateway.api_id
}
```

## 📋 **Environment-Specific Configurations**

### **Development Environment**
```hcl
# dev.tfvars
environment = "dev"
hedera_network = "testnet"
debug_mode = true
demo_mode = true

# Development-specific settings
lambda_timeout = 30
lambda_memory_size = 256
dynamodb_billing_mode = "PAY_PER_REQUEST"

# Development URLs
app_url = "http://localhost:5173/"
api_url = "https://dev-api.safemate.com/"

# Development costs (Free Tier)
enable_free_tier_optimization = true
disable_expensive_services = true
```

### **Pre-Production Environment**
```hcl
# preprod.tfvars
environment = "preprod"
hedera_network = "testnet"
debug_mode = false
demo_mode = false

# Pre-production-specific settings
lambda_timeout = 60
lambda_memory_size = 512
dynamodb_billing_mode = "PAY_PER_REQUEST"

# Pre-production URLs
app_url = "https://d19a5c2wn4mtdt.cloudfront.net/"
api_url = "https://preprod-api.safemate.com/"

# Pre-production monitoring
enable_detailed_monitoring = true
enable_container_insights = true
```

### **Production Environment**
```hcl
# prod.tfvars
environment = "prod"
hedera_network = "mainnet"
debug_mode = false
demo_mode = false

# Production-specific settings
lambda_timeout = 60
lambda_memory_size = 1024
dynamodb_billing_mode = "PROVISIONED"

# Production URLs
app_url = "https://d19a5c2wn4mtdt.cloudfront.net/"
api_url = "https://api.safemate.com/"

# Production security
enable_encryption = true
enable_backup = true
enable_monitoring = true
```

## 🔧 **Terraform Modules**

### **Lambda Module**
```hcl
# modules/lambda/main.tf
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "functions" {
  description = "Lambda function configurations"
  type        = map(object({
    handler     = string
    runtime     = string
    timeout     = number
    memory_size = number
  }))
}

locals {
  name_prefix = "${var.environment}-${var.app_name}"
}

resource "aws_lambda_function" "functions" {
  for_each = var.functions
  
  filename         = "lambda-${each.key}.zip"
  function_name    = "${local.name_prefix}-${each.key}"
  role            = aws_iam_role.lambda_role.arn
  handler         = each.value.handler
  runtime         = each.value.runtime
  timeout         = each.value.timeout
  memory_size     = each.value.memory_size
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = var.region
    }
  }
  
  tags = {
    Name = "${local.name_prefix}-${each.key}"
    Environment = var.environment
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

output "function_arns" {
  description = "Lambda function ARNs"
  value = {
    for k, v in aws_lambda_function.functions : k => v.arn
  }
}

output "function_names" {
  description = "Lambda function names"
  value = {
    for k, v in aws_lambda_function.functions : k => v.function_name
  }
}
```

### **DynamoDB Module**
```hcl
# modules/dynamodb/main.tf
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "tables" {
  description = "DynamoDB table configurations"
  type        = map(object({
    hash_key   = string
    range_key  = optional(string)
    attributes = list(object({
      name = string
      type = string
    }))
  }))
}

locals {
  name_prefix = "${var.environment}-${var.app_name}"
}

resource "aws_dynamodb_table" "tables" {
  for_each = var.tables
  
  name           = "${local.name_prefix}-${each.key}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = each.value.hash_key
  range_key      = each.value.range_key
  
  dynamic "attribute" {
    for_each = each.value.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }
  
  server_side_encryption {
    enabled = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name = "${local.name_prefix}-${each.key}"
    Environment = var.environment
  }
}

output "table_names" {
  description = "DynamoDB table names"
  value = {
    for k, v in aws_dynamodb_table.tables : k => v.name
  }
}

output "table_arns" {
  description = "DynamoDB table ARNs"
  value = {
    for k, v in aws_dynamodb_table.tables : k => v.arn
  }
}
```

## 📊 **Outputs**

### **Output Definitions**
```hcl
# outputs.tf
output "environment_info" {
  description = "Current environment configuration"
  value = {
    environment    = local.environment
    name_prefix    = local.name_prefix
    hedera_network = local.config.hedera_network
    debug_mode     = local.config.debug_mode
    demo_mode      = local.config.demo_mode
  }
}

output "lambda_functions" {
  description = "Lambda function information"
  value = {
    function_names = module.lambda_functions.function_names
    function_arns  = module.lambda_functions.function_arns
  }
}

output "dynamodb_tables" {
  description = "DynamoDB table information"
  value = {
    table_names = module.dynamodb_tables.table_names
    table_arns  = module.dynamodb_tables.table_arns
  }
}

output "api_gateway" {
  description = "API Gateway information"
  value = {
    api_id = module.api_gateway.api_id
    api_url = module.api_gateway.api_url
  }
}

output "terraform_backend" {
  description = "Terraform backend information"
  value = {
    state_bucket = aws_s3_bucket.terraform_state.bucket
    lock_table   = aws_dynamodb_table.terraform_locks.name
  }
}
```

## 🚀 **Deployment Commands**

### **Development Deployment**
```bash
# Switch to development workspace
terraform workspace select dev

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="dev.tfvars"

# Apply changes
terraform apply -var-file="dev.tfvars"
```

### **Pre-Production Deployment**
```bash
# Switch to pre-production workspace
terraform workspace select preprod

# Plan deployment
terraform plan -var-file="preprod.tfvars"

# Apply changes
terraform apply -var-file="preprod.tfvars"
```

### **Production Deployment**
```bash
# Switch to production workspace
terraform workspace select prod

# Plan deployment
terraform plan -var-file="prod.tfvars"

# Apply changes (with confirmation)
terraform apply -var-file="prod.tfvars"
```

## 🔍 **Terraform Commands Reference**

### **Basic Commands**
```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format configuration files
terraform fmt

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy resources
terraform destroy

# Show current state
terraform show

# List resources
terraform state list

# Import existing resources
terraform import aws_lambda_function.example function-name
```

### **Workspace Commands**
```bash
# List workspaces
terraform workspace list

# Create new workspace
terraform workspace new <name>

# Select workspace
terraform workspace select <name>

# Show current workspace
terraform workspace show

# Delete workspace
terraform workspace delete <name>
```

### **State Management**
```bash
# Show state
terraform state show aws_lambda_function.example

# Move resource
terraform state mv aws_lambda_function.old aws_lambda_function.new

# Remove resource from state
terraform state rm aws_lambda_function.example

# Pull state from remote
terraform state pull

# Push state to remote
terraform state push
```

## 📚 **Best Practices**

### **Configuration Best Practices**
- Use consistent naming conventions
- Implement proper tagging strategy
- Use variables for environment-specific values
- Implement state locking with DynamoDB
- Use remote state storage with S3
- Enable state encryption

### **Module Best Practices**
- Create reusable modules
- Use consistent module structure
- Implement proper variable validation
- Use conditional resources when needed
- Document module usage

### **Security Best Practices**
- Use least privilege IAM policies
- Enable encryption for all resources
- Implement proper access controls
- Use secure backend configuration
- Regularly rotate access keys

### **Cost Optimization**
- Use appropriate instance types
- Implement auto-scaling policies
- Use spot instances where possible
- Monitor resource usage
- Implement cost alerts

---

*Last Updated: 2025-08-26 12:18:00*
