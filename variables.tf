variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "bucket_name" {
  description = "S3 bucket name for Terraform state"
  type        = string
  default     = "safemate-terraform-state-management"
}

variable "image_tag" {
  description = "Docker image tag for ECS deployment"
  type        = string
  default     = "latest"
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

variable "app_url" {
  description = "Application URL for Cognito callback configuration"
  type        = string
  default     = ""
}

variable "hedera_network" {
  description = "Hedera network to use (testnet or mainnet)"
  type        = string
  default     = "testnet"
  
  validation {
    condition     = contains(["testnet", "mainnet"], var.hedera_network)
    error_message = "Hedera network must be either 'testnet' or 'mainnet'."
  }
}

# Auto-detect environment from workspace name
locals {
  environment = var.environment != null ? var.environment : terraform.workspace
  name_prefix = "${local.environment}-${var.app_name}"
  
  # Environment-specific configurations
  environment_configs = {
    "dev-2"      = { log_retention = 3, ecs_desired_count = 1, container_insights = false }
    "dev-3"      = { log_retention = 3, ecs_desired_count = 1, container_insights = false }
    "test"       = { log_retention = 7, ecs_desired_count = 1, container_insights = true }
    "staging"    = { log_retention = 14, ecs_desired_count = 1, container_insights = true }
    "production" = { log_retention = 30, ecs_desired_count = 2, container_insights = true }
    "default"    = { log_retention = 7, ecs_desired_count = 1, container_insights = false }
  }
  
  config = lookup(local.environment_configs, local.environment, local.environment_configs["default"])
}

 