# =============================================================================
# SafeMate Billing Monitor User Configuration
# =============================================================================
# 
# This file creates an IAM user specifically for monitoring billing information
# with read-only access to billing and cost management services.
#
# Environment: Development (dev)
# Last Updated: 2025-09-11
# 
# Key Features:
# - Read-only access to billing and cost management
# - Access to Cost Explorer and Budgets
# - CloudWatch billing metrics access
# - Programmatic access via access keys
#
# =============================================================================

# IAM User for Billing Monitoring
resource "aws_iam_user" "billing_monitor" {
  name = "${local.name_prefix}-billing-monitor"
  path = "/billing/"

  tags = {
    Environment = var.environment
    Application = var.app_name
    Component   = "billing-monitor"
    Purpose     = "billing-monitoring"
  }
}

# IAM Policy for Billing and Cost Management Access
resource "aws_iam_policy" "billing_monitor_policy" {
  name        = "${local.name_prefix}-billing-monitor-policy"
  description = "Policy for billing and cost management monitoring"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "aws-portal:ViewBilling",
          "aws-portal:ViewAccount",
          "aws-portal:ViewUsage",
          "aws-portal:ViewPaymentMethods",
          "ce:GetCostAndUsage",
          "ce:GetDimensionValues",
          "ce:GetReservationCoverage",
          "ce:GetReservationPurchaseRecommendation",
          "ce:GetReservationUtilization",
          "ce:GetSavingsPlansUtilization",
          "ce:GetSavingsPlansUtilizationDetails",
          "ce:GetUsageReport",
          "ce:ListCostCategoryDefinitions",
          "ce:GetCostCategories",
          "ce:GetRightsizingRecommendation",
          "ce:GetSavingsPlansUtilization",
          "budgets:ViewBudget",
          "budgets:DescribeBudgets",
          "budgets:DescribeBudgetPerformanceHistory",
          "cur:DescribeReportDefinitions",
          "pricing:GetProducts",
          "pricing:GetAttributeValues",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:GetMetricData",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:DescribeAlarmHistory"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = var.app_name
    Component   = "billing-monitor"
  }
}

# Attach billing policy to the user
resource "aws_iam_user_policy_attachment" "billing_monitor_policy" {
  user       = aws_iam_user.billing_monitor.name
  policy_arn = aws_iam_policy.billing_monitor_policy.arn
}

# Access Key for programmatic access
resource "aws_iam_access_key" "billing_monitor_key" {
  user = aws_iam_user.billing_monitor.name
}

# Output the access key details (store securely!)
output "billing_monitor_access_key_id" {
  description = "Access Key ID for billing monitor user"
  value       = aws_iam_access_key.billing_monitor_key.id
  sensitive   = true
}

output "billing_monitor_secret_access_key" {
  description = "Secret Access Key for billing monitor user"
  value       = aws_iam_access_key.billing_monitor_key.secret
  sensitive   = true
}

output "billing_monitor_user_arn" {
  description = "ARN of the billing monitor user"
  value       = aws_iam_user.billing_monitor.arn
}
