const { randomUUID } = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { KMSClient, DecryptCommand, EncryptCommand } = require('@aws-sdk/client-kms');
const { initializeHederaClient } = require('./hedera-client');
const {
  Client,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TokenDissociateTransaction,
  TokenDeleteTransaction,
  TokenUpdateTransaction,
  TokenUpdateNftsTransaction,
  TokenId,
  AccountId,
  PrivateKey,
  Hbar,
  TransactionReceiptQuery,
  TokenInfoQuery,
  TokenNftInfoQuery,
  AccountBalanceQuery,
  AccountCreateTransaction
} = require('@hashgraph/sdk');

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);
const kms = new KMSClient({});

// Environment variables
const WALLET_KEYS_TABLE = process.env.WALLET_KEYS_TABLE || 'default-safemate-wallet-keys';
const WALLET_METADATA_TABLE = process.env.WALLET_METADATA_TABLE || 'default-safemate-wallet-metadata';
const APP_SECRETS_KMS_KEY_ID = process.env.OPERATOR_PRIVATE_KEY_KMS_KEY_ID || process.env.APP_SECRETS_KMS_KEY_ID;
const WALLET_KMS_KEY_ID = process.env.WALLET_KMS_KEY_ID;
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
const SAFEMATE_FOLDERS_TABLE = process.env.SAFEMATE_FOLDERS_TABLE || 'default-safemate-folders';
const SAFEMATE_FILES_TABLE = process.env.SAFEMATE_FILES_TABLE || 'default-safemate-files';

// Hedera network configuration - Updated for current testnet nodes
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
    const params = {
      TableName: WALLET_KEYS_TABLE,
      Key: { user_id: 'hedera_operator' }
    };

    const result = await dynamodb.send(new GetCommand(params));

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

// Using shared initializeHederaClient from utils/hedera-client.js

/**
 * Create a folder token with enhanced metadata storage on blockchain
 */
