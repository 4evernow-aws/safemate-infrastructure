# SafeMate AWS Resource Management

## ☁️ **Overview**

This guide covers AWS resource management for SafeMate environments, including service configurations, resource optimization, cost management, and best practices for each AWS service used in the project.

## 🏗️ **AWS Architecture**

### **Service Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Lambda        │
│   (CloudFront)  │◄──►│   (REST API)    │◄──►│   Functions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   DynamoDB      │    │   CloudWatch    │
                       │   (Database)    │    │   (Monitoring)  │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   S3            │    │   KMS           │
                       │   (Storage)     │    │   (Encryption)  │
                       └─────────────────┘    └─────────────────┘
```

### **Environment-Specific Resources**
- **Development**: Free tier optimized, minimal resources
- **Pre-Production**: Balanced performance and cost
- **Production**: High availability, full monitoring

## 🔧 **AWS Services Configuration**

### **Lambda Functions**

#### **Function Configuration**
```javascript
// Lambda function configuration
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // Function logic here
    const result = await processRequest(event);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

#### **Environment-Specific Settings**
```hcl
# Terraform Lambda configuration
resource "aws_lambda_function" "wallet_manager" {
  filename         = "lambda-wallet-manager.zip"
  function_name    = "${var.environment}-safemate-wallet-manager"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = var.environment == "prod" ? 60 : 30
  memory_size     = var.environment == "prod" ? 1024 : 256
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      HEDERA_NETWORK = var.hedera_network
      DEBUG_MODE = var.environment == "dev" ? "true" : "false"
      DEMO_MODE = var.environment == "dev" ? "true" : "false"
    }
  }
  
  tags = {
    Name = "${var.environment}-safemate-wallet-manager"
    Environment = var.environment
    Service = "wallet-manager"
  }
}
```

#### **Lambda Optimization**
```javascript
// Lambda optimization techniques
const AWS = require('aws-sdk');

// Reuse AWS SDK clients outside handler
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Connection pooling for external services
const https = require('https');
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50
});

exports.handler = async (event) => {
  // Use connection pooling
  const options = {
    hostname: 'api.hedera.com',
    port: 443,
    agent: agent
  };
  
  // Implement caching
  const cacheKey = `wallet-${event.userId}`;
  const cachedData = await getFromCache(cacheKey);
  
  if (cachedData) {
    return {
      statusCode: 200,
      body: JSON.stringify(cachedData)
    };
  }
  
  // Process request and cache result
  const result = await processWalletRequest(event);
  await setCache(cacheKey, result, 300); // 5 minutes TTL
  
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

### **API Gateway**

#### **API Configuration**
```hcl
# Terraform API Gateway configuration
resource "aws_api_gateway_rest_api" "safemate_api" {
  name = "${var.environment}-safemate-api"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = {
    Name = "${var.environment}-safemate-api"
    Environment = var.environment
  }
}

resource "aws_api_gateway_stage" "safemate_stage" {
  deployment_id = aws_api_gateway_deployment.safemate_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.safemate_api.id
  stage_name    = var.environment
  
  tags = {
    Name = "${var.environment}-safemate-stage"
    Environment = var.environment
  }
}
```

#### **CORS Configuration**
```hcl
# CORS configuration for API Gateway
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.safemate_api.id
  resource_id   = aws_api_gateway_resource.safemate_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.safemate_api.id
  resource_id = aws_api_gateway_resource.safemate_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.safemate_api.id
  resource_id = aws_api_gateway_resource.safemate_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
