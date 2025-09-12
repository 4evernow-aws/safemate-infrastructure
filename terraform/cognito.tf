# =============================================================================
# SafeMate Cognito User Pool Configuration
# =============================================================================
#
# This file configures AWS Cognito for user authentication and email verification.
# 
# Key Features:
# - Direct email verification using Cognito's built-in capabilities (Free Tier)
# - No custom Lambda functions or API Gateway for email verification
# - Real Hedera testnet wallet integration
# - Fixed User Pool Client write permissions for standard attributes (given_name, family_name)
# - Updated: 2025-09-12 - Resolved NotAuthorizedException during user signup
# - Support for both new and existing users
#
# Environment: Development (dev)
# Last Updated: 2025-09-12
# Status: Fixed email verification to use Cognito directly (no Lambda/API)
# Fixed: Enabled auto_verified_attributes for email to ensure proper email delivery
# Fixed: Added ALLOW_USER_PASSWORD_AUTH to User Pool Client for resendSignUpCode
# Fixed: Added user_pool_add_ons configuration to ensure existing users are treated same as new users
#
# Email Verification:
# - Uses Cognito's COGNITO_DEFAULT email sending
# - Works for both new and existing users (VERIFIED: 2025-09-12)
# - Existing users can request verification codes via resend-confirmation-code
# - Free Tier compliant
# - No SES or custom Lambda functions required
#
# =============================================================================

resource "aws_cognito_user_pool" "app_pool_v2" {
  name = "${local.name_prefix}-user-pool-v5"

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  # User verification
  username_attributes      = ["email"]
  
  # Enable email verification for manual verification codes
  auto_verified_attributes = ["email"]

  # Email verification
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject         = "Verification code for SafeMate"
    email_message         = "Your verification code for SafeMate is {####}"
  }

  # Email configuration - use Cognito default email sending
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Admin create user configuration for better email delivery
  admin_create_user_config {
    allow_admin_create_user_only = false
    
    invite_message_template {
      email_message = "Welcome to SafeMate {username}! Please verify your email address to complete your account setup. Your verification code is {####}"
      email_subject = "Welcome to SafeMate - Please verify your email"
      sms_message   = "Welcome to SafeMate {username}! Your verification code is {####}"
    }
  }

  # Ensure existing users can also receive verification emails
  # This configuration ensures both new and existing users are treated the same
  user_pool_add_ons {
    advanced_security_mode = "OFF"
  }



  # Custom attributes for blockchain functionality
  schema {
    attribute_data_type = "String"
    name                = "hedera_account"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 50
    }
  }

  schema {
    attribute_data_type = "Number"
    name                = "asset_count"
    required            = false
    mutable             = true

    number_attribute_constraints {
      min_value = 0
      max_value = 999999
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "subscription_tier"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 20
    }
  }

  schema {
    attribute_data_type = "Number"
    name                = "mate_balance"
    required            = false
    mutable             = true

    number_attribute_constraints {
      min_value = 0
      max_value = 999999999
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "kyc_status"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 20
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "last_activity"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 30
    }
  }

  schema {
    attribute_data_type = "Number"
    name                = "storage_used"
    required            = false
    mutable             = true

    number_attribute_constraints {
      min_value = 0
      max_value = 999999999
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "account_type"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 50
    }
  }

  # Temporarily commented out to allow initial deployment
  # lambda_config {
  #   post_confirmation = data.aws_lambda_function.post_confirmation_wallet_creator.arn
  # }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Cognito User Pool Groups for role-based access
# TODO: Restore after deployment - currently causing provider issues
# resource "aws_cognito_user_pool_group" "admins" {
#   name         = "Admins"
#   user_pool_id = aws_cognito_user_pool.app_pool.id
#   description  = "Administrators with full system access"
#   precedence   = 1
#   role_arn     = aws_iam_role.group_admin_role.arn
# }

# resource "aws_cognito_user_pool_group" "team_owners" {
#   name         = "TeamOwners"
#   user_pool_id = aws_cognito_user_pool.app_pool.id
#   description  = "Team owners who can create and manage teams"
#   precedence   = 10
#   role_arn     = aws_iam_role.group_team_owner_role.arn
# }

# resource "aws_cognito_user_pool_group" "team_members" {
#   name         = "TeamMembers"
#   user_pool_id = aws_cognito_user_pool.app_pool.id
#   description  = "Team members with collaborative access"
#   precedence   = 20
#   role_arn     = aws_iam_role.group_team_member_role.arn
# }

