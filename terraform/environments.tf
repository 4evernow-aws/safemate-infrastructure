# Environment Configuration for SafeMate
# This file manages different environments (dev, preprod, prod) with separate resource naming

# Environment Configuration Override
# This extends the existing environment variable with additional validation
locals {
  # Override environment if not set
  effective_environment = var.environment != null ? var.environment : "dev"
  
  # Validate environment
  environment_validation = contains(["dev", "preprod", "prod", "default", "staging"], local.effective_environment) ? true : tobool("Invalid environment: ${local.effective_environment}. Must be one of: dev, preprod, prod, default, staging")
}

# Environment-specific configurations
locals {
  # Environment-specific naming
  env_prefix = local.effective_environment == "dev" ? "dev" : (local.effective_environment == "preprod" ? "preprod" : (local.effective_environment == "prod" ? "prod" : local.effective_environment))
  
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
    staging = {
      hedera_network = "testnet"
      debug_mode     = false
      demo_mode      = false
      log_level      = "INFO"
    }
  }
  
  # Current environment config
  current_env = lookup(local.environment_config, local.effective_environment, local.environment_config["default"])
  
  # API Gateway stage names
  api_stage = local.effective_environment
}

# Output environment information
output "environment_info" {
  description = "Current environment configuration"
  value = {
    environment    = local.effective_environment
    env_prefix     = local.env_prefix
    name_prefix    = local.name_prefix
    api_stage      = local.api_stage
    hedera_network = local.current_env.hedera_network
    debug_mode     = local.current_env.debug_mode
    demo_mode      = local.current_env.demo_mode
  }
}
