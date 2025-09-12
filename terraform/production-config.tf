# Production Configuration for CloudFront Integration
# This ensures your AWS backend works with https://d19a5c2wn4mtdt.cloudfront.net/

# CORS Configuration for API Gateway to allow CloudFront domain
locals {
  cloudfront_domain = "d19a5c2wn4mtdt.cloudfront.net"
  allowed_origins = [
    "http://localhost:5173",  # Development
    "https://${local.cloudfront_domain}",  # Production
    "https://d19a5c2wn4mtdt.cloudfront.net"  # Direct reference
  ]
}

# Update API Gateway CORS for production
resource "aws_api_gateway_method" "cors_options" {
  count         = 6  # For all 6 APIs
  rest_api_id   = element([
    aws_api_gateway_rest_api.wallet_api.id,
    aws_api_gateway_rest_api.hedera_api.id,
    aws_api_gateway_rest_api.vault_api.id,
    aws_api_gateway_rest_api.onboarding_api.id,
    aws_api_gateway_rest_api.group_api.id,
    aws_api_gateway_rest_api.directory_api.id
  ], count.index)
  resource_id   = element([
    aws_api_gateway_rest_api.wallet_api.root_resource_id,
    aws_api_gateway_rest_api.hedera_api.root_resource_id,
    aws_api_gateway_rest_api.vault_api.root_resource_id,
    aws_api_gateway_rest_api.onboarding_api.root_resource_id,
    aws_api_gateway_rest_api.group_api.root_resource_id,
    aws_api_gateway_rest_api.directory_api.root_resource_id
  ], count.index)
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "cors_options" {
  count       = 6
  rest_api_id = element([
    aws_api_gateway_rest_api.wallet_api.id,
    aws_api_gateway_rest_api.hedera_api.id,
    aws_api_gateway_rest_api.vault_api.id,
    aws_api_gateway_rest_api.onboarding_api.id,
    aws_api_gateway_rest_api.group_api.id,
    aws_api_gateway_rest_api.directory_api.id
  ], count.index)
  resource_id = element([
    aws_api_gateway_rest_api.wallet_api.root_resource_id,
    aws_api_gateway_rest_api.hedera_api.root_resource_id,
    aws_api_gateway_rest_api.vault_api.root_resource_id,
    aws_api_gateway_rest_api.onboarding_api.root_resource_id,
    aws_api_gateway_rest_api.group_api.root_resource_id,
    aws_api_gateway_rest_api.directory_api.root_resource_id
  ], count.index)
  http_method = aws_api_gateway_method.cors_options[count.index].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "cors_options" {
  count       = 6
  rest_api_id = element([
    aws_api_gateway_rest_api.wallet_api.id,
    aws_api_gateway_rest_api.hedera_api.id,
    aws_api_gateway_rest_api.vault_api.id,
    aws_api_gateway_rest_api.onboarding_api.id,
    aws_api_gateway_rest_api.group_api.id,
    aws_api_gateway_rest_api.directory_api.id
  ], count.index)
  resource_id = element([
    aws_api_gateway_rest_api.wallet_api.root_resource_id,
    aws_api_gateway_rest_api.hedera_api.root_resource_id,
    aws_api_gateway_rest_api.vault_api.root_resource_id,
    aws_api_gateway_rest_api.onboarding_api.root_resource_id,
    aws_api_gateway_rest_api.group_api.root_resource_id,
    aws_api_gateway_rest_api.directory_api.root_resource_id
  ], count.index)
  http_method = aws_api_gateway_method.cors_options[count.index].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "cors_options" {
  count       = 6
  rest_api_id = element([
    aws_api_gateway_rest_api.wallet_api.id,
    aws_api_gateway_rest_api.hedera_api.id,
    aws_api_gateway_rest_api.vault_api.id,
    aws_api_gateway_rest_api.onboarding_api.id,
    aws_api_gateway_rest_api.group_api.id,
    aws_api_gateway_rest_api.directory_api.id
  ], count.index)
  resource_id = element([
    aws_api_gateway_rest_api.wallet_api.root_resource_id,
    aws_api_gateway_rest_api.hedera_api.root_resource_id,
    aws_api_gateway_rest_api.vault_api.root_resource_id,
    aws_api_gateway_rest_api.onboarding_api.root_resource_id,
    aws_api_gateway_rest_api.group_api.root_resource_id,
    aws_api_gateway_rest_api.directory_api.root_resource_id
  ], count.index)
  http_method = aws_api_gateway_method.cors_options[count.index].http_method
  status_code = aws_api_gateway_method_response.cors_options[count.index].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'https://d19a5c2wn4mtdt.cloudfront.net'"
  }
}

# CloudWatch Alarms for Production Monitoring
resource "aws_cloudwatch_metric_alarm" "production_api_errors" {
  alarm_name          = "${local.name_prefix}-production-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300" # 5 minutes
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Production API Gateway 5XX errors"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.wallet_api.name
  }
}

resource "aws_cloudwatch_metric_alarm" "production_lambda_errors" {
  alarm_name          = "${local.name_prefix}-production-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300" # 5 minutes
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Production Lambda function errors"
  
  dimensions = {
    FunctionName = aws_lambda_function.user_onboarding.function_name
  }
}
