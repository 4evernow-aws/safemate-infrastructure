/**
 * Consolidated Wallet Service for SafeMate Backend
 * 
 * This service consolidates wallet-related functionality from:
 * - wallet-manager: General wallet operations
 * - user-onboarding: Automatic wallet creation
 * - hedera-service: Blockchain operations
 * 
 * Provides a unified API for all wallet operations with clear separation of concerns.
 */

const { randomUUID } = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, DecryptCommand, EncryptCommand } = require('@aws-sdk/client-kms');
const { initializeHederaClient } = require('../../utils/hedera-client');
const {
  Client,
  AccountCreateTransaction,
  AccountId,
  PrivateKey,
  Hbar,
  AccountBalanceQuery,
  TransactionReceiptQuery
} = require('@hashgraph/sdk');

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const kms = new KMSClient({});

// Environment variables
const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE;
const WALLET_METADATA_TABLE = process.env.WALLET_METADATA_TABLE;
const APP_SECRETS_KMS_KEY_ID = process.env.APP_SECRETS_KMS_KEY_ID;
const WALLET_KMS_KEY_ID = process.env.WALLET_KMS_KEY_ID;
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';

// Hedera network configuration
const HEDERA_NETWORK_CONFIG = {
  testnet: {
    nodes: { 
      '0.testnet.hedera.com:50211': new AccountId(3),
      '1.testnet.hedera.com:50211': new AccountId(4),
      '2.testnet.hedera.com:50211': new AccountId(5),
      '3.testnet.hedera.com:50211': new AccountId(6)
    }
  },
  mainnet: {
    nodes: { 
      '35.237.200.180:50211': new AccountId(3),
      '35.186.191.247:50211': new AccountId(4),
      '35.192.2.25:50211': new AccountId(5),
      '35.199.15.177:50211': new AccountId(6)
    }
  }
};

/**
 * Consolidated Wallet Service Class
 */
class ConsolidatedWalletService {
  constructor() {
    this.network = HEDERA_NETWORK;
    this.operatorClient = null;
    this.operatorCredentials = null;
  }

  /**
   * Initialize the service with operator credentials
   */
  async initialize() {
    try {
      this.operatorCredentials = await this.getOperatorCredentials();
      this.operatorClient = await initializeHederaClient(
        this.operatorCredentials.accountId,
        this.operatorCredentials.privateKey,
        this.network
      );
      console.log('✅ ConsolidatedWalletService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ConsolidatedWalletService:', error);
      throw error;
    }
  }

