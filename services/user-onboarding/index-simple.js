/**
 * SafeMate v2 - User Onboarding Service (Simplified Test Version)
 * 
 * This is a simplified version to test basic functionality and identify 500 errors.
 * Updated for preprod environment with correct CORS headers and enhanced debugging.
 * 
 * @version 2.1.2
 * @author SafeMate Development Team
 * @lastUpdated 2025-09-17
 * @environment Preprod
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS services
const dynamodb = new DynamoDBClient({ region: 'ap-southeast-2' });
const dynamodbDoc = DynamoDBDocumentClient.from(dynamodb);

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

// Environment variables
const WALLET_METADATA_TABLE = process.env.WALLET_METADATA_TABLE || 'dev-safemate-wallet-metadata';
const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE || 'dev-safemate-wallet-keys';

/**
 * Get onboarding status for a user (simplified)
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
 * Start onboarding process (simplified - returns mock data)
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
    
    console.log('🔧 Creating mock wallet for user:', userId);
    
    // Generate mock wallet data
    const walletId = 'wallet-' + Date.now() + '-mock';
    const mockAccountId = '0.0.' + Math.floor(Math.random() * 10000000);
    
    // Store mock wallet metadata
    const walletData = {
      user_id: userId,
      wallet_id: walletId,
      hedera_account_id: mockAccountId,
      public_key: 'mock-public-key-' + Date.now(),
      account_type: 'personal',
      network: 'testnet',
      initial_balance_hbar: '0.1',
      created_at: new Date().toISOString(),
      email: email,
      status: 'active',
      created_by_operator: true
    };
    
    console.log('🔍 Storing mock wallet metadata:', JSON.stringify(walletData, null, 2));
    
    // Store wallet metadata in DynamoDB
    const putCommand = new PutCommand({
      TableName: WALLET_METADATA_TABLE,
      Item: walletData
    });
    
    console.log('🔍 Storing wallet in DynamoDB table:', WALLET_METADATA_TABLE);
    await dynamodbDoc.send(putCommand);
    console.log('✅ Mock wallet stored successfully in DynamoDB for user:', userId);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Mock wallet created successfully (simplified test)',
        hasWallet: true,
        wallet: {
          wallet_id: walletId,
          hedera_account_id: mockAccountId,
          public_key: walletData.public_key,
          account_type: 'personal',
          network: 'testnet',
          initial_balance_hbar: '0.1',
          needs_funding: false,
          created_by_operator: true,
          note: 'This is a mock wallet for testing purposes'
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
    WALLET_KEYS_TABLE
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
    
    // Debug request context
    console.log('🔧 Request context:', JSON.stringify(event.requestContext, null, 2));
    console.log('🔧 Authorizer:', JSON.stringify(event.requestContext?.authorizer, null, 2));
    
    // Extract user information from Cognito claims
    const userClaims = event.requestContext?.authorizer?.claims || {};
    const userId = userClaims.sub || userClaims['cognito:username'] || 'default-user';
    const email = userClaims.email || userClaims['cognito:email'] || 'default@example.com';
    
    console.log('🔧 User claims:', userClaims);
    console.log('🔧 Extracted userId:', userId);
    console.log('🔧 Extracted email:', email);
    
    // If no claims are available, return a more informative error
    if (!userClaims || Object.keys(userClaims).length === 0) {
      console.log('❌ No user claims found in request context');
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'No user claims found in request context',
          debug: {
            hasRequestContext: !!event.requestContext,
            hasAuthorizer: !!event.requestContext?.authorizer,
            hasClaims: !!event.requestContext?.authorizer?.claims
          }
        })
      };
    }
    
    const path = event.path;
    const httpMethod = event.httpMethod;
    
    console.log('🔧 Processing request:', httpMethod, path);
    
    if (path === '/onboarding/status' && httpMethod === 'GET') {
      return await getOnboardingStatus(userId);
    } else if (path === '/onboarding/start' && httpMethod === 'POST') {
      return await startOnboarding(userId, email);
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
