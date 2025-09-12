# Free Tier Monitoring Alarms
# These alarms will notify you when approaching free tier limits

# Lambda Invocations Alarm (1M free per month)
resource "aws_cloudwatch_metric_alarm" "lambda_invocations" {
  alarm_name          = "${local.name_prefix}-lambda-invocations-free-tier"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Invocations"
  namespace           = "AWS/Lambda"
  period              = "86400" # 24 hours
  statistic           = "Sum"
  threshold           = "30000" # Alert at 30K/day (900K/month)
  alarm_description   = "Lambda invocations approaching free tier limit"
  
  dimensions = {
    FunctionName = "default-safemate-user-onboarding"
  }
}

# API Gateway Requests Alarm (1M free per month)
resource "aws_cloudwatch_metric_alarm" "api_gateway_requests" {
  alarm_name          = "${local.name_prefix}-api-gateway-requests-free-tier"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Count"
  namespace           = "AWS/ApiGateway"
  period              = "86400" # 24 hours
  statistic           = "Sum"
  threshold           = "30000" # Alert at 30K/day (900K/month)
  alarm_description   = "API Gateway requests approaching free tier limit"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.wallet_api.name
  }
}

# DynamoDB Consumed Read Capacity Units Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_read_capacity" {
  alarm_name          = "${local.name_prefix}-dynamodb-read-capacity-free-tier"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "86400" # 24 hours
  statistic           = "Sum"
  threshold           = "2160000" # Alert at 25 RCU/day (free tier is 25 RCU)
  alarm_description   = "DynamoDB read capacity approaching free tier limit"
  
  dimensions = {
    TableName = aws_dynamodb_table.safemate_files.name
  }
}

# DynamoDB Consumed Write Capacity Units Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_write_capacity" {
  alarm_name          = "${local.name_prefix}-dynamodb-write-capacity-free-tier"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "86400" # 24 hours
  statistic           = "Sum"
  threshold           = "2160000" # Alert at 25 WCU/day (free tier is 25 WCU)
  alarm_description   = "DynamoDB write capacity approaching free tier limit"
  
  dimensions = {
    TableName = aws_dynamodb_table.safemate_files.name
  }
}
