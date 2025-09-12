# Pre-Production Environment Variables
environment = "preprod"
hedera_network = "testnet"
app_url = "https://d19a5c2wn4mtdt.cloudfront.net"

# Pre-Production specific configurations
log_retention = 14
ecs_desired_count = 1
container_insights = true

# Cognito Configuration
cognito_user_pool_name = "preprod-safemate-user-pool-v2"
cognito_domain_prefix = "preprod-safemate-auth"

# Lambda Function Names
user_onboarding_function = "preprod-safemate-user-onboarding"
post_confirmation_function = "preprod-safemate-post-confirmation-wallet-creator"
group_manager_function = "preprod-safemate-group-manager"
token_vault_function = "preprod-safemate-token-vault"
wallet_manager_function = "preprod-safemate-wallet-manager"
hedera_service_function = "preprod-safemate-hedera-service"
directory_creator_function = "preprod-safemate-directory-creator"

# API Gateway Stage
api_gateway_stage = "preprod"

# CloudFront Configuration
cloudfront_distribution_enabled = true
cloudfront_default_root_object = "index.html"