```

### **DynamoDB Tables**

#### **Table Configuration**
```hcl
# DynamoDB table configuration
resource "aws_dynamodb_table" "users" {
  name           = "${var.environment}-safemate-users"
  billing_mode   = var.environment == "prod" ? "PROVISIONED" : "PAY_PER_REQUEST"
  hash_key       = "userId"
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  # Provisioned capacity for production
  dynamic "read_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      read_capacity = read_capacity.value
    }
  }
  
  dynamic "write_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      write_capacity = write_capacity.value
    }
  }
  
  server_side_encryption {
    enabled = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name = "${var.environment}-safemate-users"
    Environment = var.environment
    DataClassification = "sensitive"
  }
}
```

#### **DynamoDB Optimization**
```javascript
// DynamoDB optimization techniques
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Batch operations for better performance
async function batchGetUsers(userIds) {
  const params = {
    RequestItems: {
      [`${process.env.ENVIRONMENT}-safemate-users`]: {
        Keys: userIds.map(id => ({ userId: id }))
      }
    }
  };
  
  const result = await dynamodb.batchGet(params).promise();
  return result.Responses[`${process.env.ENVIRONMENT}-safemate-users`];
}

// Efficient querying with indexes
async function getUserByEmail(email) {
  const params = {
    TableName: `${process.env.ENVIRONMENT}-safemate-users`,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    }
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items[0];
}

