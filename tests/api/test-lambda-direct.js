const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'ap-southeast-2' });

async function testLambdaDirect() {
  console.log('🧪 Testing Lambda function directly...');
  
  const testEvent = {
    httpMethod: 'POST',
    path: '/onboarding/status',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify({
      userId: 'test-user-direct'
    })
  };
  
  try {
    const command = new InvokeCommand({
      FunctionName: 'default-safemate-user-onboarding',
      Payload: JSON.stringify(testEvent),
      LogType: 'Tail'
    });
    
    const response = await lambda.send(command);
    
    console.log('📡 Lambda Response Status:', response.StatusCode);
    console.log('📡 Lambda Response Headers:', response.ResponseMetadata);
    
    if (response.Payload) {
      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      console.log('📡 Lambda Response Payload:', JSON.stringify(payload, null, 2));
    }
    
    if (response.LogResult) {
      const logs = Buffer.from(response.LogResult, 'base64').toString();
      console.log('📡 Lambda Logs:');
      console.log(logs);
    }
    
  } catch (error) {
    console.error('❌ Lambda invocation failed:', error);
  }
}

testLambdaDirect();
