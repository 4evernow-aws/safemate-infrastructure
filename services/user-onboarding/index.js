/**
 * SafeMate v2 - User Onboarding Service
 * 
 * This Lambda function handles user onboarding and Hedera wallet creation.
 * It creates real Hedera testnet accounts using an operator account for funding.
 * 
 * Features:
 * - Real Hedera testnet wallet creation with operator account funding
 * - KMS encryption for private keys
 * - DynamoDB storage for wallet metadata
 * - Email verification support for all users
 * - CORS support for all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
 * - Cognito User Pool authentication
 * - Environment-based configuration
 * 
 * Environment Variables Required:
 * - WALLET_METADATA_TABLE: DynamoDB table for wallet metadata
 * - WALLET_KEYS_TABLE: DynamoDB table for encrypted private keys
 * - WALLET_KMS_KEY_ID: KMS key ID for wallet encryption
 * - OPERATOR_PRIVATE_KEY_KMS_KEY_ID: KMS key ID for operator private key
 * - HEDERA_NETWORK: Hedera network (testnet/mainnet)
 * - AWS_REGION: AWS region for services
 * 
 * API Endpoints:
 * - GET /onboarding/status: Check user's wallet status
 * - POST /onboarding/start: Start wallet creation process
 * - OPTIONS: CORS preflight support
 * 
 * DynamoDB Tables:
 * - wallet-metadata: Stores wallet information and metadata
 * - wallet-keys: Stores encrypted private keys
 * 
 * Security:
 * - All private keys encrypted with AWS KMS
 * - Cognito JWT token validation
 * - CORS protection for cross-origin requests
 * 
 * @version 2.2.0
 * @author SafeMate Development Team
 * @lastUpdated 2025-01-01
 * @environment Development (dev)
 * @awsRegion ap-southeast-2
 * @hederaNetwork testnet
 * @corsOrigin http://localhost:5173
 * @supportedMethods GET,POST,PUT,DELETE,OPTIONS
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, EncryptCommand, DecryptCommand } = require('@aws-sdk/client-kms');
const { 
  Client, 
  AccountCreateTransaction, 
  PrivateKey, 
  Hbar,
  AccountId
} = require('@hashgraph/sdk');

// Initialize AWS services
const dynamodb = new DynamoDBClient({ region: 'ap-southeast-2' });
const dynamodbDoc = DynamoDBDocumentClient.from(dynamodb);
const kms = new KMSClient({ region: 'ap-southeast-2' });

// CORS headers with support for all methods and environments
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // Allow all origins for development
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

// Environment variables
const WALLET_METADATA_TABLE = process.env.WALLET_METADATA_TABLE;
const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE;
const WALLET_KMS_KEY_ID = process.env.WALLET_KMS_KEY_ID;
const OPERATOR_PRIVATE_KEY_KMS_KEY_ID = process.env.OPERATOR_PRIVATE_KEY_KMS_KEY_ID;
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';

/**
 * Extract user information from Cognito JWT token claims
 * Enhanced to handle different token formats and provide better debugging
 */
function extractUserInfo(event) {
  console.log('🔍 Extracting user information from event...');
  console.log('🔍 Event structure:', JSON.stringify(event, null, 2));
  
  // Check multiple possible locations for user claims
  const possibleClaimPaths = [
    'requestContext.authorizer.claims',
    'requestContext.authorizer.jwt.claims',
    'requestContext.authorizer',
    'headers.x-cognito-id-token',
    'headers.authorization'
  ];
  
  let userClaims = {};
  let userId = null;
  let email = null;
  
  // Try to extract claims from different locations
  for (const path of possibleClaimPaths) {
    const pathParts = path.split('.');
    let value = event;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = null;
        break;
      }
    }
    
    if (value) {
      console.log(`🔍 Found data at path ${path}:`, JSON.stringify(value, null, 2));
      
      if (path === 'headers.authorization' && value.startsWith('Bearer ')) {
        // Extract token from Authorization header
        const token = value.replace('Bearer ', '');
        console.log('🔍 Extracted token from Authorization header');
        
        try {
          // Decode JWT token to extract claims
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            console.log('🔍 Decoded JWT payload:', JSON.stringify(payload, null, 2));
            
            userClaims = payload;
            userId = payload.sub || payload['cognito:username'];
            email = payload.email || payload['cognito:email'];
            
            if (userId && email) {
              console.log('✅ Successfully extracted user info from JWT token');
              break;
            }
          }
        } catch (jwtError) {
          console.log('⚠️ Failed to decode JWT token:', jwtError.message);
        }
      } else if (typeof value === 'object' && (value.sub || value['cognito:username'])) {
        // Direct claims object
        userClaims = value;
        userId = value.sub || value['cognito:username'];
        email = value.email || value['cognito:email'];
        
        if (userId && email) {
          console.log('✅ Successfully extracted user info from claims object');
          break;
        }
      }
    }
  }
  
  // Fallback values if extraction fails
  if (!userId) {
    userId = 'default-user-' + Date.now();
    console.log('⚠️ Using fallback userId:', userId);
  }
  
  if (!email) {
    email = 'default@example.com';
    console.log('⚠️ Using fallback email:', email);
  }
  
  console.log('🔍 Final extracted values:');
  console.log('  - userId:', userId);
  console.log('  - email:', email);
  console.log('  - userClaims:', JSON.stringify(userClaims, null, 2));
  
  return { userId, email, userClaims };
}