// Conditional updates to prevent conflicts
async function updateUserWallet(userId, walletData, expectedVersion) {
  const params = {
    TableName: `${process.env.ENVIRONMENT}-safemate-users`,
    Key: { userId: userId },
    UpdateExpression: 'SET walletData = :wallet, version = :version',
    ConditionExpression: 'version = :expectedVersion',
    ExpressionAttributeValues: {
      ':wallet': walletData,
      ':version': expectedVersion + 1,
      ':expectedVersion': expectedVersion
    },
    ReturnValues: 'ALL_NEW'
  };
  
  try {
    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      throw new Error('Concurrent modification detected');
    }
    throw error;
  }
}
```

### **CloudWatch Monitoring**

#### **Log Groups Configuration**
```hcl
# CloudWatch log groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = var.lambda_functions
  
  name              = "/aws/lambda/${each.value.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = {
    Name = "${each.value.function_name}-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.environment}-safemate-api"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = {
    Name = "${var.environment}-safemate-api-logs"
    Environment = var.environment
  }
}
```

#### **Alarms Configuration**
```hcl
# CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.lambda_functions
  
  alarm_name          = "${each.value.function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.environment == "prod" ? "5" : "10"
  alarm_description   = "Lambda function error rate"
  
  dimensions = {
    FunctionName = each.value.function_name
  }
  
  tags = {
    Name = "${each.value.function_name}-errors-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "${var.environment}-safemate-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "API Gateway 5xx errors"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.safemate_api.name
    Stage   = aws_api_gateway_stage.safemate_stage.stage_name
  }
  
  tags = {
    Name = "${var.environment}-safemate-api-5xx-alarm"
    Environment = var.environment
  }
}
```

### **S3 Storage**

#### **Bucket Configuration**
```hcl
# S3 bucket configuration
resource "aws_s3_bucket" "safemate_data" {
  bucket = "${var.environment}-safemate-data"
  
  tags = {
    Name = "${var.environment}-safemate-data"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "safemate_data" {
  bucket = aws_s3_bucket.safemate_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "safemate_data" {
  bucket = aws_s3_bucket.safemate_data.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "safemate_data" {
  bucket = aws_s3_bucket.safemate_data.id
  
  rule {
    id     = "data_lifecycle"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}
```

#### **S3 Operations**
```javascript
// S3 operations for file management
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Upload file with metadata
async function uploadFile(bucketName, key, fileBuffer, metadata = {}) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: metadata.contentType || 'application/octet-stream',
    Metadata: {
      uploadedBy: metadata.userId,
      uploadedAt: new Date().toISOString(),
      ...metadata
    }
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
}

// Generate presigned URL for secure access
async function generatePresignedUrl(bucketName, key, operation = 'getObject', expiresIn = 3600) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: expiresIn
  };
  
  const url = await s3.getSignedUrlPromise(operation, params);
  return url;
}

// List files with pagination
async function listFiles(bucketName, prefix = '', maxKeys = 1000) {
  const params = {
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys
  };
  
  const result = await s3.listObjectsV2(params).promise();
  return result.Contents;
}
```

### **KMS Encryption**

#### **KMS Key Configuration**
```hcl
# KMS key for encryption
resource "aws_kms_key" "safemate_key" {
  description             = "KMS key for SafeMate encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.environment}-safemate-kms-key"
    Environment = var.environment
    Purpose = "encryption"
  }
}

resource "aws_kms_alias" "safemate_key_alias" {
  name          = "alias/${var.environment}-safemate-key"
  target_key_id = aws_kms_key.safemate_key.key_id
}
```

#### **KMS Operations**
```javascript
// KMS encryption operations
const AWS = require('aws-sdk');
const kms = new AWS.KMS();

// Encrypt sensitive data
async function encryptData(plaintext, keyId) {
  const params = {
    KeyId: keyId,
    Plaintext: Buffer.from(JSON.stringify(plaintext), 'utf8')
  };
  
  const result = await kms.encrypt(params).promise();
  return result.CiphertextBlob.toString('base64');
}

// Decrypt data
async function decryptData(encryptedData, keyId) {
  const params = {
    CiphertextBlob: Buffer.from(encryptedData, 'base64'),
    KeyId: keyId
  };
  
  const result = await kms.decrypt(params).promise();
  return JSON.parse(result.Plaintext.toString('utf8'));
}

// Generate data key for envelope encryption
async function generateDataKey(keyId) {
  const params = {
    KeyId: keyId,
    KeySpec: 'AES_256'
  };
  
  const result = await kms.generateDataKey(params).promise();
  return {
    plaintext: result.Plaintext,
    ciphertext: result.CiphertextBlob
  };
}
```

## 💰 **Cost Management**

### **Free Tier Optimization**

#### **Development Environment**
```hcl
# Free tier optimized configuration
locals {
  free_tier_limits = {
    lambda_requests = 1000000  # 1M requests/month
    lambda_duration = 400000   # 400K GB-seconds/month
    dynamodb_storage = 25      # 25GB storage
    dynamodb_reads = 25        # 25 read capacity units
    dynamodb_writes = 25       # 25 write capacity units
    api_gateway_requests = 1000000  # 1M requests/month
    cloudwatch_logs = 5        # 5GB ingestion
  }
}

# Optimize Lambda for free tier
resource "aws_lambda_function" "free_tier_optimized" {
  # ... other configuration ...
  
  memory_size = 128  # Minimum memory for cost optimization
  timeout     = 15   # Shorter timeout to reduce duration
  
  environment {
    variables = {
      OPTIMIZE_FOR_FREE_TIER = "true"
    }
  }
}
```

#### **Cost Monitoring**
```hcl
# CloudWatch cost alarm
resource "aws_cloudwatch_metric_alarm" "cost_alarm" {
  alarm_name          = "${var.environment}-safemate-cost-alert"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"  # Daily
  statistic           = "Maximum"
  threshold           = var.environment == "dev" ? "5" : "50"
  alarm_description   = "AWS cost threshold exceeded"
  
  dimensions = {
    Currency = "USD"
  }
  
  tags = {
    Name = "${var.environment}-safemate-cost-alarm"
    Environment = var.environment
  }
}
```

### **Resource Optimization**

#### **Lambda Optimization**
```javascript
// Lambda optimization for cost
const AWS = require('aws-sdk');

// Reuse connections and clients
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Implement efficient caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getFromCache(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data: data,
    timestamp: Date.now()
  });
}

// Optimize memory usage
exports.handler = async (event) => {
  // Use streaming for large data
  const stream = require('stream');
  const util = require('util');
  const pipeline = util.promisify(stream.pipeline);
  
  // Process data in chunks
  const chunkSize = 1000;
  const data = event.data || [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await processChunk(chunk);
  }
  
  return { statusCode: 200, body: 'Processed successfully' };
};
```

#### **DynamoDB Optimization**
```javascript
// DynamoDB optimization techniques
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Use batch operations
async function batchWriteUsers(users) {
  const batchSize = 25; // DynamoDB batch limit
  const batches = [];
  
  for (let i = 0; i < users.length; i += batchSize) {
    batches.push(users.slice(i, i + batchSize));
  }
  
  const results = await Promise.all(
    batches.map(batch => {
      const params = {
        RequestItems: {
          [`${process.env.ENVIRONMENT}-safemate-users`]: batch.map(user => ({
            PutRequest: {
              Item: user
            }
          }))
        }
      };
      return dynamodb.batchWrite(params).promise();
    })
  );
  
  return results;
}

