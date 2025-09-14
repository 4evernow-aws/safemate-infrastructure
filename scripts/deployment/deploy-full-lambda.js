const { LambdaClient, UpdateFunctionCodeCommand, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');

const lambda = new LambdaClient({ region: 'ap-southeast-2' });

async function deployFullLambda() {
  console.log('🔧 Deploying complete Lambda function with full Hedera integration...');
  
  try {
    // Create the complete Lambda function code with full Hedera integration
    const functionCode = `
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } = require('@aws-sdk/client-kms');
const { Client, PrivateKey, AccountId, AccountCreateTransaction, Hbar } = require('@hashgraph/sdk');
const crypto = require('crypto');

// Initialize AWS services with SDK v3
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-southeast-2' }));
const kms = new KMSClient({ region: 'ap-southeast-2' });

// Environment variables
const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE || 'safemate-wallet-keys';
const WALLET_METADATA_TABLE = process.env.WALLET_METADATA_TABLE || 'safemate-wallet-metadata';
const WALLET_KMS_KEY_ID = process.env.WALLET_KMS_KEY_ID;
const APP_SECRETS_KMS_KEY_ID = process.env.APP_SECRETS_KMS_KEY_ID;
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';

// Hedera network configuration
const NETWORK_CONFIG = {
    testnet: {
        nodes: { '0.testnet.hedera.com:50211': new AccountId(3) },
        mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com'
    },
    mainnet: {
        nodes: { '35.237.200.180:50211': new AccountId(3) },
        mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com'
    }
};

// CORS headers function
function getCorsHeaders(event) {
  const origin = event?.headers?.origin || event?.headers?.Origin || 'http://localhost:5173';
  
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://safemate.com',
    'https://www.safemate.com'
  ];
  
  const allowOrigin = allowedOrigins.includes(origin) ? origin : 'null';
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };
}

/**
 * Generate Ed25519 keypair for Hedera wallet
 */
function generateHederaKeypair() {
  try {
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;
    
    return {
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
      publicKeyRaw: publicKey.toStringRaw()
    };
  } catch (error) {
    console.error('❌ Failed to generate Hedera keypair:', error);
    throw new Error('Failed to generate wallet keys');
  }
}

/**
 * Encrypt private key using AWS KMS
 */
async function encryptPrivateKey(privateKey, keyId) {
  try {
    const params = {
      KeyId: keyId,
      Plaintext: Buffer.from(privateKey, 'utf8')
    };
    
    const command = new EncryptCommand(params);
    const result = await kms.send(command);
    return Buffer.from(result.CiphertextBlob).toString('base64');
  } catch (error) {
    console.error('❌ Failed to encrypt private key:', error);
    throw new Error('Failed to encrypt wallet keys');
  }
}

/**
 * Decrypt private key using AWS KMS
 */
async function decryptPrivateKey(encryptedKey, keyId) {
  try {
    const params = {
      KeyId: keyId,
      CiphertextBlob: Buffer.from(encryptedKey, 'base64')
    };
    
    const command = new DecryptCommand(params);
    const result = await kms.send(command);
    return Buffer.from(result.Plaintext).toString('utf8');
  } catch (error) {
    console.error('❌ Failed to decrypt private key:', error);
    throw new Error('Failed to decrypt wallet keys');
  }
}

/**
 * Get operator credentials from DynamoDB
 */
async function getOperatorCredentials() {
  try {
    const params = {
      TableName: WALLET_KEYS_TABLE,
      Key: { user_id: 'hedera_operator' }
    };

    const command = new GetCommand(params);
    const result = await dynamodb.send(command);

    if (!result.Item) {
      throw new Error('No operator credentials found');
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
 * Initialize Hedera client with operator
 */
async function initializeHederaClient() {
  try {
    const operatorCreds = await getOperatorCredentials();
    if (!operatorCreds) {
      throw new Error('No operator credentials found');
    }

    const config = NETWORK_CONFIG[HEDERA_NETWORK];
    const client = Client.forNetwork(config.nodes);
    
    const operatorAccountId = AccountId.fromString(operatorCreds.accountId);
    const operatorPrivateKey = PrivateKey.fromString(operatorCreds.privateKey);
    
    client.setOperator(operatorAccountId, operatorPrivateKey);
    
    console.log(\`✅ Initialized Hedera client for \${HEDERA_NETWORK} with operator \${operatorCreds.accountId}\`);
    return { client, operatorAccountId, operatorPrivateKey };
  } catch (error) {
    console.error('❌ Failed to initialize Hedera client:', error);
    throw error;
  }
}

/**
 * Store wallet data in DynamoDB
 */
async function storeWalletData(userId, email, keypair, accountId, initialBalance, transactionId) {
  try {
    const walletId = \`wallet-\${Date.now()}-\${crypto.randomBytes(4).toString('hex')}\`;
    const timestamp = new Date().toISOString();
    
    // Encrypt private key with KMS
    let encryptedPrivateKey = null;
    if (WALLET_KMS_KEY_ID) {
      encryptedPrivateKey = await encryptPrivateKey(keypair.privateKey, WALLET_KMS_KEY_ID);
    } else {
      throw new Error('KMS key required for secure wallet storage');
    }
    
    // Store wallet keys
    await dynamodb.send(new PutCommand({
      TableName: WALLET_KEYS_TABLE,
      Item: {
        user_id: userId,
        account_id: accountId,
        encrypted_private_key: encryptedPrivateKey,
        public_key: keypair.publicKey,
        created_at: timestamp,
        key_type: 'ED25519',
        encryption_type: 'kms'
      }
    }));
    
    // Store wallet metadata
    await dynamodb.send(new PutCommand({
      TableName: WALLET_METADATA_TABLE,
      Item: {
        user_id: userId,
        wallet_id: walletId,
        email: email,
        hedera_account_id: accountId,
        public_key: keypair.publicKey,
        wallet_type: 'operator_created',
        status: 'active',
        created_at: timestamp,
        network: HEDERA_NETWORK,
        needs_funding: false,
        initial_balance: initialBalance,
        transaction_id: transactionId
      }
    }));
    
    console.log(\`✅ Wallet data stored for user \${userId}\`);
    return { walletId, accountId };
  } catch (error) {
    console.error('❌ Failed to store wallet data:', error);
    throw error;
  }
}

/**
 * Get onboarding status for a user
 */
async function getOnboardingStatus(userId) {
  try {
    const params = {
      TableName: WALLET_METADATA_TABLE,
      Key: { user_id: userId }
    };

    const command = new GetCommand(params);
    const result = await dynamodb.send(command);
    
    if (result.Item) {
      return {
        success: true,
        hasWallet: true,
        walletId: result.Item.wallet_id,
        accountId: result.Item.hedera_account_id,
        status: result.Item.status,
        network: result.Item.network
      };
    } else {
      return {
        success: true,
        hasWallet: false
      };
    }
  } catch (error) {
    console.error('❌ Failed to get onboarding status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Start onboarding process for a new user
 */
async function startOnboarding(userId, email) {
  try {
    console.log(\`🚀 Starting onboarding for user \${userId}\`);
    
    // Check if user already has a wallet
    const status = await getOnboardingStatus(userId);
    if (status.hasWallet) {
      return {
        success: true,
        message: 'User already has a wallet',
        walletId: status.walletId,
        accountId: status.accountId
      };
    }
    
    // Initialize Hedera client
    const { client } = await initializeHederaClient();
    
    // Generate keypair
    const keypair = generateHederaKeypair();
    console.log('✅ Generated Hedera keypair');
    
    // Create Hedera account
    const transaction = new AccountCreateTransaction()
      .setKey(keypair.publicKey)
      .setInitialBalance(new Hbar(0.1)); // Fund with 0.1 HBAR
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;
    
    console.log(\`✅ Created Hedera account: \${accountId}\`);
    
    // Store wallet data
    const { walletId } = await storeWalletData(
      userId, 
      email, 
      keypair, 
      accountId.toString(), 
      0.1, 
      response.transactionId.toString()
    );
    
    return {
      success: true,
      message: 'Wallet created successfully',
      walletId: walletId,
      accountId: accountId.toString(),
      transactionId: response.transactionId.toString()
    };
    
  } catch (error) {
    console.error('❌ Failed to start onboarding:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main handler function
exports.handler = async (event) => {
  console.log('📥 Event received:', JSON.stringify(event, null, 2));
  
  const corsHeaders = getCorsHeaders(event);
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }
    
    const { httpMethod, path, body } = event;
    
    // Parse request body
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (error) {
        console.error('❌ Failed to parse request body:', error);
      }
    }
    
    let response;
    
    if (httpMethod === 'POST' && path === '/onboarding/start') {
      const { userId, email } = requestBody;
      
      if (!userId || !email) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            error: 'userId and email are required' 
          })
        };
      }
      
      response = await startOnboarding(userId, email);
      
    } else if ((httpMethod === 'GET' || httpMethod === 'POST') && path === '/onboarding/status') {
      const { userId } = requestBody;
      
      if (!userId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: false, 
            error: 'userId is required' 
          })
        };
      }
      
      response = await getOnboardingStatus(userId);
      
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false, 
          error: 'Endpoint not found' 
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('❌ Handler error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
`;

    // Create a zip file with the function code
    const archiver = require('archiver');
    const output = fs.createWriteStream('full-lambda.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', async () => {
      console.log('✅ Lambda zip created successfully!');
      
      // Read the zip file
      const zipBuffer = fs.readFileSync('full-lambda.zip');
      
      // Update the Lambda function
      const command = new UpdateFunctionCodeCommand({
        FunctionName: 'default-safemate-user-onboarding',
        ZipFile: zipBuffer
      });
      
      const response = await lambda.send(command);
      console.log('✅ Lambda function updated successfully!');
      console.log('Response:', response);
      
      // Cleanup
      fs.unlinkSync('full-lambda.zip');
      
      console.log('🎉 Full Lambda function deployed successfully!');
      console.log('The function now includes complete Hedera wallet creation functionality.');
      console.log('Note: You will need to add the required dependencies as a layer.');
      console.log('You can now test the complete wallet creation flow!');
    });
    
    archive.pipe(output);
    archive.append(functionCode, { name: 'index.js' });
    archive.finalize();
    
  } catch (error) {
    console.error('❌ Error deploying Lambda function:', error);
  }
}

deployFullLambda();