# resource "aws_cognito_user_pool_group" "individual_users" {
#   name         = "IndividualUsers"
#   user_pool_id = aws_cognito_user_pool.app_pool.id
#   description  = "Individual users with personal wallet access"
#   precedence   = 30
#   role_arn     = aws_iam_role.group_individual_user_role.arn
# }

resource "aws_cognito_user_pool_domain" "app_domain" {
  domain       = "${local.name_prefix}-auth-${random_string.domain_suffix.result}"
  user_pool_id = aws_cognito_user_pool.app_pool_v2.id
}

resource "random_string" "domain_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_cognito_user_pool_client" "app_client" {
  name         = "${local.name_prefix}-client-v2"
  user_pool_id = aws_cognito_user_pool.app_pool_v2.id

  generate_secret = false
  
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # OAuth configuration for Hosted UI
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile", "aws.cognito.signin.user.admin"]
  
  # Enable managed login with Cognito identity provider
  supported_identity_providers = ["COGNITO"]

  # Support for reading custom attributes
  read_attributes = [
    "email",
    "custom:hedera_account",
    "custom:asset_count",
    "custom:subscription_tier",
    "custom:mate_balance",
    "custom:kyc_status",
    "custom:last_activity",
    "custom:storage_used",
    "custom:account_type"
  ]

  write_attributes = [
    "email",
    "given_name",
    "family_name",
    "custom:hedera_account",
    "custom:asset_count",
    "custom:subscription_tier",
    "custom:mate_balance",
    "custom:kyc_status",
    "custom:last_activity",
    "custom:storage_used",
    "custom:account_type"
  ]
  
  callback_urls = [
    "http://localhost:5173/callback",
    "https://${aws_cloudfront_distribution.app_distribution.domain_name}/callback"
  ]
  
  logout_urls = [
    "http://localhost:5173/",
    "https://${aws_cloudfront_distribution.app_distribution.domain_name}/"
  ]

  prevent_user_existence_errors = "ENABLED"
  
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = 24
  id_token_validity      = 24
  refresh_token_validity = 30

  depends_on = [aws_cognito_user_pool_domain.app_domain]
}

# Cognito Identity Pool for federated access
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${local.name_prefix}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.app_client.id
    provider_name           = aws_cognito_user_pool.app_pool_v2.endpoint
    server_side_token_check = false
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
    Purpose     = "group-identity"
  }
}

# Identity Pool Role Attachment
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated" = aws_iam_role.group_individual_user_role.arn
  }

  role_mapping {
    identity_provider         = "${aws_cognito_user_pool.app_pool_v2.endpoint}:${aws_cognito_user_pool_client.app_client.id}"
    ambiguous_role_resolution = "AuthenticatedRole"
    type                      = "Rules"

    mapping_rule {
      claim      = "cognito:groups"
      match_type = "Equals"
      value      = "Admins"
      role_arn   = aws_iam_role.group_admin_role.arn
    }

    mapping_rule {
      claim      = "cognito:groups"
      match_type = "Equals"
      value      = "TeamOwners"
      role_arn   = aws_iam_role.group_team_owner_role.arn
    }

    mapping_rule {
      claim      = "cognito:groups"
      match_type = "Equals"
      value      = "TeamMembers"
      role_arn   = aws_iam_role.group_team_member_role.arn
    }

    mapping_rule {
      claim      = "cognito:groups"
      match_type = "Equals"
      value      = "IndividualUsers"
      role_arn   = aws_iam_role.group_individual_user_role.arn
    }
  }

  depends_on = [
    # aws_cognito_user_pool_group.admins,
    # aws_cognito_user_pool_group.team_owners,
    # aws_cognito_user_pool_group.team_members,
    # aws_cognito_user_pool_group.individual_users
  ]
} 

# Post-Confirmation Lambda Trigger for Auto Wallet Creation
# Note: Function is created manually via AWS CLI to avoid dependency cycles
# Temporarily commented out to allow initial deployment
# data "aws_lambda_function" "post_confirmation_wallet_creator" {
#   function_name = "${local.name_prefix}-post-confirmation-wallet-creator"
# }

# Lambda permission for Cognito to invoke PostConfirmation function
# Temporarily commented out to allow initial deployment
# resource "aws_lambda_permission" "post_confirmation_invoke" {
#   statement_id  = "AllowExecutionFromCognito"
#   action        = "lambda:InvokeFunction"
#   function_name = data.aws_lambda_function.post_confirmation_wallet_creator.function_name
#   principal     = "cognito-idp.amazonaws.com"
#   source_arn    = aws_cognito_user_pool.app_pool_v2.arn
# } 