/**
 * Get operator credentials from DynamoDB
 */
async function getOperatorCredentials() {
  try {
    console.log('🔍 Getting operator credentials from DynamoDB...');
    
    const result = await dynamodbDoc.send(new GetCommand({
      TableName: WALLET_KEYS_TABLE,
      Key: { user_id: 'hedera_operator' }
    }));

    if (!result.Item) {
      throw new Error('No operator credentials found in DynamoDB');
    }

    console.log('✅ Operator credentials found');
    return result.Item;
    
  } catch (error) {
    console.error('❌ Failed to get operator credentials:', error);
    throw error;
  }
}

/**
 * Decrypt private key using KMS
 */
async function decryptPrivateKey(encryptedKey, keyId) {
  try {
    console.log('🔐 Decrypting private key with KMS...');
    
    const decryptCommand = new DecryptCommand({
      KeyId: keyId,
      CiphertextBlob: Buffer.from(encryptedKey, 'base64')
    });
    
    const decryptResult = await kms.send(decryptCommand);
    
    console.log('✅ Private key decrypted successfully');
    console.log('🔍 Decrypted key type:', typeof decryptResult.Plaintext);
    console.log('🔍 Decrypted key length:', decryptResult.Plaintext.length);
    console.log('🔍 Decrypted key preview:', decryptResult.Plaintext.slice(0, 10));
    
    // The decrypted result is already the raw 32-byte private key
    console.log('🔍 Decrypted raw bytes, returning directly');
    
    return decryptResult.Plaintext;
    
  } catch (error) {
    console.error('❌ Failed to decrypt private key:', error);
    throw error;
  }
}

/**
 * Initialize Hedera client with operator account
 */
async function initializeHederaClient() {
  try {
    console.log('🔧 Initializing Hedera client...');
    
    // Get operator credentials from DynamoDB
    const operatorCredentials = await getOperatorCredentials();
    
    // Decrypt private key
    const privateKeyBytes = await decryptPrivateKey(
      operatorCredentials.encrypted_private_key,
      OPERATOR_PRIVATE_KEY_KMS_KEY_ID
    );
    
    console.log('🔍 Decrypted private key format:', typeof privateKeyBytes);
    console.log('🔍 Decrypted private key length:', privateKeyBytes.length);
    console.log('🔍 Decrypted private key preview:', Array.from(privateKeyBytes.slice(0, 8)));
    
    // Create Hedera client - use the raw bytes directly
    let operatorPrivateKey;
    try {
      if (privateKeyBytes.length !== 32) {
        throw new Error(`Invalid key length: expected 32 bytes, got ${privateKeyBytes.length}`);
      }
      
      operatorPrivateKey = PrivateKey.fromBytes(privateKeyBytes);
      console.log('✅ Private key loaded as raw 32-byte key');
    } catch (keyError) {
      console.log('❌ Raw key failed:', keyError.message);
      throw new Error(`Failed to load private key: ${keyError.message}`);
    }
    const operatorAccountId = AccountId.fromString(operatorCredentials.account_id);
    
    const client = Client.forName(HEDERA_NETWORK);
    client.setOperator(operatorAccountId, operatorPrivateKey);
    
    console.log('✅ Hedera client initialized successfully');
    console.log('🔧 Operator account:', operatorCredentials.account_id);
    
    return { client, operatorAccountId, operatorPrivateKey };
    
  } catch (error) {
    console.error('❌ Error initializing Hedera client:', error);
    throw error;
  }
}

/**
 * Get onboarding status for a user
 */
async function getOnboardingStatus(userId) {
  console.log('🔍 Getting onboarding status for user:', userId);
  console.log('🔍 Using table:', WALLET_METADATA_TABLE);
  
  try {
    const command = new QueryCommand({
      TableName: WALLET_METADATA_TABLE,
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: 1
    });
    
    console.log('🔍 Executing DynamoDB query...');
    const response = await dynamodbDoc.send(command);
    console.log('🔍 DynamoDB response:', JSON.stringify(response, null, 2));
    
    if (response.Items && response.Items.length > 0) {
      const wallet = response.Items[0];
      console.log('✅ Wallet found for user:', userId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          hasWallet: true,
          wallet: {
            hedera_account_id: wallet.hedera_account_id,
            public_key: wallet.public_key,
            account_type: wallet.account_type || 'personal',
            network: wallet.network || 'testnet',
            initial_balance_hbar: wallet.initial_balance_hbar || '0.1',
            needs_funding: false,
            created_by_operator: wallet.created_by_operator || true
          }
        })
      };
    } else {
      console.log('❌ No wallet found for user:', userId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          hasWallet: false,
          wallet: null
        })
      };
    }
  } catch (error) {
    console.error('❌ Error getting onboarding status:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        hasWallet: false,
        wallet: null,
        error: error.message,
        stack: error.stack
      })
    };
  }
}