  /**
   * Get operator credentials from DynamoDB
   */
  async getOperatorCredentials() {
    try {
      const params = {
        TableName: WALLET_KEYS_TABLE,
        Key: { user_id: 'hedera_operator' }
      };

      const result = await dynamodb.send(new GetCommand(params));

      if (!result.Item) {
        throw new Error('No operator credentials found');
      }

      const decryptedKey = await this.decryptPrivateKey(
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
   * Decrypt private key using KMS
   */
  async decryptPrivateKey(encryptedKey, keyId) {
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
   * Encrypt private key using KMS
   */
  async encryptPrivateKey(privateKey, keyId) {
    try {
      const encryptParams = {
        Plaintext: Buffer.from(privateKey, 'utf8'),
        KeyId: keyId
      };

      const encryptResult = await kms.send(new EncryptCommand(encryptParams));
      return encryptResult.CiphertextBlob.toString('base64');
    } catch (error) {
      console.error('❌ Failed to encrypt private key:', error);
      throw new Error('Failed to encrypt key');
    }
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(userId, initialBalance = 0.1) {
    try {
      console.log(`🚀 Creating wallet for user: ${userId}`);

      // Check if user already has a wallet
      const existingWallet = await this.getUserWallet(userId);
      if (existingWallet) {
        return {
          success: false,
          error: 'User already has a wallet',
          wallet: existingWallet
        };
      }

      // Generate Ed25519 keypair
      const { privateKey, publicKey } = PrivateKey.generateED25519();
      
      // Create Hedera account using operator
      const transaction = new AccountCreateTransaction()
        .setKey(publicKey)
        .setInitialBalance(new Hbar(initialBalance));

      console.log('📝 Creating Hedera account...');
      const response = await transaction.execute(this.operatorClient);
      const receipt = await response.getReceipt(this.operatorClient);
      const accountId = receipt.accountId;

      if (!accountId) {
        throw new Error('Failed to create Hedera account');
      }

      console.log(`✅ Hedera account created: ${accountId.toString()}`);

      // Encrypt private key
      const encryptedKey = await this.encryptPrivateKey(
        privateKey.toString(),
        WALLET_KMS_KEY_ID
      );

      // Store wallet data
      const walletId = `wallet-${Date.now()}-${randomUUID()}`;
      const walletData = {
        user_id: userId,
        wallet_id: walletId,
        account_id: accountId.toString(),
        public_key: publicKey.toString(),
        encrypted_private_key: encryptedKey,
        balance: initialBalance.toString(),
        currency: 'HBAR',
        network: this.network,
        created_at: new Date().toISOString(),
        created_by_operator: true,
        initial_funding: `${initialBalance} HBAR`
      };

      // Store in DynamoDB
      await this.storeWalletData(walletData);

      console.log(`✅ Wallet created successfully for user: ${userId}`);

      return {
        success: true,
        wallet: {
          walletId,
          accountId: accountId.toString(),
          publicKey: publicKey.toString(),
          balance: initialBalance.toString(),
          currency: 'HBAR',
          network: this.network,
          createdAt: walletData.created_at
        }
      };
    } catch (error) {
      console.error('❌ Failed to create wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's wallet information
   */
  async getUserWallet(userId) {
    try {
      const params = {
        TableName: WALLET_METADATA_TABLE,
        Key: { user_id: userId }
      };

      const result = await dynamodb.send(new GetCommand(params));
      
      if (!result.Item) {
        return null;
      }

      return {
        walletId: result.Item.wallet_id,
        accountId: result.Item.account_id,
        publicKey: result.Item.public_key,
        balance: result.Item.balance,
        currency: result.Item.currency,
        network: result.Item.network,
        createdAt: result.Item.created_at
      };
    } catch (error) {
      console.error('❌ Failed to get user wallet:', error);
      return null;
    }
  }

  /**
   * Get wallet balance from Hedera network
   */
  async getWalletBalance(accountId) {
    try {
      const query = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId));

      const balance = await query.execute(this.operatorClient);
      
      return {
        accountId,
        balance: balance.hbars.toString(),
        currency: 'HBAR',
        network: this.network,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get wallet balance:', error);
      return null;
    }
  }

  /**
   * Update wallet balance in DynamoDB
   */
  async updateWalletBalance(userId, newBalance) {
    try {
      const params = {
        TableName: WALLET_METADATA_TABLE,
        Key: { user_id: userId },
        UpdateExpression: 'SET balance = :balance, updated_at = :updated_at',
        ExpressionAttributeValues: {
          ':balance': newBalance.toString(),
          ':updated_at': new Date().toISOString()
        }
      };

      await dynamodb.send(new PutCommand(params));
      console.log(`✅ Updated balance for user ${userId}: ${newBalance} HBAR`);
    } catch (error) {
      console.error('❌ Failed to update wallet balance:', error);
      throw error;
    }
  }

  /**
   * Store wallet data in DynamoDB
   */
  async storeWalletData(walletData) {
    try {
      // Store in wallet keys table
      const keysParams = {
        TableName: WALLET_KEYS_TABLE,
        Item: {
          user_id: walletData.user_id,
          wallet_id: walletData.wallet_id,
          account_id: walletData.account_id,
          public_key: walletData.public_key,
          encrypted_private_key: walletData.encrypted_private_key,
          created_at: walletData.created_at
        }
      };

      // Store in wallet metadata table
      const metadataParams = {
        TableName: WALLET_METADATA_TABLE,
        Item: {
          user_id: walletData.user_id,
          wallet_id: walletData.wallet_id,
          account_id: walletData.account_id,
          public_key: walletData.public_key,
          balance: walletData.balance,
          currency: walletData.currency,
          network: walletData.network,
          created_at: walletData.created_at,
          created_by_operator: walletData.created_by_operator,
          initial_funding: walletData.initial_funding
        }
      };

      await Promise.all([
        dynamodb.send(new PutCommand(keysParams)),
        dynamodb.send(new PutCommand(metadataParams))
      ]);

      console.log(`✅ Wallet data stored for user: ${walletData.user_id}`);
    } catch (error) {
      console.error('❌ Failed to store wallet data:', error);
      throw error;
    }
  }

  /**
   * Delete user's wallet
   */
  async deleteWallet(userId) {
    try {
      console.log(`🗑️ Deleting wallet for user: ${userId}`);

      // Get wallet information
      const wallet = await this.getUserWallet(userId);
      if (!wallet) {
        return {
          success: false,
          error: 'Wallet not found'
        };
      }

      // Delete from both tables
      const keysParams = {
        TableName: WALLET_KEYS_TABLE,
        Key: { user_id: userId }
      };

      const metadataParams = {
        TableName: WALLET_METADATA_TABLE,
        Key: { user_id: userId }
      };

      await Promise.all([
        dynamodb.send(new DeleteCommand(keysParams)),
        dynamodb.send(new DeleteCommand(metadataParams))
      ]);

      console.log(`✅ Wallet deleted for user: ${userId}`);

      return {
        success: true,
        message: 'Wallet deleted successfully'
      };
    } catch (error) {
      console.error('❌ Failed to delete wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all wallets (admin function)
   */
  async getAllWallets() {
    try {
      const params = {
        TableName: WALLET_METADATA_TABLE
      };

      const result = await dynamodb.send(new ScanCommand(params));
      
      return result.Items?.map(item => ({
        userId: item.user_id,
        walletId: item.wallet_id,
        accountId: item.account_id,
        balance: item.balance,
        currency: item.currency,
        network: item.network,
        createdAt: item.created_at
      })) || [];
    } catch (error) {
      console.error('❌ Failed to get all wallets:', error);
      return [];
    }
  }

  /**
   * Validate Hedera account ID format
   */
  validateAccountId(accountId) {
    const accountIdRegex = /^0\.0\.\d+$/;
    return accountIdRegex.test(accountId);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'ConsolidatedWalletService',
      network: this.network,
      operatorInitialized: !!this.operatorClient,
      tables: {
        walletKeys: WALLET_KEYS_TABLE,
        walletMetadata: WALLET_METADATA_TABLE
      },
      kmsKeys: {
        appSecrets: APP_SECRETS_KMS_KEY_ID,
        wallet: WALLET_KMS_KEY_ID
      }
    };
  }
}

// Create singleton instance
const consolidatedWalletService = new ConsolidatedWalletService();

/**
 * Lambda handler function
 */
exports.handler = async (event, context) => {
  console.log('🚀 ConsolidatedWalletService Lambda invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Initialize service
    await consolidatedWalletService.initialize();

    const { httpMethod, path, body, queryStringParameters, pathParameters } = event;
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized - No user ID found'
        })
      };
    }

    // Route requests based on path and method
    const pathSegments = path.split('/').filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];

    switch (httpMethod) {
      case 'GET':
        if (action === 'wallet') {
          const wallet = await consolidatedWalletService.getUserWallet(userId);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              wallet
            })
          };
        } else if (action === 'balance') {
          const wallet = await consolidatedWalletService.getUserWallet(userId);
          if (!wallet) {
            return {
              statusCode: 404,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                success: false,
                error: 'Wallet not found'
              })
            };
          }
          
          const balance = await consolidatedWalletService.getWalletBalance(wallet.accountId);
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              balance
            })
          };
        } else if (action === 'status') {
          const status = consolidatedWalletService.getStatus();
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              status
            })
          };
        }
        break;

      case 'POST':
        if (action === 'create') {
          const requestBody = body ? JSON.parse(body) : {};
          const initialBalance = requestBody.initialBalance || 0.1;
          
          const result = await consolidatedWalletService.createWallet(userId, initialBalance);
          
          return {
            statusCode: result.success ? 201 : 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
          };
        }
        break;

      case 'DELETE':
        if (action === 'wallet') {
          const result = await consolidatedWalletService.deleteWallet(userId);
          
          return {
            statusCode: result.success ? 200 : 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result)
          };
        }
        break;

      case 'OPTIONS':
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
          },
          body: ''
        };
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Endpoint not found'
      })
    };

  } catch (error) {
    console.error('❌ Lambda handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
