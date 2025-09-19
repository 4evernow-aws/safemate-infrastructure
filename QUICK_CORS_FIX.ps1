# Quick CORS Fix - Copy and paste these commands one by one

# 1. Check API Gateway status
aws apigateway get-rest-api --rest-api-id 2kwe2ly8vh --region ap-southeast-2

# 2. Check resources
aws apigateway get-resources --rest-api-id 2kwe2ly8vh --region ap-southeast-2

# 3. Create OPTIONS method for /folders
aws apigateway put-method --rest-api-id 2kwe2ly8vh --resource-id p6nzw7 --http-method OPTIONS --authorization-type NONE --region ap-southeast-2

# 4. Create mock integration for OPTIONS
aws apigateway put-integration --rest-api-id 2kwe2ly8vh --resource-id p6nzw7 --http-method OPTIONS --type MOCK --request-templates '{"application/json": "{\"statusCode\": 200}"}' --region ap-southeast-2

# 5. Create method response for OPTIONS
aws apigateway put-method-response --rest-api-id 2kwe2ly8vh --resource-id p6nzw7 --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": true, "method.response.header.Access-Control-Allow-Methods": true, "method.response.header.Access-Control-Allow-Origin": true, "method.response.header.Access-Control-Allow-Credentials": true}' --region ap-southeast-2

# 6. Create integration response for OPTIONS
aws apigateway put-integration-response --rest-api-id 2kwe2ly8vh --resource-id p6nzw7 --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept", "method.response.header.Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "method.response.header.Access-Control-Allow-Origin": "*", "method.response.header.Access-Control-Allow-Credentials": "true"}' --region ap-southeast-2

# 7. Deploy the API
aws apigateway create-deployment --rest-api-id 2kwe2ly8vh --stage-name preprod --region ap-southeast-2

# 8. Test CORS
Invoke-WebRequest -Uri "https://2kwe2ly8vh.execute-api.ap-southeast-2.amazonaws.com/preprod/folders" -Method OPTIONS -Headers @{"Origin"="http://preprod-safemate-static-hosting.s3-website-ap-southeast-2.amazonaws.com"; "Access-Control-Request-Method"="GET"; "Access-Control-Request-Headers"="Content-Type,Authorization"} -UseBasicParsing
