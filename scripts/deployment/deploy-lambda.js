const { LambdaClient, UpdateFunctionCodeCommand } = require('@aws-sdk/client-lambda');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const fs = require('fs');
const path = require('path');

// Initialize AWS clients
const lambda = new LambdaClient({ region: 'ap-southeast-2' });
const dynamodb = new DynamoDBClient({ region: 'ap-southeast-2' });

async function deployLambda() {
  try {
    console.log('📦 Creating deployment package...');
    
    // Read the Lambda function code
    const functionCode = fs.readFileSync(path.join(__dirname, 'services/user-onboarding/index.js'));
    
    // Create a simple zip file (in production, you'd want to include dependencies)
    const zipBuffer = Buffer.from(functionCode);
    
    console.log('🚀 Deploying Lambda function...');
    
    const command = new UpdateFunctionCodeCommand({
      FunctionName: 'default-safemate-user-onboarding',
      ZipFile: zipBuffer
    });
    
    const result = await lambda.send(command);
    console.log('✅ Lambda function updated:', result.FunctionName);
    
  } catch (error) {
    console.error('❌ Error deploying Lambda:', error);
  }
}

async function addOperatorCredentials() {
  try {
    console.log('🔐 Adding operator credentials to DynamoDB...');
    
    const command = new PutItemCommand({
      TableName: 'default-safemate-user-secrets',
      Item: {
        user_id: { S: 'operator' },
        account_id: { S: '0.0.6428427' },
        private_key: { S: '302e020100300506032b657004220420a74b2a24706db9034445e6e03a0f3fd7a82a926f6c4a95bc5de9a720d453f9f9' },
        public_key: { S: '302a300506032b6570032100c5712af6c6211bd23fbd24ca2d3440938aa7ed958750f5064be8817072283ae1' }
      }
    });
    
    await dynamodb.send(command);
    console.log('✅ Operator credentials added to DynamoDB');
    
  } catch (error) {
    console.error('❌ Error adding operator credentials:', error);
  }
}

async function main() {
  await deployLambda();
  await addOperatorCredentials();
}

main(); 