# Free Tier Only Configuration
# This removes ALL expensive resources and uses only free tier services

# Remove these expensive resources:
# - Application Load Balancer ($16.20/month)
# - ECS Fargate Service ($8-15/month) 
# - CloudFront Distribution ($0.085/GB)
# - ECR Repository ($0.10/month per GB)

# Keep these free tier resources:
# - Lambda Functions (1M requests/month free)
# - API Gateway (1M calls/month free)
# - DynamoDB (25GB storage free)
# - Cognito (50,000 MAUs free)
# - CloudWatch Logs (5GB ingestion free)

# Optional: Keep minimal paid services
# - KMS Key ($1/month) - needed for encryption
# - Secrets Manager ($0.40/month) - needed for Hedera keys

# Architecture:
# Frontend: Deploy to S3 static hosting (free)
# Backend: Lambda + API Gateway (all free tier)
# Database: DynamoDB (free tier)
# Auth: Cognito (free tier)

# Estimated monthly cost: ~$1.40 (KMS + Secrets Manager only)

# Comment out or remove these expensive resources:
# - aws_ecs_cluster
# - aws_ecs_service  
# - aws_lb (Application Load Balancer)
# - aws_cloudfront_distribution (Free Tier - 1TB free data transfer)
# - aws_ecr_repository (NOT Free Tier - removed)

# Keep these free tier resources:
# - aws_lambda_function
# - aws_api_gateway_rest_api
# - aws_dynamodb_table
# - aws_cognito_user_pool
# - aws_kms_key
# - aws_secretsmanager_secret (NOT Free Tier - removed)

# For frontend hosting, use S3 static website hosting (free) instead of CloudFront + ALB
