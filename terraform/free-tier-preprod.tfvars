# Free Tier Pre-Production Configuration
# This configuration minimizes costs while providing pre-production testing

environment = "preprod"
hedera_network = "testnet"

# Use minimal resources to stay within free tier
app_name = "safemate"
region = "ap-southeast-2"

# Minimal pre-production setup
app_url = "https://preprod.safemate.com"

# Free tier optimized settings
bucket_name = "safemate-terraform-state-management"
image_tag = "preprod-latest"

# Free tier considerations:
# - No Load Balancer (saves $16.20/month)
# - Minimal Lambda functions
# - Shared KMS keys (saves $1/month)
# - Shared Secrets Manager (saves $0.40/month)
