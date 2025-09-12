# Free Tier Optimized Configuration
# This removes expensive resources and uses only free tier services

# Remove these expensive resources:
# - Application Load Balancer ($16.20/month)
# - ECS Fargate Service ($8-15/month) 
# - CloudFront Distribution ($0.085/GB)
# - ECR Repository (if not used)

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
# Frontend: Deploy to S3 + CloudFront (or GitHub Pages for free)
# Backend: Lambda + API Gateway (all free tier)
# Database: DynamoDB (free tier)
# Auth: Cognito (free tier)

# Estimated monthly cost: ~$1.40 (KMS + Secrets Manager only)