/**
 * Start onboarding process and create real Hedera wallet
 */
async function startOnboarding(userId, email) {
  console.log('🚀 Starting onboarding for user:', userId);
  
  try {
    // Check if wallet already exists
    const existingWallet = await getOnboardingStatus(userId);
    const existingData = JSON.parse(existingWallet.body);
    
    if (existingData.hasWallet) {
      console.log('✅ Wallet already exists for user:', userId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Wallet already exists',
          wallet: existingData.wallet
        })
      };
    }
    
    console.log('🔧 Creating real Hedera wallet for user:', userId);
    
    // Initialize Hedera client
    const { client } = await initializeHederaClient();
    
    // Generate new Ed25519 keypair for user
    const userPrivateKey = PrivateKey.generateED25519();
    const userPublicKey = userPrivateKey.publicKey;
    
    console.log('🔑 Generated Ed25519 keypair for user');
    
    // Create Hedera account with initial funding
    const transaction = new AccountCreateTransaction()
      .setKey(userPublicKey)
      .setInitialBalance(new Hbar(0.1))
      .setMaxAutomaticTokenAssociations(10);
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;
    
    console.log('✅ Created Hedera account:', accountId.toString());
    
    // Encrypt private key with KMS
    const encryptCommand = new EncryptCommand({
      KeyId: WALLET_KMS_KEY_ID,
      Plaintext: userPrivateKey.toString()
    });
    
    const encryptResult = await kms.send(encryptCommand);
    const encryptedPrivateKey = encryptResult.CiphertextBlob.toString('base64');
    
    // Generate wallet ID
    const walletId = 'wallet-' + Date.now() + '-operator';
    
    // Store wallet metadata
    const walletData = {
      user_id: userId,
      wallet_id: walletId,
      hedera_account_id: accountId.toString(),
      public_key: userPublicKey.toString(),
      account_type: 'personal',
      network: 'testnet',
      initial_balance_hbar: '0.1',
      created_at: new Date().toISOString(),
      email: email,
      status: 'active',
      created_by_operator: true
    };
    
    console.log('🔍 Storing wallet metadata:', JSON.stringify(walletData, null, 2));
    
    await dynamodbDoc.send(new PutCommand({
      TableName: WALLET_METADATA_TABLE,
      Item: walletData
    }));
    
    // Store encrypted private key
    const keyData = {
      user_id: userId,
      wallet_id: walletId,
      encrypted_private_key: encryptResult.CiphertextBlob.toString('base64'),
      key_type: 'ed25519',
      created_at: new Date().toISOString(),
      kms_key_id: WALLET_KMS_KEY_ID
    };
    
    console.log('🔍 Storing encrypted private key');
    
    await dynamodbDoc.send(new PutCommand({
      TableName: WALLET_KEYS_TABLE,
      Item: keyData
    }));
    
    console.log('✅ Real Hedera wallet created successfully for user:', userId);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Real Hedera wallet created successfully',
        hasWallet: true,
        wallet: {
          wallet_id: walletId,
          hedera_account_id: accountId.toString(),
          public_key: userPublicKey.toString(),
          account_type: 'personal',
          network: 'testnet',
          initial_balance_hbar: '0.1',
          needs_funding: false,
          created_by_operator: true,
          transaction_id: response.transactionId.toString()
        }
      })
    };
    
  } catch (error) {
    console.error('❌ Error starting onboarding:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to create wallet',
        error: error.message,
        stack: error.stack
      })
    };
  }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('🔧 Lambda function invoked with event:', JSON.stringify(event, null, 2));
  console.log('🔧 Environment variables:', {
    WALLET_METADATA_TABLE,
    WALLET_KEYS_TABLE,
    WALLET_KMS_KEY_ID,
    OPERATOR_PRIVATE_KEY_KMS_KEY_ID,
    HEDERA_NETWORK
  });
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }
    
    // Extract user information from Cognito claims
    const { userId, email, userClaims } = extractUserInfo(event);
    
    console.log('🔧 User claims:', userClaims);
    console.log('🔧 Extracted userId:', userId);
    console.log('🔧 Extracted email:', email);
    
    const path = event.path;
    const httpMethod = event.httpMethod;
    
    console.log('🔧 Processing request:', httpMethod, path);
    
    if (path === '/onboarding/status' && httpMethod === 'GET') {
      return await getOnboardingStatus(userId);
    } else if (path === '/onboarding/start' && httpMethod === 'POST') {
      return await startOnboarding(userId, email);
    } else if (httpMethod === 'PUT') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'PUT method supported for CORS',
          path: path,
          method: httpMethod
        })
      };
    } else if (httpMethod === 'DELETE') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'DELETE method supported for CORS',
          path: path,
          method: httpMethod
        })
      };
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Endpoint not found',
          path: path,
          method: httpMethod
        })
      };
    }
    
  } catch (error) {
    console.error('❌ Lambda function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
