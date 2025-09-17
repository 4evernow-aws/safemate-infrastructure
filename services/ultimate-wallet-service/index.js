/**
 * Ultimate Wallet Service for SafeMate Backend
 * 
 * This service consolidates ALL wallet-related functionality from:
 * - wallet-manager: General wallet operations
 * - user-onboarding: Automatic wallet creation and status
 * - post-confirmation-wallet-creator: Cognito post-confirmation triggers
 * - hedera-service: Blockchain operations
 * - consolidated-wallet-service: Previous consolidation attempt
 * 
 * Provides a unified API for all wallet operations with clear separation of concerns.
 * Uses Lambda layer for dependencies to keep size under 50MB.
 */

const { randomUUID } = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, DecryptCommand, EncryptCommand } = require('@aws-sdk/client-kms');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const {
  Client,
  AccountCreateTransaction,
  AccountId,
  PrivateKey,
  Hbar,
  AccountBalanceQuery,
  TransactionReceiptQuery,
  TransferTransaction
} = require('@hashgraph/sdk');

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const kms = new KMSClient({});
const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'ap-southeast-2' });

// Environment variables
const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE;
const WALLET_METADATA_TABLE = process.env.WALLET_METADATA_TABLE;
const APP_SECRETS_KMS_KEY_ID = process.env.APP_SECRETS_KMS_KEY_ID;
const WALLET_KMS_KEY_ID = process.env.WALLET_KMS_KEY_ID;
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
const USER_ONBOARDING_FUNCTION = process.env.USER_ONBOARDING_FUNCTION || 'default-safemate-user-onboarding';
const SAFEMATE_FOLDERS_TABLE = process.env.SAFEMATE_FOLDERS_TABLE || 'safemate-folders-dev';

// CORS headers - FIXED for preprod
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

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
 * Ultimate Wallet Service Class
 */
