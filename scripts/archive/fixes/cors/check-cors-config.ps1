# AWS CLI Commands to Check CORS Configuration
# This script provides all the commands needed to diagnose CORS issues

Write-Host "🔍 AWS CLI Commands to Check CORS Configuration" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow

$API_ID = "527ye7o1j0"
$STAGE_NAME = "default"

Write-Host "`n📋 1. Check API Gateway Resources" -ForegroundColor Cyan
Write-Host "aws apigateway get-resources --rest-api-id $API_ID --output table" -ForegroundColor Gray

Write-Host "`n📋 2. Check API Gateway Methods for each resource" -ForegroundColor Cyan
Write-Host "# First get resource IDs from step 1, then run:" -ForegroundColor Gray
Write-Host "aws apigateway get-method --rest-api-id $API_ID --resource-id {RESOURCE_ID} --http-method OPTIONS" -ForegroundColor Gray
Write-Host "aws apigateway get-method --rest-api-id $API_ID --resource-id {RESOURCE_ID} --http-method POST" -ForegroundColor Gray
Write-Host "aws apigateway get-method --rest-api-id $API_ID --resource-id {RESOURCE_ID} --http-method GET" -ForegroundColor Gray

Write-Host "`n📋 3. Check Method Responses (CORS Headers)" -ForegroundColor Cyan
Write-Host "aws apigateway get-method-response --rest-api-id $API_ID --resource-id {RESOURCE_ID} --http-method OPTIONS --status-code 200" -ForegroundColor Gray

Write-Host "`n📋 4. Check Integration Responses (CORS Header Values)" -ForegroundColor Cyan
Write-Host "aws apigateway get-integration-response --rest-api-id $API_ID --resource-id {RESOURCE_ID} --http-method OPTIONS --status-code 200" -ForegroundColor Gray

Write-Host "`n📋 5. Check Gateway Responses (for 401, 500 errors)" -ForegroundColor Cyan
Write-Host "aws apigateway get-gateway-response --rest-api-id $API_ID --response-type UNAUTHORIZED" -ForegroundColor Gray
Write-Host "aws apigateway get-gateway-response --rest-api-id $API_ID --response-type DEFAULT_4XX" -ForegroundColor Gray
Write-Host "aws apigateway get-gateway-response --rest-api-id $API_ID --response-type DEFAULT_5XX" -ForegroundColor Gray
Write-Host "aws apigateway get-gateway-response --rest-api-id $API_ID --response-type ACCESS_DENIED" -ForegroundColor Gray

Write-Host "`n📋 6. Check API Deployments" -ForegroundColor Cyan
Write-Host "aws apigateway get-deployments --rest-api-id $API_ID --output table" -ForegroundColor Gray

Write-Host "`n📋 7. Check Stage Configuration" -ForegroundColor Cyan
Write-Host "aws apigateway get-stage --rest-api-id $API_ID --stage-name $STAGE_NAME" -ForegroundColor Gray

Write-Host "`n📋 8. Check Lambda Function Configuration" -ForegroundColor Cyan
Write-Host "aws lambda get-function --function-name default-safemate-ultimate-wallet --query 'Configuration.Environment.Variables'" -ForegroundColor Gray

Write-Host "`n📋 9. Check Lambda Function Logs" -ForegroundColor Cyan
Write-Host "aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/default-safemate-ultimate-wallet'" -ForegroundColor Gray
Write-Host "# Then get the latest log stream:" -ForegroundColor Gray
Write-Host "aws logs describe-log-streams --log-group-name '/aws/lambda/default-safemate-ultimate-wallet' --order-by LastEventTime --descending --max-items 1" -ForegroundColor Gray
Write-Host "# Then get the latest events:" -ForegroundColor Gray
Write-Host "aws logs get-log-events --log-group-name '/aws/lambda/default-safemate-ultimate-wallet' --log-stream-name {LOG_STREAM_NAME} --limit 10" -ForegroundColor Gray

Write-Host "`n📋 10. Test API Endpoints" -ForegroundColor Cyan
Write-Host "# Test OPTIONS request:" -ForegroundColor Gray
Write-Host "curl -X OPTIONS 'https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/onboarding/start' -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type,Authorization' -v" -ForegroundColor Gray

Write-Host "`n📋 11. Check API Gateway Authorizers" -ForegroundColor Cyan
Write-Host "aws apigateway get-authorizers --rest-api-id $API_ID" -ForegroundColor Gray

Write-Host "`n📋 12. Check API Gateway Models" -ForegroundColor Cyan
Write-Host "aws apigateway get-models --rest-api-id $API_ID" -ForegroundColor Gray

Write-Host "`n🎯 Quick Diagnostic Commands:" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "`n🔍 Quick Check 1: Get all resources" -ForegroundColor Yellow
Write-Host "aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`\`/onboarding/start\`' || path==`\`/onboarding/status\`' || path==`\`/onboarding/retry\`']'" -ForegroundColor Gray

Write-Host "`n🔍 Quick Check 2: Check if OPTIONS methods exist" -ForegroundColor Yellow
Write-Host "aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`\`/onboarding/start\`'].resourceMethods.OPTIONS'" -ForegroundColor Gray

Write-Host "`n🔍 Quick Check 3: Check Lambda function status" -ForegroundColor Yellow
Write-Host "aws lambda get-function --function-name default-safemate-ultimate-wallet --query 'Configuration.{FunctionName:FunctionName,LastModified:LastModified,Runtime:Runtime,Handler:Handler}'" -ForegroundColor Gray

Write-Host "`n🔍 Quick Check 4: Test API endpoint directly" -ForegroundColor Yellow
Write-Host "curl -X OPTIONS 'https://$API_ID.execute-api.ap-southeast-2.amazonaws.com/$STAGE_NAME/onboarding/start' -H 'Origin: http://localhost:5173' -v" -ForegroundColor Gray

Write-Host "`n📋 Expected Results:" -ForegroundColor Cyan
Write-Host "✅ OPTIONS methods should exist for all resources" -ForegroundColor Green
Write-Host "✅ Method responses should include CORS headers" -ForegroundColor Green
Write-Host "✅ Integration responses should have CORS header values" -ForegroundColor Green
Write-Host "✅ Gateway responses should include CORS headers" -ForegroundColor Green
Write-Host "✅ Lambda function should be active and have environment variables" -ForegroundColor Green

Write-Host "`n❌ Common Issues:" -ForegroundColor Red
Write-Host "❌ Missing OPTIONS methods" -ForegroundColor Red
Write-Host "❌ Missing CORS headers in method responses" -ForegroundColor Red
Write-Host "❌ Missing CORS header values in integration responses" -ForegroundColor Red
Write-Host "❌ API not deployed to correct stage" -ForegroundColor Red
Write-Host "❌ Lambda function missing environment variables" -ForegroundColor Red
