# SafeMate CloudWatch Alarms Setup Script
# This script creates comprehensive monitoring alarms for all Lambda functions

$region = "ap-southeast-2"
$snsTopicArn = "arn:aws:sns:ap-southeast-2:994220462693:safemate-alerts"  # You may need to create this SNS topic

# Lambda function names
$lambdaFunctions = @(
    "default-safemate-hedera-service",
    "safemate-onboarding-test",
    "default-safemate-token-vault",
    "default-safemate-post-confirmation-wallet-creator",
    "safemate-onboarding-new",
    "default-safemate-user-onboarding",
    "default-safemate-wallet-manager",
    "default-safemate-directory-creator",
    "default-safemate-group-manager"
)

Write-Host "Setting up CloudWatch alarms for SafeMate Lambda functions..." -ForegroundColor Green

# Create SNS topic for alerts if it doesn't exist
Write-Host "Creating SNS topic for alerts..." -ForegroundColor Yellow
try {
    aws sns create-topic --name safemate-alerts --region $region
    Write-Host "SNS topic created successfully" -ForegroundColor Green
} catch {
    Write-Host "SNS topic may already exist or error occurred" -ForegroundColor Yellow
}

foreach ($functionName in $lambdaFunctions) {
    Write-Host "Setting up alarms for: $functionName" -ForegroundColor Cyan
    
    # 1. Error Rate Alarm (5% threshold)
    $errorAlarmName = "safemate-$($functionName.Replace('default-', '').Replace('-', '-'))-error-rate"
    Write-Host "Creating error rate alarm: $errorAlarmName" -ForegroundColor Yellow
    
    aws cloudwatch put-metric-alarm `
        --alarm-name $errorAlarmName `
        --alarm-description "Error rate alarm for $functionName" `
        --metric-name Errors `
        --namespace AWS/Lambda `
        --statistic Sum `
        --period 300 `
        --threshold 1 `
        --comparison-operator GreaterThanThreshold `
        --evaluation-periods 2 `
        --alarm-actions $snsTopicArn `
        --dimensions Name=FunctionName,Value=$functionName `
        --region $region

    # 2. Duration Alarm (10 seconds threshold)
    $durationAlarmName = "safemate-$($functionName.Replace('default-', '').Replace('-', '-'))-duration"
    Write-Host "Creating duration alarm: $durationAlarmName" -ForegroundColor Yellow
    
    aws cloudwatch put-metric-alarm `
        --alarm-name $durationAlarmName `
        --alarm-description "Duration alarm for $functionName" `
        --metric-name Duration `
        --namespace AWS/Lambda `
        --statistic Average `
        --period 300 `
        --threshold 10000 `
        --comparison-operator GreaterThanThreshold `
        --evaluation-periods 2 `
        --alarm-actions $snsTopicArn `
        --dimensions Name=FunctionName,Value=$functionName `
        --region $region

    # 3. Throttles Alarm
    $throttleAlarmName = "safemate-$($functionName.Replace('default-', '').Replace('-', '-'))-throttles"
    Write-Host "Creating throttles alarm: $throttleAlarmName" -ForegroundColor Yellow
    
    aws cloudwatch put-metric-alarm `
        --alarm-name $throttleAlarmName `
        --alarm-description "Throttles alarm for $functionName" `
        --metric-name Throttles `
        --namespace AWS/Lambda `
        --statistic Sum `
        --period 300 `
        --threshold 1 `
        --comparison-operator GreaterThanThreshold `
        --evaluation-periods 1 `
        --alarm-actions $snsTopicArn `
        --dimensions Name=FunctionName,Value=$functionName `
        --region $region

    # 4. Concurrent Executions Alarm (80% of limit)
    $concurrentAlarmName = "safemate-$($functionName.Replace('default-', '').Replace('-', '-'))-concurrent-executions"
    Write-Host "Creating concurrent executions alarm: $concurrentAlarmName" -ForegroundColor Yellow
    
    aws cloudwatch put-metric-alarm `
        --alarm-name $concurrentAlarmName `
        --alarm-description "Concurrent executions alarm for $functionName" `
        --metric-name ConcurrentExecutions `
        --namespace AWS/Lambda `
        --statistic Maximum `
        --period 300 `
        --threshold 800 `
        --comparison-operator GreaterThanThreshold `
        --evaluation-periods 2 `
        --alarm-actions $snsTopicArn `
        --dimensions Name=FunctionName,Value=$functionName `
        --region $region
}

# Create general Lambda health dashboard
Write-Host "Creating CloudWatch dashboard..." -ForegroundColor Yellow

$dashboardBody = @{
    widgets = @(
        @{
            type = "metric"
            x = 0
            y = 0
            width = 12
            height = 6
            properties = @{
                metrics = @()
                view = "timeSeries"
                stacked = $false
                region = $region
                title = "SafeMate Lambda Functions - Error Rate"
                period = 300
            }
        },
        @{
            type = "metric"
            x = 12
            y = 0
            width = 12
            height = 6
            properties = @{
                metrics = @()
                view = "timeSeries"
                stacked = $false
                region = $region
                title = "SafeMate Lambda Functions - Duration"
                period = 300
            }
        },
        @{
            type = "metric"
            x = 0
            y = 6
            width = 12
            height = 6
            properties = @{
                metrics = @()
                view = "timeSeries"
                stacked = $false
                region = $region
                title = "SafeMate Lambda Functions - Invocations"
                period = 300
            }
        },
        @{
            type = "metric"
            x = 12
            y = 6
            width = 12
            height = 6
            properties = @{
                metrics = @()
                view = "timeSeries"
                stacked = $false
                region = $region
                title = "SafeMate Lambda Functions - Throttles"
                period = 300
            }
        }
    )
}

# Add metrics for each function to the dashboard
foreach ($functionName in $lambdaFunctions) {
    $shortName = $functionName.Replace('default-', '').Replace('-', '-')
    
    # Error Rate
    $dashboardBody.widgets[0].properties.metrics += @("AWS/Lambda", "Errors", "FunctionName", $functionName)
    
    # Duration
    $dashboardBody.widgets[1].properties.metrics += @("AWS/Lambda", "Duration", "FunctionName", $functionName)
    
    # Invocations
    $dashboardBody.widgets[2].properties.metrics += @("AWS/Lambda", "Invocations", "FunctionName", $functionName)
    
    # Throttles
    $dashboardBody.widgets[3].properties.metrics += @("AWS/Lambda", "Throttles", "FunctionName", $functionName)
}

$dashboardJson = $dashboardBody | ConvertTo-Json -Depth 10

# Create the dashboard
aws cloudwatch put-dashboard `
    --dashboard-name "SafeMate-Lambda-Monitoring" `
    --dashboard-body $dashboardJson `
    --region $region

Write-Host "CloudWatch monitoring setup completed!" -ForegroundColor Green
Write-Host "Dashboard created: SafeMate-Lambda-Monitoring" -ForegroundColor Green
Write-Host "Alarms created for all Lambda functions" -ForegroundColor Green
Write-Host "SNS topic for alerts: $snsTopicArn" -ForegroundColor Green