async function createFolder(folderName, userId, parentFolderId = null) {
  try {
    console.log(`🔧 Creating folder token on Hedera ${HEDERA_NETWORK}: ${folderName} for user: ${userId}`);
    
    const client = await initializeHederaClient();
    
    // Create comprehensive folder metadata
    const folderMetadata = {
      type: 'folder',
      name: folderName,
      userId: userId,
      parentFolderId: parentFolderId,
      createdAt: new Date().toISOString(),
      path: parentFolderId ? `/folders/${parentFolderId}/${folderName}` : `/folders/${folderName}`,
      permissions: ['read', 'write'],
      owner: userId,
      network: HEDERA_NETWORK,
      version: '1.0',
      metadataVersion: '1.0',
      // Additional blockchain-specific metadata
      blockchain: {
        network: HEDERA_NETWORK,
        tokenType: 'NON_FUNGIBLE_UNIQUE',
        supplyType: 'FINITE',
        maxSupply: 1,
        decimals: 0
      }
    };
    
    console.log(`🔧 Creating token transaction for folder: ${folderName}`);
    console.log(`🔧 Operator account: ${client.operatorAccountId.toString()}`);
    console.log(`🔧 Network: ${HEDERA_NETWORK}`);
    
    // Create token transaction with enhanced metadata storage
    const transaction = new TokenCreateTransaction()
      .setTokenName(folderName)
      .setTokenSymbol('FOLDER')
      .setTokenType(1) // NON_FUNGIBLE_UNIQUE
      .setDecimals(0)
      .setInitialSupply(1)
      .setSupplyType(1) // FINITE
      .setMaxSupply(1)
      .setTreasuryAccountId(client.operatorAccountId)
      .setAdminKey(client.operatorPublicKey)
      .setSupplyKey(client.operatorPublicKey)
      .setMetadataKey(client.operatorPublicKey) // Enable metadata updates
      .setFreezeDefault(false)
      // Store comprehensive metadata in memo (immutable on blockchain)
      .setMemo(JSON.stringify(folderMetadata))
      .setMaxTransactionFee(new Hbar(2));
    
    console.log(`🔧 Transaction created, freezing with client...`);
    transaction.freezeWith(client);
    
    console.log(`🔧 Signing transaction with operator private key...`);
    const signedTransaction = await transaction.sign(client.operatorPrivateKey);
    
    console.log(`🔧 Executing transaction on ${HEDERA_NETWORK}...`);
    const response = await signedTransaction.execute(client);
    console.log(`🔧 Transaction executed, response:`, response.transactionId.toString());
    
    console.log(`🔧 Getting transaction receipt...`);
    const receipt = await new TransactionReceiptQuery()
      .setTransactionId(response.transactionId)
      .execute(client);
    console.log(`🔧 Receipt received, token ID:`, receipt.tokenId ? receipt.tokenId.toString() : 'No token ID in receipt');
    
    const tokenId = receipt.tokenId;
    const transactionId = response.transactionId.toString();
    
    console.log(`✅ Folder token created on Hedera ${HEDERA_NETWORK}: ${tokenId} (tx: ${transactionId})`);
    console.log(`✅ Metadata stored on blockchain in token memo: ${tokenId}`);
    
    // Store minimal folder reference in DynamoDB (BLOCKCHAIN-ONLY METADATA)
    const folderRecord = {
      tokenId: tokenId.toString(),
      userId: userId,
      folderName: folderName,
      parentFolderId: parentFolderId,
      tokenType: 'folder',
      network: HEDERA_NETWORK,
      transactionId: transactionId,
      createdAt: new Date().toISOString(),
      // NO metadata stored in DynamoDB - metadata only on blockchain
      storageType: 'blockchain_only',
      blockchainVerified: true,
      metadataLocation: 'blockchain_only',
      contentLocation: 'blockchain_only',
      lastVerified: new Date().toISOString()
    };
    
    await dynamodb.send(new PutCommand({
      TableName: SAFEMATE_FOLDERS_TABLE,
      Item: folderRecord
    }));
    
    console.log(`✅ Folder reference stored in DynamoDB (metadata on blockchain only): ${tokenId}`);
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      transactionId: transactionId,
      folderName: folderName,
      network: HEDERA_NETWORK,
      metadata: folderMetadata,
      timestamp: new Date().toISOString(),
      // Blockchain-only storage info
      storageType: 'blockchain_only',
      blockchainVerified: true,
      metadataLocation: 'blockchain_only',
      contentLocation: 'blockchain_only',
      // Note: Metadata stored on blockchain only, not in DynamoDB
      note: 'Folder metadata stored on Hedera blockchain for maximum security'
    };
    
  } catch (error) {
    console.error(`❌ Failed to create folder token: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List user's folders
 */
async function listUserFolders(userId) {
  try {
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
 * Delete a folder token
 */
async function deleteFolder(folderTokenId, userId) {
  try {
    console.log(`🗑️ Deleting folder token: ${folderTokenId} for user: ${userId}`);
    
    const client = await initializeHederaClient();
    
    // Delete token transaction
    const transaction = new TokenDeleteTransaction()
      .setTokenId(TokenId.fromString(folderTokenId))
      .setMaxTransactionFee(new Hbar(2))
      .freezeWith(client);
    
    // Sign and execute transaction
    const signedTransaction = await transaction.sign(client.operatorPrivateKey);
    const response = await signedTransaction.execute(client);
    
    // Get receipt
    const receipt = await new TransactionReceiptQuery()
      .setTransactionId(response.transactionId)
      .execute(client);
    
    const transactionId = response.transactionId.toString();
    
    console.log(`✅ Folder token deleted on Hedera ${HEDERA_NETWORK}: ${folderTokenId} (tx: ${transactionId})`);
    
    // Delete from DynamoDB
    await dynamodb.send(new DeleteCommand({
      TableName: SAFEMATE_FOLDERS_TABLE,
      Key: { tokenId: folderTokenId }
    }));
    
    console.log(`✅ Folder metadata deleted from DynamoDB: ${folderTokenId}`);
    
    return {
      success: true,
      transactionId: transactionId,
      network: HEDERA_NETWORK
    };
    
  } catch (error) {
    console.error(`❌ Failed to delete folder token: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a file token with enhanced metadata storage on blockchain
 */
async function createFile(fileName, fileContent, userId, folderTokenId) {
  try {
    console.log(`🔧 Creating file token on Hedera ${HEDERA_NETWORK}: ${fileName} for user: ${userId}`);
    
    const client = await initializeHederaClient();
    
    // Calculate content hash for blockchain verification
    const crypto = require('crypto');
    const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
    
    // Create comprehensive file metadata (BLOCKCHAIN-ONLY STORAGE)
    const fileMetadata = {
      type: 'file',
      name: fileName,
      userId: userId,
      folderTokenId: folderTokenId,
      createdAt: new Date().toISOString(),
      contentHash: contentHash, // SHA256 hash for content verification
      contentSize: fileContent.length,
      contentEncoding: 'base64',
      permissions: ['read', 'write'],
      owner: userId,
      network: HEDERA_NETWORK,
      version: '1.0',
      metadataVersion: '1.0',
      storageType: 'blockchain_only',
      // Additional blockchain-specific metadata
      blockchain: {
        network: HEDERA_NETWORK,
        tokenType: 'NON_FUNGIBLE_UNIQUE',
        supplyType: 'FINITE',
        maxSupply: 1,
        decimals: 0,
        contentVerification: {
          algorithm: 'SHA256',
          hash: contentHash,
          size: fileContent.length
        }
      }
    };

    // Create blockchain storage object with content
    const blockchainStorage = {
      metadata: fileMetadata,
      content: fileContent, // Store actual file content in blockchain
      contentHash: contentHash,
      timestamp: new Date().toISOString()
    };
    
    // Create token transaction with enhanced metadata storage
    const transaction = new TokenCreateTransaction()
      .setTokenName(fileName)
      .setTokenSymbol('FILE')
      .setTokenType(1) // NON_FUNGIBLE_UNIQUE
      .setDecimals(0)
      .setInitialSupply(1)
      .setSupplyType(1) // FINITE
      .setMaxSupply(1)
      .setTreasuryAccountId(client.operatorAccountId)
      .setAdminKey(client.operatorPublicKey)
      .setSupplyKey(client.operatorPublicKey)
      .setMetadataKey(client.operatorPublicKey) // Enable metadata updates
      .setFreezeDefault(false)
      // Store comprehensive metadata AND content in memo (immutable on blockchain)
      .setMemo(JSON.stringify(blockchainStorage))
      .setMaxTransactionFee(new Hbar(2))
      .freezeWith(client);
    
    // Sign and execute transaction
    const signedTransaction = await transaction.sign(client.operatorPrivateKey);
    const response = await signedTransaction.execute(client);
    
    // Get receipt
    const receipt = await new TransactionReceiptQuery()
      .setTransactionId(response.transactionId)
      .execute(client);
    
    const tokenId = receipt.tokenId;
    const transactionId = response.transactionId.toString();
    
    console.log(`✅ File token created on Hedera ${HEDERA_NETWORK}: ${tokenId} (tx: ${transactionId})`);
    console.log(`✅ Metadata stored on blockchain in token memo: ${tokenId}`);
    console.log(`✅ Content hash for verification: ${contentHash}`);
    
    // Store minimal file reference in DynamoDB (BLOCKCHAIN-ONLY METADATA)
    const fileRecord = {
      tokenId: tokenId.toString(),
      userId: userId,
      folderTokenId: folderTokenId,
      fileName: fileName,
      // NO fileContent stored in DynamoDB - content only on blockchain
      contentHash: contentHash, // SHA256 hash for verification
      contentSize: fileContent.length,
      tokenType: 'file',
      network: HEDERA_NETWORK,
      transactionId: transactionId,
      createdAt: new Date().toISOString(),
      // NO metadata stored in DynamoDB - metadata only on blockchain
      version: '1.0',
      // Blockchain-only storage indicators
      storageType: 'blockchain_only',
      blockchainVerified: true,
      metadataLocation: 'blockchain_only',
      contentLocation: 'blockchain_only', // Content and metadata stored in blockchain memo
      lastVerified: new Date().toISOString()
    };
    
    await dynamodb.send(new PutCommand({
      TableName: SAFEMATE_FILES_TABLE,
      Item: fileRecord
    }));
    
    console.log(`✅ File reference stored in DynamoDB (metadata on blockchain only): ${tokenId}`);
    
    return {
      success: true,
      tokenId: tokenId.toString(),
      transactionId: transactionId,
      fileName: fileName,
      network: HEDERA_NETWORK,
      metadata: fileMetadata,
      contentHash: contentHash,
      contentSize: fileContent.length,
      timestamp: new Date().toISOString(),
      // Blockchain-only storage info
      storageType: 'blockchain_only',
      blockchainVerified: true,
      metadataLocation: 'blockchain_only',
      contentLocation: 'blockchain_only',
      // Note: Content and metadata stored on blockchain only, not in DynamoDB
      note: 'File content and metadata stored on Hedera blockchain for maximum security'
    };
    
  } catch (error) {
    console.error(`❌ Failed to create file token: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List files in a folder
 */
async function listFilesInFolder(userId, folderTokenId) {
  try {
    const params = {
      TableName: SAFEMATE_FILES_TABLE,
      FilterExpression: 'userId = :userId AND folderTokenId = :folderTokenId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':folderTokenId': folderTokenId
      }
    };
    
    const result = await dynamodb.send(new ScanCommand(params));
    
    const files = result.Items.map(item => ({
      tokenId: item.tokenId,
      fileName: item.fileName,
      folderTokenId: item.folderTokenId,
      createdAt: item.createdAt,
      transactionId: item.transactionId,
      network: item.network,
      version: item.version,
      contentSize: item.contentSize || 0,
      storageType: item.storageType || 'blockchain_only',
      metadataLocation: item.metadataLocation || 'blockchain_only',
      contentLocation: item.contentLocation || 'blockchain_only'
    }));
    
    return {
      success: true,
      files: files
    };
  } catch (error) {
    console.error(`❌ Failed to list files for user ${userId} in folder ${folderTokenId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get file content
 */
async function getFileContent(fileTokenId) {
  try {
    console.log(`📄 Getting file content from blockchain for token: ${fileTokenId}`);
    
    // First, get basic file info from DynamoDB
    const params = {
      TableName: SAFEMATE_FILES_TABLE,
      Key: { tokenId: fileTokenId }
    };
    
    const result = await dynamodb.send(new GetCommand(params));
    
    if (!result.Item) {
      throw new Error(`File not found: ${fileTokenId}`);
    }
    
    // Check if this is a blockchain-only storage file
    if (result.Item.storageType === 'blockchain_only') {
      console.log(`🔍 Retrieving content from blockchain for: ${fileTokenId}`);
      
      const client = await initializeHederaClient();
      
      // Query token info to get memo (content + metadata)
      const tokenInfo = await new TokenInfoQuery()
        .setTokenId(TokenId.fromString(fileTokenId))
        .execute(client);
      
      if (!tokenInfo.memo) {
        throw new Error(`No content found in blockchain for token: ${fileTokenId}`);
      }
      
      // Parse blockchain storage object
      const blockchainStorage = JSON.parse(tokenInfo.memo);
      
      if (!blockchainStorage.content) {
        throw new Error(`No content found in blockchain storage for token: ${fileTokenId}`);
      }
      
      console.log(`✅ Content retrieved from blockchain: ${fileTokenId}`);
      
      return {
        success: true,
        fileName: result.Item.fileName,
        fileContent: blockchainStorage.content, // Content from blockchain
        tokenId: result.Item.tokenId,
        createdAt: result.Item.createdAt,
        version: result.Item.version,
        metadata: blockchainStorage.metadata, // Metadata from blockchain
        storageType: 'blockchain_only',
        contentHash: blockchainStorage.contentHash,
        contentSize: result.Item.contentSize,
        blockchainVerified: true,
        note: 'Content retrieved from Hedera blockchain'
      };
    } else {
      // Fallback for legacy files that might have content in DynamoDB
      console.log(`⚠️ Using legacy DynamoDB storage for: ${fileTokenId}`);
      
      return {
        success: true,
        fileName: result.Item.fileName,
        fileContent: result.Item.fileContent,
        tokenId: result.Item.tokenId,
        createdAt: result.Item.createdAt,
        version: result.Item.version,
        metadata: result.Item.metadata,
        storageType: 'legacy_dynamodb',
        note: 'Content retrieved from DynamoDB (legacy storage)'
      };
    }
    
  } catch (error) {
    console.error(`❌ Failed to get file content: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get metadata directly from blockchain token memo
 */
async function getTokenMetadataFromBlockchain(tokenId) {
  try {
    console.log(`🔍 Retrieving metadata from blockchain for token: ${tokenId}`);
    
    const client = await initializeHederaClient();
    
    // Query token info to get memo (metadata)
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(TokenId.fromString(tokenId))
      .execute(client);
    
    if (!tokenInfo.memo) {
      console.log(`⚠️ No metadata found in token memo for: ${tokenId}`);
      return null;
    }
    
    // Parse blockchain storage object from memo
    const blockchainStorage = JSON.parse(tokenInfo.memo);
    
    // Check if this is the new blockchain-only storage format
    if (blockchainStorage.metadata && blockchainStorage.content) {
      console.log(`✅ Blockchain storage retrieved from blockchain: ${tokenId}`);
      console.log(`📋 Storage type: blockchain_only, content size: ${blockchainStorage.content.length} bytes`);
      
      return {
        success: true,
        metadata: blockchainStorage.metadata,
        content: blockchainStorage.content, // Include content for verification
        contentHash: blockchainStorage.contentHash,
        storageType: 'blockchain_only',
        timestamp: blockchainStorage.timestamp,
        tokenInfo: {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        totalSupply: tokenInfo.totalSupply.toString(),
        treasury: tokenInfo.treasuryAccountId.toString(),
        adminKey: tokenInfo.adminKey ? 'Present' : 'Not set',
        supplyKey: tokenInfo.supplyKey ? 'Present' : 'Not set',
        freezeKey: tokenInfo.freezeKey ? 'Present' : 'Not set',
        wipeKey: tokenInfo.wipeKey ? 'Present' : 'Not set',
        kycKey: tokenInfo.kycKey ? 'Present' : 'Not set',
        pauseKey: tokenInfo.pauseKey ? 'Present' : 'Not set',
        memo: tokenInfo.memo,
        tokenType: tokenInfo.tokenType,
        supplyType: tokenInfo.supplyType,
        maxSupply: tokenInfo.maxSupply.toString(),
        decimals: tokenInfo.decimals,
        defaultFreezeStatus: tokenInfo.defaultFreezeStatus,
        defaultKycStatus: tokenInfo.defaultKycStatus,
        isDeleted: tokenInfo.isDeleted,
        autoRenewAccount: tokenInfo.autoRenewAccount ? tokenInfo.autoRenewAccount.toString() : null,
        autoRenewPeriod: tokenInfo.autoRenewPeriod ? tokenInfo.autoRenewPeriod.toString() : null,
        expiry: tokenInfo.expiry ? new Date(tokenInfo.expiry * 1000).toISOString() : null,
        feeScheduleKey: tokenInfo.feeScheduleKey ? 'Present' : 'Not set'
      }
    };
    } else {
      // Handle legacy format (metadata only)
      console.log(`✅ Legacy metadata retrieved from blockchain: ${tokenId}`);
      console.log(`📋 Legacy format detected`);
      
      return {
        success: true,
        metadata: blockchainStorage, // Legacy format stored metadata directly
        storageType: 'legacy_metadata_only',
        tokenInfo: {
          tokenId: tokenInfo.tokenId.toString(),
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          totalSupply: tokenInfo.totalSupply.toString(),
          treasury: tokenInfo.treasuryAccountId.toString(),
          adminKey: tokenInfo.adminKey ? 'Present' : 'Not set',
          supplyKey: tokenInfo.supplyKey ? 'Present' : 'Not set',
          freezeKey: tokenInfo.freezeKey ? 'Present' : 'Not set',
          wipeKey: tokenInfo.wipeKey ? 'Present' : 'Not set',
          kycKey: tokenInfo.kycKey ? 'Present' : 'Not set',
          pauseKey: tokenInfo.pauseKey ? 'Present' : 'Not set',
          memo: tokenInfo.memo,
          tokenType: tokenInfo.tokenType,
          supplyType: tokenInfo.supplyType,
          maxSupply: tokenInfo.maxSupply.toString(),
          decimals: tokenInfo.decimals,
          defaultFreezeStatus: tokenInfo.defaultFreezeStatus,
          defaultKycStatus: tokenInfo.defaultKycStatus,
          isDeleted: tokenInfo.isDeleted,
          autoRenewAccount: tokenInfo.autoRenewAccount ? tokenInfo.autoRenewAccount.toString() : null,
          autoRenewPeriod: tokenInfo.autoRenewPeriod ? tokenInfo.autoRenewPeriod.toString() : null,
          expiry: tokenInfo.expiry ? new Date(tokenInfo.expiry * 1000).toISOString() : null,
          feeScheduleKey: tokenInfo.feeScheduleKey ? 'Present' : 'Not set'
        }
      };
    }
    
  } catch (error) {
    console.error(`❌ Failed to retrieve metadata from blockchain: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify metadata integrity between blockchain and DynamoDB
 */
async function verifyMetadataIntegrity(tokenId, userId) {
  try {
    console.log(`🔍 Verifying metadata integrity for token: ${tokenId}`);
    
    // Get metadata from blockchain
    const blockchainResult = await getTokenMetadataFromBlockchain(tokenId);
    if (!blockchainResult.success) {
      return {
        success: false,
        error: 'Failed to retrieve metadata from blockchain',
        details: blockchainResult.error
      };
    }
    
    // Check if this is blockchain-only storage
    if (blockchainResult.storageType === 'blockchain_only') {
      console.log(`🔍 Verifying blockchain-only storage for token: ${tokenId}`);
      
      // For blockchain-only storage, we verify content hash
      const crypto = require('crypto');
      const contentHash = crypto.createHash('sha256').update(blockchainResult.content).digest('hex');
      
      const hashValid = contentHash === blockchainResult.contentHash;
      
      return {
        success: true,
        integrityValid: hashValid,
        storageType: 'blockchain_only',
        contentHash: blockchainResult.contentHash,
        calculatedHash: contentHash,
        contentSize: blockchainResult.content.length,
        blockchainMetadata: blockchainResult.metadata,
        tokenInfo: blockchainResult.tokenInfo,
        verificationTimestamp: new Date().toISOString(),
        note: 'Content verified against blockchain hash'
      };
    }
    
    // For blockchain-only storage, verify that DynamoDB record exists but has no metadata
    const dynamoResult = await dynamodb.send(new GetCommand({
      TableName: SAFEMATE_FOLDERS_TABLE,
      Key: { tokenId: tokenId }
    }));
    
    if (!dynamoResult.Item) {
      // Try files table
      const fileResult = await dynamodb.send(new GetCommand({
        TableName: SAFEMATE_FILES_TABLE,
        Key: { tokenId: tokenId }
      }));
      
      if (!fileResult.Item) {
        return {
          success: false,
          error: 'Token not found in DynamoDB',
          blockchainMetadata: blockchainResult.metadata,
          note: 'DynamoDB record missing for blockchain-only storage'
        };
      }
      
      // For blockchain-only storage, verify DynamoDB has no metadata field
      const hasDynamoMetadata = fileResult.Item.metadata !== undefined;
      
      return {
        success: true,
        integrityValid: !hasDynamoMetadata, // Should be true if no metadata in DynamoDB
        storageType: 'blockchain_only',
        blockchainMetadata: blockchainResult.metadata,
        dynamoHasMetadata: hasDynamoMetadata,
        tokenInfo: blockchainResult.tokenInfo,
        verificationTimestamp: new Date().toISOString(),
        note: 'Blockchain-only storage: metadata should only exist on blockchain'
      };
    }
    
    // For blockchain-only storage, verify DynamoDB has no metadata field
    const hasDynamoMetadata = dynamoResult.Item.metadata !== undefined;
    
    return {
      success: true,
      integrityValid: !hasDynamoMetadata, // Should be true if no metadata in DynamoDB
      storageType: 'blockchain_only',
      blockchainMetadata: blockchainResult.metadata,
      dynamoHasMetadata: hasDynamoMetadata,
      tokenInfo: blockchainResult.tokenInfo,
      verificationTimestamp: new Date().toISOString(),
      note: 'Blockchain-only storage: metadata should only exist on blockchain'
    };
    
  } catch (error) {
    console.error(`❌ Failed to verify metadata integrity: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get onboarding status for a user
 */
async function getOnboardingStatus(userId) {
  try {
    console.log(`🔍 Getting onboarding status for user: ${userId}`);
    
    // Query for wallets by user_id
    const result = await dynamodb.send(new QueryCommand({
      TableName: WALLET_METADATA_TABLE,
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: 1
    }));
    
    if (result.Items && result.Items.length > 0) {
      const wallet = result.Items[0];
      console.log('✅ User has wallet:', wallet);
      return {
        success: true,
        hasWallet: true,
        accountId: wallet.hedera_account_id || wallet.account_id || 'N/A',
        publicKey: wallet.public_key || 'N/A',
        walletId: wallet.wallet_id,
        status: wallet.status || 'completed',
        wallet: wallet
      };
    } else {
      console.log('❌ No wallet found for user');
      return {
        success: true,
        hasWallet: false,
        status: 'pending'
      };
    }
  } catch (error) {
    console.error('❌ Error getting onboarding status:', error);
    return {
      success: false,
      hasWallet: false,
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Start onboarding process and create wallet
 */
async function startOnboarding(userId, email) {
  try {
    console.log(`🚀 Starting onboarding for user: ${userId}, email: ${email}`);
    
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
    const client = await initializeHederaClient();
    
    // Generate new keypair
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;
    
    console.log('✅ Generated new keypair for user:', userId);
    
    // Create Hedera account
    const transaction = new AccountCreateTransaction()
      .setKey(publicKey)
      .setInitialBalance(new Hbar(0.1)) // Fund with 0.1 HBAR
      .setMaxAutomaticTokenAssociations(10);
    
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;
    
    console.log('✅ Created Hedera account:', accountId.toString());
    
    // Generate wallet ID
    const walletId = randomUUID();
    
    // Encrypt private key with KMS
    const encryptParams = {
      KeyId: APP_SECRETS_KMS_KEY_ID,
      Plaintext: privateKey.toString()
    };
    
    const encryptResult = await kms.send(new EncryptCommand(encryptParams));
    const encryptedPrivateKey = encryptResult.CiphertextBlob.toString('base64');
    
    // Store wallet data in DynamoDB
    const walletData = {
      user_id: userId,
      wallet_id: walletId,
      email: email,
      status: 'completed',
      created_at: new Date().toISOString(),
      account_type: 'auto_created_secure',
      network: HEDERA_NETWORK,
      hedera_account_id: accountId.toString(),
      public_key: publicKey.toString(),
      encrypted_private_key: encryptedPrivateKey,
      initial_balance: 0.1,
      current_balance: 0.1,
      transaction_id: response.transactionId.toString()
    };
    
    await dynamodb.send(new PutCommand({
      TableName: WALLET_METADATA_TABLE,
      Item: walletData
    }));
    
    console.log('✅ Wallet data stored in DynamoDB');
    
    return {
      success: true,
      message: 'Wallet created successfully',
      walletId: walletId,
      accountId: accountId.toString(),
      publicKey: publicKey.toString(),
      transactionId: response.transactionId.toString(),
      wallet: {
        walletId: walletId,
        userId: userId,
        email: email,
        status: 'completed',
        accountId: accountId.toString(),
        publicKey: publicKey.toString()
      }
    };
    
  } catch (error) {
    console.error('❌ Error starting onboarding:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a new Hedera wallet for the user
 */
async function createWallet(userId, email) {
  try {
    console.log(`🔧 Creating wallet for user: ${userId}`);
    
    // Check if user already has a wallet
    const status = await getOnboardingStatus(userId);
    if (status.hasWallet) {
      return {
        success: true,
        message: 'User already has a wallet',
        wallet: {
          accountId: status.accountId,
          publicKey: status.publicKey,
          walletId: status.walletId
        }
      };
    }
    
    // Start onboarding process (which creates the wallet)
    const result = await startOnboarding(userId, email);
    
    if (result.success) {
      return {
        success: true,
        message: 'Wallet created successfully',
        wallet: {
          accountId: result.accountId,
          publicKey: result.publicKey,
          walletId: result.walletId
        }
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('❌ Error creating wallet:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update NFT metadata for files and folders
 */
async function updateNFTMetadata(tokenId, newMetadata, userId) {
  try {
    console.log(`🔄 Updating NFT metadata for token: ${tokenId}`);
    
    const client = await initializeHederaClient();
    
    // Get current token info to verify it exists and get serial number
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(TokenId.fromString(tokenId))
      .execute(client);
    
    if (!tokenInfo) {
      throw new Error(`Token not found: ${tokenId}`);
    }
    
    // For NON_FUNGIBLE_UNIQUE tokens, we need the serial number
    // Since we create only 1 NFT per token, serial number is 1
    const serialNumber = 1;
    
    // Create update transaction
    const transaction = new TokenUpdateNftsTransaction()
      .setTokenId(TokenId.fromString(tokenId))
      .setSerialNumbers([serialNumber])
      .setMetadata(Buffer.from(JSON.stringify(newMetadata), 'utf8'))
      .setMaxTransactionFee(new Hbar(2))
      .freezeWith(client);
    
    // Sign and execute transaction
    const signedTransaction = await transaction.sign(client.operatorPrivateKey);
    const response = await signedTransaction.execute(client);
    
    // Get receipt
    const receipt = await new TransactionReceiptQuery()
      .setTransactionId(response.transactionId)
      .execute(client);
    
    const transactionId = response.transactionId.toString();
    
    console.log(`✅ NFT metadata updated on Hedera ${HEDERA_NETWORK}: ${tokenId} (tx: ${transactionId})`);
    
    // Update DynamoDB record
    await updateDynamoDBMetadata(tokenId, newMetadata, transactionId);
    
    return {
      success: true,
      tokenId: tokenId,
      transactionId: transactionId,
      network: HEDERA_NETWORK,
      updatedAt: new Date().toISOString(),
      metadata: newMetadata
    };
    
  } catch (error) {
    console.error(`❌ Failed to update NFT metadata: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update file content and metadata
 */
async function updateFile(fileTokenId, fileName, fileData, userId, version) {
  try {
    console.log(`🔄 Updating file: ${fileName} v${version} for user: ${userId}`);
    
    // Create new file metadata with updated content
    const fileMetadata = {
      type: 'file',
      name: fileName,
      version: version,
      userId: userId,
      content: fileData, // base64 encoded content
      contentType: 'application/octet-stream',
      size: Buffer.from(fileData, 'base64').length,
      updatedAt: new Date().toISOString(),
      isVersioned: true,
      previousVersion: fileTokenId
    };
    
    // Update the NFT metadata
    const result = await updateNFTMetadata(fileTokenId, fileMetadata, userId);
    
    if (result.success) {
      // Update DynamoDB file record (BLOCKCHAIN-ONLY METADATA)
      const fileRecord = {
        tokenId: fileTokenId,
        fileName: fileName,
        version: version,
        // NO fileContent stored in DynamoDB - content only on blockchain
        updatedAt: new Date().toISOString(),
        // NO metadata stored in DynamoDB - metadata only on blockchain
        lastTransactionId: result.transactionId,
        storageType: 'blockchain_only',
        metadataLocation: 'blockchain_only',
        contentLocation: 'blockchain_only'
      };
      
      await dynamodb.send(new PutCommand({
        TableName: SAFEMATE_FILES_TABLE,
        Item: fileRecord
      }));
      
      console.log(`✅ File updated successfully (metadata on blockchain only): ${fileName} v${version}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to update file: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update folder metadata
 */
async function updateFolder(folderTokenId, folderName, userId, newMetadata = {}) {
  try {
    console.log(`🔄 Updating folder: ${folderName} for user: ${userId}`);
    
    // Get current folder metadata
    const currentResult = await getTokenMetadataFromBlockchain(folderTokenId);
    if (!currentResult.success) {
      throw new Error('Failed to get current folder metadata');
    }
    
    const currentMetadata = currentResult.metadata;
    
    // Merge with new metadata
    const updatedMetadata = {
      ...currentMetadata,
      name: folderName,
      updatedAt: new Date().toISOString(),
      ...newMetadata
    };
    
    // Update the NFT metadata
    const result = await updateNFTMetadata(folderTokenId, updatedMetadata, userId);
    
    if (result.success) {
      // Update DynamoDB folder record (BLOCKCHAIN-ONLY METADATA)
      const folderRecord = {
        tokenId: folderTokenId,
        folderName: folderName,
        updatedAt: new Date().toISOString(),
        // NO metadata stored in DynamoDB - metadata only on blockchain
        lastTransactionId: result.transactionId,
        storageType: 'blockchain_only',
        metadataLocation: 'blockchain_only',
        contentLocation: 'blockchain_only'
      };
      
      await dynamodb.send(new PutCommand({
        TableName: SAFEMATE_FOLDERS_TABLE,
        Item: folderRecord
      }));
      
      console.log(`✅ Folder updated successfully (metadata on blockchain only): ${folderName}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to update folder: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update DynamoDB record (BLOCKCHAIN-ONLY METADATA - no metadata stored in DynamoDB)
 */
async function updateDynamoDBMetadata(tokenId, metadata, transactionId) {
  try {
    // For blockchain-only storage, we don't store metadata in DynamoDB
    // Only update the lastTransactionId and timestamp
    
    // Try to update in folders table first
    const folderResult = await dynamodb.send(new GetCommand({
      TableName: SAFEMATE_FOLDERS_TABLE,
      Key: { tokenId: tokenId }
    }));
    
    if (folderResult.Item) {
      // Update folder record (no metadata storage)
      await dynamodb.send(new PutCommand({
        TableName: SAFEMATE_FOLDERS_TABLE,
        Item: {
          ...folderResult.Item,
          // NO metadata field - metadata only on blockchain
          lastTransactionId: transactionId,
          updatedAt: new Date().toISOString(),
          storageType: 'blockchain_only',
          metadataLocation: 'blockchain_only'
        }
      }));
      console.log(`✅ Updated folder record (metadata on blockchain only): ${tokenId}`);
      return;
    }
    
    // Try files table
    const fileResult = await dynamodb.send(new GetCommand({
      TableName: SAFEMATE_FILES_TABLE,
      Key: { tokenId: tokenId }
    }));
    
    if (fileResult.Item) {
      // Update file record (no metadata storage)
      await dynamodb.send(new PutCommand({
        TableName: SAFEMATE_FILES_TABLE,
        Item: {
          ...fileResult.Item,
          // NO metadata field - metadata only on blockchain
          lastTransactionId: transactionId,
          updatedAt: new Date().toISOString(),
          storageType: 'blockchain_only',
          metadataLocation: 'blockchain_only'
        }
      }));
      console.log(`✅ Updated file record (metadata on blockchain only): ${tokenId}`);
      return;
    }
    
    console.log(`⚠️ Token ${tokenId} not found in DynamoDB tables`);
    
  } catch (error) {
    console.error(`❌ Failed to update DynamoDB record: ${error.message}`);
  }
}

// Helper function to get user from event
function getUserFromEvent(event) {
  try {
    return event.requestContext.authorizer.claims.sub;
  } catch (error) {
    console.error('Error getting user from event:', error);
    return null;
  }
}

// Helper function to create response
function createResponse(statusCode, body, event) {
  const origin = event?.headers?.origin || event?.headers?.Origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'https://safemate.com',
    'https://www.safemate.com'
  ];
  
  // For development, allow all localhost origins
  const allowOrigin = origin && (origin.includes('localhost') || allowedOrigins.includes(origin)) ? origin : '*';
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-cognito-id-token,x-cognito-access-token,Accept',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Detect event format and extract details
    let httpMethod, path, pathParameters, body;
    
    if (event.httpMethod) {
      // API Gateway v1 format
      httpMethod = event.httpMethod;
      path = event.path;
      pathParameters = event.pathParameters;
      body = event.body;
      console.log('🔍 Using API Gateway v1 format');
    } else if (event.requestContext?.http?.method) {
      // API Gateway v2 format
      httpMethod = event.requestContext.http.method;
      path = event.requestContext.http.path;
      pathParameters = event.pathParameters;
      body = event.body;
      console.log('🔍 Using API Gateway v2 format');
    } else {
      console.error('❌ Unknown event format:', event);
      return createResponse(400, { 
        success: false, 
        error: 'Unknown event format' 
      }, event);
    }
    
    console.log(`🔍 Detected method: ${httpMethod}, path: ${path}`);
    
    // Strip stage prefix from path only if it looks like a stage (e.g., /dev-1/folders -> /folders)
    // But preserve paths that are already clean (e.g., /folders stays /folders)
    let cleanPath = path;
    if (path.match(/^\/[^\/]+-\d+\//)) {
      // Path has stage prefix pattern like /dev-1/ or /prod-2/
      cleanPath = path.replace(/^\/[^\/]+/, '');
    } else if (path === '/') {
      // Root path stays as root
      cleanPath = '/';
    }
    // Otherwise, use the path as-is
    console.log(`🔍 Clean path: ${cleanPath}`);

    // Handle preflight OPTIONS requests
    if (httpMethod === 'OPTIONS') {
      console.log('✅ Handling OPTIONS preflight request');
      return createResponse(200, { message: 'CORS preflight' }, event);
    }

    // Get user from Cognito authorizer
    let userId = getUserFromEvent(event);
    if (!userId) {
      // For testing without authentication, use a default user ID
      console.log('⚠️ No user found in event, using default test user');
      userId = 'test-user-123';
    }
    
    // Route requests
    if (cleanPath === '/folders') {
      if (httpMethod === 'GET') {
        const result = await listUserFolders(userId);
        return createResponse(200, { 
          success: true, 
          data: result 
        }, event);
      } else if (httpMethod === 'POST') {
        const { name, parentFolderId } = JSON.parse(body);
        if (!name) {
          return createResponse(400, { 
            success: false, 
            error: 'Folder name is required' 
          }, event);
        }
        
        const result = await createFolder(name, userId, parentFolderId);
        return createResponse(201, { 
          success: true, 
          data: result 
        }, event);
      }
    } else if (cleanPath.startsWith('/folders/') && pathParameters?.folderId) {
      if (httpMethod === 'DELETE') {
        const result = await deleteFolder(pathParameters.folderId, userId);
        return createResponse(200, { 
          success: true, 
          data: result 
        }, event);
      } else if (httpMethod === 'GET') {
        // List files in folder
        const result = await listFilesInFolder(userId, pathParameters.folderId);
        return createResponse(200, { 
          success: true, 
          data: result 
        }, event);
      }
    } else if (cleanPath === '/files/upload' && httpMethod === 'POST') {
      const { fileName, fileData, fileSize, contentType, folderId, version } = JSON.parse(body);
      
      if (!fileName || !fileData) {
        return createResponse(400, { 
          success: false, 
          error: 'File name and data are required' 
        }, event);
      }
      
      const result = await createFile(fileName, fileData, userId, folderId);
      return createResponse(201, { 
        success: true, 
        data: result 
      }, event);
    } else if (cleanPath.startsWith('/files/') && pathParameters?.fileId && httpMethod === 'PUT') {
      // Update existing file (create new version)
      const { fileData, version, fileName } = JSON.parse(body);
      
      if (!fileData || !version) {
        return createResponse(400, { 
          success: false, 
          error: 'File data and version are required' 
        }, event);
      }
      
      const result = await updateFile(pathParameters.fileId, fileName || 'Updated File', fileData, userId, version);
      return createResponse(200, { 
        success: true, 
        data: result 
      }, event);
    } else if (cleanPath.startsWith('/files/') && pathParameters?.fileId && httpMethod === 'GET') {
      // Get file content
      try {
        const result = await getFileContent(pathParameters.fileId);
        return createResponse(200, { 
          success: true, 
          data: result 
        }, event);
      } catch (error) {
        return createResponse(404, { 
          success: false, 
          error: 'File not found' 
        }, event);
      }
    } else if (cleanPath.startsWith('/metadata/') && pathParameters?.tokenId) {
      if (httpMethod === 'GET') {
        // Get metadata from blockchain
        const result = await getTokenMetadataFromBlockchain(pathParameters.tokenId);
        if (result) {
          return createResponse(200, { 
            success: true, 
            data: result 
          }, event);
        } else {
          return createResponse(404, { 
            success: false, 
            error: 'Metadata not found on blockchain' 
          }, event);
        }
      }
    } else if (cleanPath.startsWith('/verify/') && pathParameters?.tokenId) {
      if (httpMethod === 'GET') {
        // Verify metadata integrity
        const result = await verifyMetadataIntegrity(pathParameters.tokenId, userId);
        return createResponse(200, { 
          success: true, 
          data: result 
        }, event);
      }
    } else if (cleanPath.startsWith('/folders/') && pathParameters?.folderId && httpMethod === 'PUT') {
      const { folderName } = JSON.parse(body);
      if (!folderName) {
        return createResponse(400, {
          success: false,
          error: 'Folder name is required for update'
        }, event);
      }
      const result = await updateFolder(pathParameters.folderId, folderName, userId);
      return createResponse(200, {
        success: true,
        data: result
      }, event);
    } else if (cleanPath === '/onboarding/status' && httpMethod === 'GET') {
      const result = await getOnboardingStatus(userId);
      return createResponse(200, { 
        success: true, 
        data: result 
      }, event);
    } else if (cleanPath === '/onboarding/start' && httpMethod === 'POST') {
      const { email } = JSON.parse(body);
      if (!email) {
        return createResponse(400, { 
          success: false, 
          error: 'Email is required for onboarding' 
        }, event);
      }
      const result = await startOnboarding(userId, email);
      return createResponse(200, { 
        success: true, 
        data: result 
      }, event);
    } else if (cleanPath === '/wallet/create' && httpMethod === 'POST') {
      // Get email from user claims or request body
      const email = event.requestContext?.authorizer?.claims?.email || JSON.parse(body).email;
      if (!email) {
        return createResponse(400, { 
          success: false, 
          error: 'Email is required for wallet creation' 
        }, event);
      }
      const result = await createWallet(userId, email);
      return createResponse(200, { 
        success: true, 
        data: result 
      }, event);
    }

    return createResponse(404, { 
      success: false, 
      error: 'Not found' 
    }, event);

  } catch (error) {
    console.error('Error processing request:', error);
    return createResponse(500, { 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    }, event);
  }
};