class UltimateWalletService {
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
      this.operatorClient = await this.initializeHederaClient();
      console.log('✅ UltimateWalletService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize UltimateWalletService:', error);
      throw error;
    }
  }

  /**
   * Initialize Hedera client
   */
  async initializeHederaClient() {
    if (this.operatorClient) return this.operatorClient;

    const config = HEDERA_NETWORK_CONFIG[this.network];
    this.operatorClient = Client.forNetwork(config.nodes);
    
    const operatorAccountId = AccountId.fromString(this.operatorCredentials.accountId);
    const operatorPrivateKey = PrivateKey.fromString(this.operatorCredentials.privateKey);
    
    this.operatorClient.setOperator(operatorAccountId, operatorPrivateKey);
    
    console.log(`Initialized Hedera client for ${this.network}`);
    return this.operatorClient;
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
      console.error('Failed to get operator credentials:', error);
      throw error;
    }
  }

  /**
   * Decrypt private key using KMS
   */
  async decryptPrivateKey(encryptedKey, keyId) {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
        KeyId: keyId
      });
      
      const response = await kms.send(command);
      return Buffer.from(response.Plaintext).toString('utf8');
    } catch (error) {
      console.error('❌ KMS decryption failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt private key using KMS
   */
  async encryptPrivateKey(privateKey, keyId) {
    try {
      const command = new EncryptCommand({
        KeyId: keyId,
        Plaintext: Buffer.from(privateKey, 'utf8')
      });
      
      const response = await kms.send(command);
      return Buffer.from(response.CiphertextBlob).toString('base64');
    } catch (error) {
      console.error('❌ KMS encryption failed:', error);
      throw error;
    }
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(userId, email, initialBalance = 0.1) {
    try {
      await this.initialize();

      // Check if user already has a wallet
      const existingWallet = await this.getUserWallet(userId);
      if (existingWallet) {
        throw new Error('User already has a wallet');
      }

      // Generate new key pair
      const privateKey = PrivateKey.generateED25519();
      const publicKey = privateKey.publicKey;

      // Create Hedera account
      const transaction = new AccountCreateTransaction()
        .setKey(publicKey)
        .setInitialBalance(new Hbar(initialBalance));

      const response = await transaction.execute(this.operatorClient);
      const receipt = await response.getReceipt(this.operatorClient);
      const accountId = receipt.accountId;

      // Generate wallet ID
      const walletId = `wallet-${Date.now()}-${randomUUID()}`;

      // Store wallet metadata
      const walletData = {
        user_id: userId,
        wallet_id: walletId,
        hedera_account_id: accountId.toString(),
        public_key: publicKey.toString(),
        account_type: 'personal',
        network: this.network,
        initial_balance_hbar: initialBalance.toString(),
        created_at: new Date().toISOString(),
        email: email,
        status: 'active'
      };

      await this.storeWalletData(walletData);

      // Store encrypted private key
      const encryptedPrivateKey = await this.encryptPrivateKey(privateKey.toString(), WALLET_KMS_KEY_ID);
      
      const keyData = {
        user_id: userId,
        encrypted_private_key: encryptedPrivateKey,
        wallet_type: 'hedera',
        created_at: new Date().toISOString()
      };

      await dynamodb.send(new PutCommand({
        TableName: WALLET_KEYS_TABLE,
        Item: keyData
      }));

      console.log(`✅ Wallet created successfully for user ${userId}: ${accountId.toString()}`);

      return {
        success: true,
        hedera_account_id: accountId.toString(),
        public_key: publicKey.toString(),
        account_type: 'personal',
        network: this.network,
        initial_balance_hbar: initialBalance.toString(),
        needs_funding: false,
        encryption_info: {
          encrypted: true,
          kms_key_id: WALLET_KMS_KEY_ID
        }
      };
    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      throw error;
    }
  }

  /**
   * Get user's wallet
   */
  async getUserWallet(userId) {
    try {
      const command = new QueryCommand({
        TableName: WALLET_METADATA_TABLE,
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: 1
      });

      const result = await dynamodb.send(command);
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
      console.error('❌ Error getting user wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(accountId) {
    try {
      await this.initialize();

      const query = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId));

      const balance = await query.execute(this.operatorClient);
      
      return {
        accountId: accountId,
        balance: {
          hbar: balance.hbars.toString(),
          tinybars: balance.tinybars.toString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Store wallet data
   */
  async storeWalletData(walletData) {
    try {
      await dynamodb.send(new PutCommand({
        TableName: WALLET_METADATA_TABLE,
        Item: walletData
      }));
    } catch (error) {
      console.error('❌ Error storing wallet data:', error);
      throw error;
    }
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(userId, newBalance) {
    try {
      const command = new UpdateCommand({
        TableName: WALLET_METADATA_TABLE,
        Key: { user_id: userId },
        UpdateExpression: 'SET current_balance_hbar = :balance, updated_at = :timestamp',
        ExpressionAttributeValues: {
          ':balance': newBalance.toString(),
          ':timestamp': new Date().toISOString()
        }
      });

      await dynamodb.send(command);
    } catch (error) {
      console.error('❌ Error updating wallet balance:', error);
      throw error;
    }
  }

  /**
   * Delete user's wallet
   */
  async deleteWallet(userId) {
    try {
      // Delete wallet metadata
      await dynamodb.send(new DeleteCommand({
        TableName: WALLET_METADATA_TABLE,
        Key: { user_id: userId }
      }));

      // Delete wallet keys
      await dynamodb.send(new DeleteCommand({
        TableName: WALLET_KEYS_TABLE,
        Key: { user_id: userId }
      }));

      console.log(`✅ Wallet deleted for user ${userId}`);
    } catch (error) {
      console.error('❌ Error deleting wallet:', error);
      throw error;
    }
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId) {
    try {
      const wallet = await this.getUserWallet(userId);
      
      if (wallet) {
        return {
          success: true,
          hasWallet: true,
          accountId: wallet.hedera_account_id,
          publicKey: wallet.public_key,
          accountType: wallet.account_type,
          network: wallet.network,
          initialBalanceHbar: wallet.initial_balance_hbar,
          needsFunding: false,
          encryptionInfo: {
            encrypted: true,
            kms_key_id: WALLET_KMS_KEY_ID
          }
        };
      } else {
        return {
          success: true,
          hasWallet: false,
          wallet: null
        };
      }
    } catch (error) {
      console.error('❌ Error getting onboarding status:', error);
      return {
        success: false,
        hasWallet: false,
        wallet: null,
        error: error.message
      };
    }
  }

  /**
   * Handle post-confirmation wallet creation
   */
  async handlePostConfirmation(event) {
    try {
      const { userName, userAttributes } = event.request;
      const userId = event.request.userAttributes.sub;
      const email = event.request.userAttributes.email;

      console.log(`👤 Creating wallet for user: ${userId} (${email})`);

      // Create wallet directly (no need to invoke another Lambda)
      const result = await this.createWallet(userId, email);
      
      console.log('✅ Wallet creation completed:', result);
      
      // Return success to Cognito
      return event;
    } catch (error) {
      console.error('❌ Error in post-confirmation wallet creation:', error);
      
      // Don't fail the user confirmation, just log the error
      console.log('⚠️ Wallet creation failed, but user confirmation will proceed');
      return event;
    }
  }

  /**
   * Validate account ID format
   */
  validateAccountId(accountId) {
    try {
      AccountId.fromString(accountId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'UltimateWalletService',
      version: '1.0.0',
      network: this.network,
      status: 'active',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * List user's folders
   */
  async listUserFolders(userId) {
    try {
      console.log(`📁 Listing folders for user: ${userId}`);
      
      const params = {
        TableName: SAFEMATE_FOLDERS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };
      
      const result = await dynamodb.send(new ScanCommand(params));
      
      const folders = result.Items.map(item => ({
        tokenId: item.tokenId,
        folderName: item.folderName,
        parentFolderId: item.parentFolderId,
        createdAt: item.createdAt,
        transactionId: item.transactionId,
        network: item.network
      }));
      
      console.log(`✅ Found ${folders.length} folders for user ${userId}`);
      
      return {
        success: true,
        folders: folders
      };
    } catch (error) {
      console.error(`❌ Failed to list folders for user ${userId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(folderName, userId, parentFolderId = null, metadata = {}) {
    try {
      console.log(`📁 Creating folder: ${folderName} for user: ${userId}`);
      
      // For now, return a simple success response
      // TODO: Implement actual folder creation with Hedera tokens
      const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const folderData = {
        tokenId: folderId,
        folderName: folderName,
        parentFolderId: parentFolderId,
        userId: userId,
        createdAt: new Date().toISOString(),
        transactionId: `tx_${Date.now()}`,
        network: this.network,
        metadata: metadata
      };
      
      // Store in DynamoDB
      await dynamodb.send(new PutCommand({
        TableName: SAFEMATE_FOLDERS_TABLE,
        Item: folderData
      }));
      
      console.log(`✅ Folder created successfully: ${folderId}`);
      
      return {
        success: true,
        folderId: folderId,
        name: folderName,
        parentFolderId: parentFolderId,
        tokenId: folderId,
        createdAt: folderData.createdAt,
        transactionId: folderData.transactionId,
        network: this.network
      };
    } catch (error) {
      console.error(`❌ Failed to create folder: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create service instance
const walletService = new UltimateWalletService();

exports.handler = async (event) => {
  console.log('🔧 UltimateWalletService invoked with event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight - ALWAYS return CORS headers for OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    console.log('🔧 Handling CORS preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    console.log('🔧 Starting Lambda function execution...');
    
    // Initialize the wallet service
    console.log('🔧 Initializing wallet service...');
    await walletService.initialize();
    console.log('✅ Wallet service initialized successfully');

    // Handle Cognito post-confirmation trigger
    if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
      return await walletService.handlePostConfirmation(event);
    }

    // Extract user information from Cognito claims
    const userClaims = event.requestContext?.authorizer?.claims || {};
    const userId = userClaims.sub || userClaims['cognito:username'] || 'default-user';
    const email = userClaims.email || userClaims['cognito:email'] || 'default@example.com';
    
    console.log('🔧 User claims:', userClaims);
    console.log('🔧 Extracted userId:', userId);
    console.log('🔧 Extracted email:', email);
    
    const path = event.path;
    const httpMethod = event.httpMethod;
    
    console.log('🔧 Processing request:', httpMethod, path);
    
    // Route requests based on path and method
    if (path === '/onboarding/status' && httpMethod === 'GET') {
      const result = await walletService.getOnboardingStatus(userId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    } 
    else if (path === '/onboarding/start' && httpMethod === 'POST') {
      const result = await walletService.createWallet(userId, email);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    else if (path === '/onboarding/retry' && httpMethod === 'POST') {
      const result = await walletService.createWallet(userId, email);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    else if (path === '/wallet/create' && httpMethod === 'POST') {
      const result = await walletService.createWallet(userId, email);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    else if (path === '/wallet/get' && httpMethod === 'GET') {
      const wallet = await walletService.getUserWallet(userId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          wallet: wallet
        })
      };
    }
    else if (path === '/wallet/balance' && httpMethod === 'GET') {
      const wallet = await walletService.getUserWallet(userId);
      if (!wallet) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Wallet not found'
          })
        };
      }
      
      const balance = await walletService.getWalletBalance(wallet.hedera_account_id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          balance: balance
        })
      };
    }
    else if (path === '/wallet/delete' && httpMethod === 'DELETE') {
      await walletService.deleteWallet(userId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Wallet deleted successfully'
        })
      };
    }
    else if (path === '/status' && httpMethod === 'GET') {
      const status = walletService.getStatus();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(status)
      };
    }
    else if (path === '/folders' && httpMethod === 'GET') {
      const result = await walletService.listUserFolders(userId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    else if (path === '/folders' && httpMethod === 'POST') {
      const { name, parentFolderId, metadata } = JSON.parse(body);
      if (!name) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Folder name is required'
          })
        };
      }
      const result = await walletService.createFolder(name, userId, parentFolderId, metadata);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    }
    else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Endpoint not found'
        })
      };
    }
    
  } catch (error) {
    console.error('❌ Lambda function error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: error.stack,
        errorType: error.name,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      })
    };
  }
};
