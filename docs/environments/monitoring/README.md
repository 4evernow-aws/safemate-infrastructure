# SafeMate Environment Monitoring & Logging

## 📊 **Overview**

This guide covers monitoring and logging setup for SafeMate environments, including CloudWatch configuration, alerting, metrics collection, and log management.

## 🔍 **Monitoring Architecture**

### **Monitoring Stack**
- **CloudWatch**: Central monitoring and logging
- **Lambda Insights**: Function-level monitoring
- **API Gateway**: Request/response monitoring
- **DynamoDB**: Database performance monitoring
- **Custom Metrics**: Business-specific monitoring

### **Monitoring Layers**
1. **Infrastructure Layer**: AWS resource health
2. **Application Layer**: Lambda function performance
3. **API Layer**: API Gateway metrics
4. **Database Layer**: DynamoDB performance
5. **Business Layer**: User activity and transactions

## 📈 **CloudWatch Configuration**

### **Log Groups Setup**

#### **Lambda Function Logs**
```bash
# Create log groups for each Lambda function
aws logs create-log-group --log-group-name "/aws/lambda/dev-safemate-wallet-manager"
aws logs create-log-group --log-group-name "/aws/lambda/dev-safemate-user-onboarding"
aws logs create-log-group --log-group-name "/aws/lambda/dev-safemate-hedera-service"
```

#### **API Gateway Logs**
```bash
# Enable API Gateway logging
aws logs create-log-group --log-group-name "/aws/apigateway/dev-safemate-api"
```

#### **Application Logs**
```bash
# Create application-specific log groups
aws logs create-log-group --log-group-name "/safemate/application/dev"
aws logs create-log-group --log-group-name "/safemate/security/dev"
aws logs create-log-group --log-group-name "/safemate/performance/dev"
```

### **Log Retention Policies**

#### **Development Environment**
- **Lambda Logs**: 3 days
- **API Gateway Logs**: 3 days
- **Application Logs**: 7 days
- **Security Logs**: 30 days

#### **Pre-Production Environment**
- **Lambda Logs**: 7 days
- **API Gateway Logs**: 7 days
- **Application Logs**: 14 days
- **Security Logs**: 90 days

#### **Production Environment**
- **Lambda Logs**: 30 days
- **API Gateway Logs**: 30 days
- **Application Logs**: 90 days
- **Security Logs**: 1 year

## 📊 **Metrics Collection**

### **Lambda Function Metrics**

#### **Performance Metrics**
- **Duration**: Function execution time
- **Memory Usage**: Memory consumption
- **Error Rate**: Percentage of failed invocations
- **Throttles**: Number of throttled invocations

#### **Business Metrics**
- **Invocation Count**: Total function calls
- **Concurrent Executions**: Active function instances
- **Cold Starts**: Number of cold start events

### **API Gateway Metrics**

#### **Request Metrics**
- **Request Count**: Total API requests
- **4xx Errors**: Client error responses
- **5xx Errors**: Server error responses
- **Latency**: Response time percentiles

#### **Integration Metrics**
- **Integration Latency**: Backend response time
- **Cache Hit Count**: Cached response hits
- **Cache Miss Count**: Cache misses

### **DynamoDB Metrics**

#### **Performance Metrics**
- **Consumed Read Capacity**: Read capacity units used
- **Consumed Write Capacity**: Write capacity units used
- **Throttled Requests**: Throttled read/write requests
- **User Errors**: Client-side errors

#### **Storage Metrics**
- **Table Size**: Total table size in bytes
- **Item Count**: Number of items in table
- **Index Size**: GSI/LSI sizes

## 🚨 **Alerting Configuration**

### **Critical Alerts**

#### **Service Availability**
```yaml
# CloudWatch Alarm for API Gateway 5xx errors
AlarmName: "dev-safemate-api-5xx-errors"
MetricName: "5XXError"
Namespace: "AWS/ApiGateway"
Threshold: 5
Period: 300
EvaluationPeriods: 2
ComparisonOperator: GreaterThanThreshold
```

