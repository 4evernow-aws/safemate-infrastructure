const AWS = require('aws-sdk');
const { Client, PrivateKey, AccountId, AccountCreateTransaction, Hbar } = require('./node_modules/@hashgraph/sdk');
const crypto = require('crypto');

// Initialize AWS services with built-in SDK
const dynamodb = new AWS.DynamoDB.DocumentClient();
const kms = new AWS.KMS();

// Hedera configuration
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
const HEDERA_OPERATOR_ID = process.env.HEDERA_OPERATOR_ID;
const HEDERA_OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY;

// DynamoDB table names
const WALLETS_TABLE = process.env.WALLETS_TABLE || 'safemate-wallets';
const USERS_TABLE = process.env.USERS_TABLE || 'safemate-users';

async function initializeHederaClient() {
  try {
    if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
      throw new Error('Hedera operator credentials not configured');
    }

    const operatorPrivateKey = PrivateKey.fromString(HEDERA_OPERATOR_KEY);
    const operatorAccountId = AccountId.fromString(HEDERA_OPERATOR_ID);

    const client = Client.forName(HEDERA_NETWORK);
    client.setOperator(operatorAccountId, operatorPrivateKey);

    return { client, operatorAccountId, operatorPrivateKey };
  } catch (error) {
    console.error('Error initializing Hedera client:', error);
    throw error;
  }
}

async function startOnboarding(userId, email) {
  try {
    console.log('Starting onboarding for user:', userId);

    // Check if user already has a wallet
    const existingWallet = await dynamodb.get({
      TableName: WALLETS_TABLE,
      Key: { userId: userId }
    }).promise();

    if (existingWallet.Item) {
      console.log('User already has a wallet:', existingWallet.Item.walletId);
      return {
        success: true,
        message: 'Wallet already exists',
        walletId: existingWallet.Item.walletId,
        accountId: existingWallet.Item.accountId,
        transactionId: existingWallet.Item.transactionId
      };
    }

    // Initialize Hedera client
    const { client } = await initializeHederaClient();

    // Generate new keypair
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;

    console.log('Generated new keypair for user:', userId);

    // Create Hedera account
    const transaction = new AccountCreateTransaction()
      .setKey(publicKey)
      .setInitialBalance(new Hbar(0.5))
      .setMaxAutomaticTokenAssociations(10);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;

    console.log('Created Hedera account:', accountId.toString());

    // Generate wallet ID
    const walletId = crypto.randomUUID();

    // Encrypt private key with KMS
    const encryptParams = {
      KeyId: process.env.KMS_KEY_ID,
      Plaintext: privateKey.toString()
    };

    const encryptResult = await kms.encrypt(encryptParams).promise();
    const encryptedPrivateKey = encryptResult.CiphertextBlob.toString('base64');

    // Store wallet data in DynamoDB
    const walletData = {
      userId: userId,
      walletId: walletId,
      accountId: accountId.toString(),
      publicKey: publicKey.toString(),
      encryptedPrivateKey: encryptedPrivateKey,
      transactionId: response.transactionId.toString(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await dynamodb.put({
      TableName: WALLETS_TABLE,
      Item: walletData
    }).promise();

    console.log('Wallet data stored in DynamoDB');

    return {
      success: true,
      message: 'Wallet created successfully',
      walletId: walletId,
      accountId: accountId.toString(),
      transactionId: response.transactionId.toString()
    };

  } catch (error) {
    console.error('Error in startOnboarding:', error);
    return {
      success: false,
      message: error.message,
      error: error.toString()
    };
  }
}

async function getWalletStatus(userId) {
  try {
    console.log('Getting wallet status for user:', userId);

    const result = await dynamodb.get({
      TableName: WALLETS_TABLE,
      Key: { userId: userId }
    }).promise();

    if (!result.Item) {
      return {
        success: false,
        message: 'No wallet found for user',
        hasWallet: false
      };
    }

    return {
      success: true,
      message: 'Wallet found',
      hasWallet: true,
      wallet: {
        walletId: result.Item.walletId,
        accountId: result.Item.accountId,
        status: result.Item.status,
        createdAt: result.Item.createdAt
      }
    };

  } catch (error) {
    console.error('Error getting wallet status:', error);
    return {
      success: false,
      message: error.message,
      error: error.toString()
    };
  }
}

exports.handler = async (event) => {
  console.log('Lambda function invoked with event:', JSON.stringify(event, null, 2));

  try {
    // Extract user info from the event
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const email = event.requestContext?.authorizer?.claims?.email;

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'User ID not found in request'
        })
      };
    }

    const path = event.path;
    let result;

    if (path === '/onboarding/start') {
      result = await startOnboarding(userId, email);
    } else if (path === '/onboarding/status') {
      result = await getWalletStatus(userId);
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Endpoint not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Lambda function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};