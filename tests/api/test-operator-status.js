const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS services
const dynamoClient = new DynamoDBClient({ region: 'ap-southeast-2' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

async function checkOperatorStatus() {
  try {
    console.log('🔍 Checking Hedera operator account status...');
    
    // Check if operator credentials exist
    const result = await dynamodb.send(new GetCommand({
      TableName: 'default-safemate-wallet-keys',
      Key: { user_id: 'hedera_operator' }
    }));

    if (result.Item) {
      console.log('✅ Operator credentials found!');
      console.log('Account ID:', result.Item.account_id);
      console.log('Public Key:', result.Item.public_key);
      console.log('Key Type:', result.Item.key_type);
      console.log('Encryption Type:', result.Item.encryption_type);
      console.log('Created:', result.Item.created_at);
      console.log('Network:', result.Item.network);
      
      if (result.Item.encrypted_private_key) {
        console.log('✅ Encrypted private key is present');
      } else {
        console.log('❌ Encrypted private key is missing');
      }
    } else {
      console.log('❌ No operator credentials found in DynamoDB');
      console.log('   This means wallet creation will fail');
    }
    
    // Check environment variables
    console.log('\n🔧 Environment Configuration:');
    console.log('HEDERA_NETWORK:', process.env.HEDERA_NETWORK || 'testnet');
    console.log('WALLET_KEYS_TABLE:', process.env.WALLET_KEYS_TABLE || 'default-safemate-wallet-keys');
    console.log('APP_SECRETS_KMS_KEY_ID:', process.env.APP_SECRETS_KMS_KEY_ID ? 'Set' : 'Not set');
    console.log('WALLET_KMS_KEY_ID:', process.env.WALLET_KMS_KEY_ID ? 'Set' : 'Not set');
    
  } catch (error) {
    console.error('❌ Error checking operator status:', error);
  }
}

checkOperatorStatus();