#### **Lambda Function Errors**
```yaml
# CloudWatch Alarm for Lambda errors
AlarmName: "dev-safemate-wallet-manager-errors"
MetricName: "Errors"
Namespace: "AWS/Lambda"
Threshold: 10
Period: 300
EvaluationPeriods: 2
ComparisonOperator: GreaterThanThreshold
```

#### **DynamoDB Throttling**
```yaml
# CloudWatch Alarm for DynamoDB throttling
AlarmName: "dev-safemate-users-throttled-requests"
MetricName: "ThrottledRequests"
Namespace: "AWS/DynamoDB"
Threshold: 5
Period: 300
EvaluationPeriods: 2
ComparisonOperator: GreaterThanThreshold
```

### **Warning Alerts**

#### **Performance Degradation**
```yaml
# CloudWatch Alarm for high latency
AlarmName: "dev-safemate-api-high-latency"
MetricName: "Latency"
Namespace: "AWS/ApiGateway"
Threshold: 2000
Period: 300
EvaluationPeriods: 3
ComparisonOperator: GreaterThanThreshold
```

#### **Resource Utilization**
```yaml
# CloudWatch Alarm for high Lambda duration
AlarmName: "dev-safemate-wallet-manager-high-duration"
MetricName: "Duration"
Namespace: "AWS/Lambda"
Threshold: 10000
Period: 300
EvaluationPeriods: 2
ComparisonOperator: GreaterThanThreshold
```

### **Cost Alerts**

#### **Budget Monitoring**
```yaml
# CloudWatch Alarm for cost threshold
AlarmName: "dev-safemate-cost-alert"
MetricName: "EstimatedCharges"
Namespace: "AWS/Billing"
Threshold: 50
Period: 86400
EvaluationPeriods: 1
ComparisonOperator: GreaterThanThreshold
```

## 📋 **Dashboard Configuration**

### **Environment Dashboards**

#### **Development Dashboard**
- **Lambda Functions**: Performance and error metrics
- **API Gateway**: Request/response metrics
- **DynamoDB**: Database performance
- **Cost**: Current month spending

#### **Pre-Production Dashboard**
- **Application Health**: Overall system health
- **Performance**: Response times and throughput
- **Errors**: Error rates and patterns
- **Security**: Security events and alerts

#### **Production Dashboard**
- **Business Metrics**: User activity and transactions
- **System Performance**: Infrastructure health
- **Security Monitoring**: Security events and threats
- **Cost Management**: Resource utilization and costs

### **Custom Dashboards**

#### **Lambda Performance Dashboard**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Duration", "FunctionName", "dev-safemate-wallet-manager"],
          [".", "Errors", ".", "."],
          [".", "Invocations", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Wallet Manager Performance"
      }
    }
  ]
}
```

#### **API Gateway Dashboard**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", "ApiName", "dev-safemate-api"],
          [".", "4XXError", ".", "."],
          [".", "5XXError", ".", "."],
          [".", "Latency", ".", "."]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "API Gateway Metrics"
      }
    }
  ]
}
```

## 🔍 **Log Analysis**

### **Log Filtering and Search**

#### **Error Log Analysis**
```bash
# Search for errors in Lambda logs
aws logs filter-log-events \
  --log-group-name "/aws/lambda/dev-safemate-wallet-manager" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

#### **Performance Log Analysis**
```bash
# Search for slow requests
aws logs filter-log-events \
  --log-group-name "/aws/lambda/dev-safemate-wallet-manager" \
  --filter-pattern "duration > 5000" \
  --start-time $(date -d '1 hour ago' +%s)000
```

#### **Security Log Analysis**
```bash
# Search for security events
aws logs filter-log-events \
  --log-group-name "/safemate/security/dev" \
  --filter-pattern "unauthorized OR failed OR blocked" \
  --start-time $(date -d '1 day ago' +%s)000
```

### **Log Insights Queries**

#### **Error Rate Analysis**
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
| sort @timestamp desc
```