// Use efficient queries
async function getUserTransactions(userId, startDate, endDate) {
  const params = {
    TableName: `${process.env.ENVIRONMENT}-safemate-transactions`,
    KeyConditionExpression: 'userId = :userId AND #ts BETWEEN :startDate AND :endDate',
    ExpressionAttributeNames: {
      '#ts': 'timestamp'
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':startDate': startDate,
      ':endDate': endDate
    },
    ScanIndexForward: false, // Most recent first
    Limit: 100 // Limit results
  };
  
  const result = await dynamodb.query(params).promise();
  return result.Items;
}
```

## 🔒 **Security Configuration**

### **IAM Policies**

#### **Least Privilege Policies**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/${environment}-safemate-users",
        "arn:aws:dynamodb:us-east-1:*:table/${environment}-safemate-wallets"
      ],
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Environment": "${environment}"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::${environment}-safemate-data/*",
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Environment": "${environment}"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:*:key/${kms-key-id}",
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Environment": "${environment}"
        }
      }
    }
  ]
}
```

### **VPC Configuration**

#### **Network Security**
```hcl
# VPC configuration for production
resource "aws_vpc" "safemate_vpc" {
  count = var.environment == "prod" ? 1 : 0
  
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.environment}-safemate-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_subnets" {
  count = var.environment == "prod" ? 2 : 0
  
  vpc_id            = aws_vpc.safemate_vpc[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "${var.environment}-safemate-private-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_security_group" "lambda_sg" {
  count = var.environment == "prod" ? 1 : 0
  
  name        = "${var.environment}-safemate-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.safemate_vpc[0].id
  
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.environment}-safemate-lambda-sg"
    Environment = var.environment
  }
}
```

## 📊 **Monitoring and Alerting**

### **Custom Metrics**
```javascript
// Custom CloudWatch metrics
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function publishCustomMetric(metricName, value, unit = 'Count', dimensions = []) {
  const params = {
    Namespace: 'SafeMate/Custom',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Dimensions: dimensions,
        Timestamp: new Date()
      }
    ]
  };
  
  await cloudwatch.putMetricData(params).promise();
}

// Publish business metrics
async function publishBusinessMetrics(event) {
  const dimensions = [
    {
      Name: 'Environment',
      Value: process.env.ENVIRONMENT
    },
    {
      Name: 'Service',
      Value: 'wallet-manager'
    }
  ];
  
  await publishCustomMetric('WalletCreation', 1, 'Count', dimensions);
  await publishCustomMetric('TransactionVolume', event.amount, 'None', dimensions);
}
```

### **Dashboard Configuration**
```hcl
# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "safemate_dashboard" {
  dashboard_name = "${var.environment}-safemate-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.environment}-safemate-wallet-manager"],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          period = 300
          stat = "Sum"
          region = var.region
          title = "Lambda Performance"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", "${var.environment}-safemate-api"],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."]
          ]
          period = 300
          stat = "Sum"
          region = var.region
          title = "API Gateway Metrics"
        }
      }
    ]
  })
}
```

## 📚 **Best Practices**

### **Resource Management**
- Use consistent naming conventions
- Implement proper tagging strategy
- Use environment-specific configurations
- Optimize for cost and performance
- Implement proper monitoring

### **Security Best Practices**
- Use least privilege access
- Enable encryption for all resources
- Implement proper network security
- Regular security audits
- Monitor access patterns

### **Performance Optimization**
- Use appropriate resource sizes
- Implement caching strategies
- Optimize database queries
- Use batch operations
- Monitor performance metrics

### **Cost Optimization**
- Use free tier effectively
- Monitor resource usage
- Implement auto-scaling
- Use appropriate storage classes
- Regular cost reviews

---

*Last Updated: 2025-08-26 12:18:00*
