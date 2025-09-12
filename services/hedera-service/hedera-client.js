const { Client } = require('@hashgraph/sdk');
const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const kms = new KMSClient({});
const dynamodbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

/**
 * Decrypt private key using KMS
 */
async function decryptPrivateKey(encryptedKey, keyId) {
  try {
    const decryptParams = {
      CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
      KeyId: keyId
    };

    const decryptResult = await kms.send(new DecryptCommand(decryptParams));
    return decryptResult.Plaintext.toString('utf8');
  } catch (error) {
    console.error('❌ Failed to decrypt private key:', error);
    throw new Error('Failed to decrypt key');
  }
}

/**
 * Get operator credentials from DynamoDB
 */
async function getOperatorCredentials() {
  try {
    const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE || 'default-safemate-wallet-keys';
    const APP_SECRETS_KMS_KEY_ID = process.env.OPERATOR_PRIVATE_KEY_KMS_KEY_ID || process.env.APP_SECRETS_KMS_KEY_ID;
    
    const params = {
      TableName: WALLET_KEYS_TABLE,
      Key: { user_id: 'hedera_operator' }
    };

    const result = await dynamodb.send(new GetCommand(params));

    if (!result.Item) {
      throw new Error('No operator credentials found in DynamoDB');
    }

    const decryptedKey = await decryptPrivateKey(
      result.Item.encrypted_private_key,
      APP_SECRETS_KMS_KEY_ID
    );

    return {
      accountId: result.Item.account_id,
      privateKey: decryptedKey
    };
  } catch (error) {
    console.error('❌ Failed to get operator credentials:', error);
    throw error;
  }
}

/**
 * Initialize Hedera client with operator credentials
 * This is a shared utility function to eliminate duplication across services
 */
async function initializeHederaClient() {
  try {
    console.log('🔧 Initializing Hedera client...');
    
    // Get environment variables
    const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
    
    console.log(`🔧 Using Hedera network: ${HEDERA_NETWORK}`);
    
    // Get operator credentials from DynamoDB
    const credentials = await getOperatorCredentials();
    console.log(`🔧 Operator account: ${credentials.accountId}`);
    
    // Create Hedera client
    const client = Client.forName(HEDERA_NETWORK);
    client.setOperator(credentials.accountId, credentials.privateKey);
    
    console.log('✅ Hedera client initialized successfully');
    return client;
    
  } catch (error) {
    console.error('❌ Failed to initialize Hedera client:', error);
    throw error;
  }
}

module.exports = {
  initializeHederaClient
};