#### **Performance Analysis**
```sql
fields @timestamp, @duration, @functionName
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
| sort @timestamp desc
```

#### **User Activity Analysis**
```sql
fields @timestamp, @user, @action
| filter @type = "USER_ACTION"
| stats count() by @user, @action
| sort count() desc
```

## 📊 **Custom Metrics**

### **Business Metrics**

#### **User Activity Metrics**
```javascript
// Lambda function to publish custom metrics
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function publishUserMetrics(userId, action) {
  const params = {
    Namespace: 'SafeMate/UserActivity',
    MetricData: [
      {
        MetricName: 'UserAction',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'UserId',
            Value: userId
          },
          {
            Name: 'Action',
            Value: action
          }
        ]
      }
    ]
  };
  
  await cloudwatch.putMetricData(params).promise();
}
```

#### **Transaction Metrics**
```javascript
// Lambda function to publish transaction metrics
async function publishTransactionMetrics(transactionType, amount) {
  const params = {
    Namespace: 'SafeMate/Transactions',
    MetricData: [
      {
        MetricName: 'TransactionCount',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          {
            Name: 'TransactionType',
            Value: transactionType
          }
        ]
      },
      {
        MetricName: 'TransactionAmount',
        Value: amount,
        Unit: 'None',
        Dimensions: [
          {
            Name: 'TransactionType',
            Value: transactionType
          }
        ]
      }
    ]
  };
  
  await cloudwatch.putMetricData(params).promise();
}
```

## 🔧 **Monitoring Automation**

### **Automated Health Checks**

#### **Lambda Function Health Check**
```javascript
// Automated health check function
exports.handler = async (event) => {
  const functions = [
    'dev-safemate-wallet-manager',
    'dev-safemate-user-onboarding',
    'dev-safemate-hedera-service'
  ];
  
  const results = await Promise.all(
    functions.map(async (functionName) => {
      try {
        const response = await lambda.invoke({
          FunctionName: functionName,
          Payload: JSON.stringify({ action: 'health-check' })
        }).promise();
        
        return {
          functionName,
          status: 'healthy',
          response: JSON.parse(response.Payload)
        };
      } catch (error) {
        return {
          functionName,
          status: 'unhealthy',
          error: error.message
        };
      }
    })
  );
  
  // Publish health check metrics
  await publishHealthCheckMetrics(results);
  
  return {
    statusCode: 200,
    body: JSON.stringify(results)
  };
};
```

### **Automated Alerting**

#### **SNS Notification Setup**
```bash
# Create SNS topic for alerts
aws sns create-topic --name "safemate-alerts"

# Subscribe email addresses
aws sns subscribe \
  --topic-arn "arn:aws:sns:us-east-1:123456789012:safemate-alerts" \
  --protocol email \
  --notification-endpoint "admin@safemate.com"
```

#### **Slack Integration**
```javascript
// Lambda function to send Slack notifications
const https = require('https');

async function sendSlackAlert(message, channel = '#alerts') {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  const payload = {
    channel: channel,
    text: message,
    username: 'SafeMate Monitor',
    icon_emoji: ':warning:'
  };
  
  const options = {
    hostname: 'hooks.slack.com',
    port: 443,
    path: webhookUrl.split('hooks.slack.com')[1],
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      resolve(res.statusCode);
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}
```

## 📚 **Best Practices**

### **Monitoring Best Practices**
- Set up comprehensive logging from day one
- Use structured logging with consistent formats
- Implement log rotation and retention policies
- Monitor both technical and business metrics
- Set up alerts for critical issues only

### **Alerting Best Practices**
- Avoid alert fatigue by setting appropriate thresholds
- Use different severity levels for different issues
- Include context and actionable information in alerts
- Test alerting mechanisms regularly
- Document alert response procedures

### **Performance Monitoring**
- Monitor end-to-end response times
- Track resource utilization trends
- Set up performance baselines
- Monitor business impact of performance issues
- Plan for capacity scaling

---

*Last Updated: 2025-08-26 12:18:00*
