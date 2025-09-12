# SafeMate v2 - Cost Optimization Configuration
# This file contains optimizations to reduce AWS costs in preprod environment

# Cost optimization variables
locals {
  # Environment-specific cost optimizations
  cost_optimized = var.environment == "preprod" ? true : false
  
  # Reduced memory sizes for preprod
  lambda_memory_sizes = {
    token_vault = var.environment == "preprod" ? 128 : 256
    hedera_service = var.environment == "preprod" ? 256 : 512
    wallet_manager = var.environment == "preprod" ? 128 : 256
    user_onboarding = var.environment == "preprod" ? 256 : 512
    directory_creator = var.environment == "preprod" ? 128 : 256
    group_manager = var.environment == "preprod" ? 128 : 256
    post_confirmation = var.environment == "preprod" ? 128 : 256
  }
  
  # Reduced timeouts for preprod
  lambda_timeouts = {
    token_vault = var.environment == "preprod" ? 15 : 30
    hedera_service = var.environment == "preprod" ? 30 : 90
    wallet_manager = var.environment == "preprod" ? 15 : 60
    user_onboarding = var.environment == "preprod" ? 30 : 90
    directory_creator = var.environment == "preprod" ? 15 : 30
    group_manager = var.environment == "preprod" ? 15 : 30
    post_confirmation = var.environment == "preprod" ? 15 : 30
  }
  
  # Reduced CloudWatch log retention for preprod
  log_retention_days = var.environment == "preprod" ? 3 : 14
  
  # Reduced DynamoDB point-in-time recovery for preprod
  enable_pitr = var.environment == "preprod" ? false : true
  
  # Reduced DynamoDB streams for preprod
  enable_streams = var.environment == "preprod" ? false : true
}

# Cost optimization for Lambda functions
resource "aws_lambda_function" "token_vault_optimized" {
  count = local.cost_optimized ? 1 : 0
  
  filename         = "../services/token-vault/token-vault.zip"
  function_name    = "${local.name_prefix}-token-vault"
  role            = aws_iam_role.vault_lambda_exec.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("../services/token-vault/token-vault.zip")
  runtime         = "nodejs18.x"
  timeout         = local.lambda_timeouts.token_vault
  memory_size     = local.lambda_memory_sizes.token_vault
  
  environment {
    variables = {
      USER_SECRETS_TABLE     = aws_dynamodb_table.user_secrets.name
      WALLET_KEYS_TABLE      = aws_dynamodb_table.wallet_keys.name
      WALLET_METADATA_TABLE  = aws_dynamodb_table.wallet_metadata.name
      TOKEN_VAULT_KMS_KEY_ID = aws_kms_key.safemate_master_key.key_id
      APP_SECRETS_KMS_KEY_ID = aws_kms_key.safemate_master_key.key_id
      HEDERA_NETWORK         = "testnet"
    }
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
    Component   = "token-vault"
    CostOptimized = "true"
  }
}

# Cost optimization for DynamoDB tables
resource "aws_dynamodb_table" "user_secrets_optimized" {
  count = local.cost_optimized ? 1 : 0
  
  name           = "${local.name_prefix}-user-secrets"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.safemate_master_key.arn
  }

  # Disable point-in-time recovery for preprod to save costs
  point_in_time_recovery {
    enabled = local.enable_pitr
  }

  tags = {
    Name        = "${local.name_prefix}-user-secrets"
    Environment = var.environment
    CostOptimized = "true"
  }
}

# Cost optimization for CloudWatch logs
resource "aws_cloudwatch_log_group" "token_vault_logs_optimized" {
  count = local.cost_optimized ? 1 : 0
  
  name              = "/aws/lambda/${local.name_prefix}-token-vault"
  retention_in_days = local.log_retention_days

  tags = {
    Environment = var.environment
    Application = var.app_name
    Component   = "token-vault"
    CostOptimized = "true"
  }
}

# Cost monitoring and alerts
resource "aws_cloudwatch_metric_alarm" "preprod_cost_alert" {
  count = var.environment == "preprod" ? 1 : 0
  
  alarm_name          = "preprod-safemate-cost-alert"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"
  statistic           = "Maximum"
  threshold           = "20"  # Alert if costs exceed $20/month
  alarm_description   = "This metric monitors preprod environment costs"
  alarm_actions       = []

  dimensions = {
    Currency = "USD"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
    Component   = "cost-monitoring"
  }
}

# S3 lifecycle policy for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "static_hosting_optimization" {
  count = local.cost_optimized ? 1 : 0
  
  bucket = aws_s3_bucket.static_hosting.id

  rule {
    id     = "preprod_cost_optimization"
    status = "Enabled"
    
    filter {
      prefix = ""
    }

    # Delete old versions after 7 days
    noncurrent_version_expiration {
      noncurrent_days = 7
    }

    # Delete incomplete multipart uploads after 1 day
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }

    # Transition to cheaper storage classes
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# Cost optimization for API Gateway
resource "aws_api_gateway_deployment" "cost_optimized_deployment" {
  count = local.cost_optimized ? 1 : 0
  
  rest_api_id = aws_api_gateway_rest_api.vault_api.id
  stage_name  = var.environment

  # Reduce deployment frequency to save costs
  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_method.vault_get,
    aws_api_gateway_method.vault_put,
    aws_api_gateway_integration.vault_get_integration,
    aws_api_gateway_integration.vault_put_integration,
  ]
}

# CloudFront distribution removed - using main cloudfront.tf configuration
# Duplicate CloudFront distributions can cause conflicts and unnecessary costs
