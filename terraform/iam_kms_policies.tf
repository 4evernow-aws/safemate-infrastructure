# Enhanced IAM policy for KMS access
resource "aws_iam_policy" "safemate_kms_access" {
  name        = "SafeMateLambdaKMSAccess"
  description = "Allow SafeMate Lambda functions to access KMS for encryption/decryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "KMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey",
          "kms:ReEncrypt*"
        ]
        Resource = [aws_kms_key.safemate_master_key.arn]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:ap-southeast-2:994220462693:log-group:/aws/lambda/default-safemate-*",
          "arn:aws:logs:ap-southeast-2:994220462693:log-group:/aws/lambda/default-safemate-*:*"
        ]
      }
    ]
  })

  tags = {
    Name        = "SafeMate KMS Access Policy"
    Environment = "development"
    Service     = "safemate"
    Security    = "high"
  }
}

# Attach the policy to existing Lambda roles
resource "aws_iam_role_policy_attachment" "user_onboarding_kms" {
  role       = aws_iam_role.user_onboarding_lambda_exec.name
  policy_arn = aws_iam_policy.safemate_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "wallet_manager_kms" {
  role       = aws_iam_role.wallet_lambda_exec.name
  policy_arn = aws_iam_policy.safemate_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "hedera_service_kms" {
  role       = aws_iam_role.hedera_lambda_exec.name
  policy_arn = aws_iam_policy.safemate_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "group_manager_kms" {
  role       = aws_iam_role.group_lambda_exec.name
  policy_arn = aws_iam_policy.safemate_kms_access.arn
}

resource "aws_iam_role_policy_attachment" "token_vault_kms" {
  role       = aws_iam_role.vault_lambda_exec.name
  policy_arn = aws_iam_policy.safemate_kms_access.arn
}

# Additional security policy for audit logging
resource "aws_iam_policy" "safemate_audit_logging" {
  name        = "SafeMateAuditLogging"
  description = "Allow SafeMate Lambda functions to write audit logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AuditLogging"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:ap-southeast-2:994220462693:log-group:/aws/lambda/safemate-audit-*",
          "arn:aws:logs:ap-southeast-2:994220462693:log-group:/aws/lambda/safemate-audit-*:*"
        ]
      }
    ]
  })

  tags = {
    Name        = "SafeMate Audit Logging Policy"
    Environment = "development"
    Service     = "safemate"
    Security    = "audit"
  }
}

# Attach audit logging policy to key roles
resource "aws_iam_role_policy_attachment" "user_onboarding_audit" {
  role       = aws_iam_role.user_onboarding_lambda_exec.name
  policy_arn = aws_iam_policy.safemate_audit_logging.arn
}

resource "aws_iam_role_policy_attachment" "wallet_manager_audit" {
  role       = aws_iam_role.wallet_lambda_exec.name
  policy_arn = aws_iam_policy.safemate_audit_logging.arn
} 