# Hedera Wallet Creation Guide for Cursor - SafeMate Application

## Overview
This document provides comprehensive instructions for creating a Hedera testnet wallet system for the SafeMate application using Cursor IDE. The system will support hierarchical file management using tokens as folders and NFTs as files, all stored directly on the Hedera blockchain.

---

## 🏗️ **1. Operator Account Configuration**

### Primary Setup
Configure the operator account for creating funded user wallets:

```javascript
// Operator Account Configuration
const OPERATOR_CONFIG = {
  accountId: "0.0.6428427",
  network: "testnet",
  initialUserBalance: "0.1", // HBAR for new accounts
  fundingEnabled: true
};
```

### Security Requirements
- Store operator private key securely in AWS KMS/Secrets Manager
- Never expose operator credentials to frontend
- Use operator account to fund new user account creation (no aliases needed)
- Set initial balance of 0.1 HBAR for each new account
- Implement proper IAM roles with minimal required permissions

### Account Creation Process
```javascript
async function createUserAccount(userId, userPublicKey) {
  const transaction = new AccountCreateTransaction()
    .setKey(userPublicKey)
    .setInitialBalance(new Hbar(0.1)) // Fund with 0.1 HBAR
    .setAccountMemo(`SafeMate-User-${userId}`);
    
  const response = await transaction.execute(operatorClient);
  const receipt = await response.getReceipt(operatorClient);
  return receipt.accountId;
}
```

---

## 🗂️ **2. Token Types for Folder/File Structure**

### Folder Tokens (Containers)
Use **Fungible Tokens** for folder representation:

```javascript
const FOLDER_TOKEN_CONFIG = {
  tokenType: "FUNGIBLE_COMMON",
  supplyType: "FINITE",
  maxSupply: 1000000,
  decimals: 0,
  initialSupply: 1000000,
  metadata: "folder_metadata_json"
};
```

**Key Properties:**
- Enable token association and transfers for sharing
- Include metadata for folder properties (name, description, parent_id)
- Support hierarchical relationships through parent/child references
- Allow folder permissions and access control

### File NFTs (Documents)
Use **Non-Fungible Tokens (NFTs)** for file representation:

```javascript
const FILE_NFT_CONFIG = {
  tokenType: "NON_FUNGIBLE_UNIQUE",
  supplyType: "FINITE",
  maxSupply: 1000000,
  metadata: "file_metadata_json",
  updateable: true
};
```

**Key Properties:**
- Store file metadata directly on-chain in NFT properties
- Support multiple file types through metadata schema
- Enable version control through metadata updates
- Include file integrity verification through hash storage

---

## ⚙️ **3. Essential Token Settings**

### Folder Token Configuration
```javascript
async function createFolderToken(folderName, folderMetadata) {
  const transaction = new TokenCreateTransaction()
    .setTokenName(`SafeMate-Folder-${folderName}`)
    .setTokenSymbol("SMF")
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(0)
    .setInitialSupply(1000000)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(1000000)
    .setSupplyKey(operatorKey)
    .setAdminKey(operatorKey)
    .setKycKey(operatorKey)
    .setFreezeKey(operatorKey)
    .setWipeKey(operatorKey)
    .setPauseKey(operatorKey)
    .setTokenMemo(JSON.stringify(folderMetadata))
    .freezeWith(client);

  const response = await transaction.execute(client);
  return await response.getReceipt(client);
}
```

### File NFT Configuration
```javascript
async function createFileNFT(fileName, fileMetadata) {
  const transaction = new TokenCreateTransaction()
    .setTokenName(`SafeMate-File-${fileName}`)
    .setTokenSymbol("SMN")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(1000000)
    .setSupplyKey(operatorKey)
    .setAdminKey(operatorKey)
    .setMetadataKey(operatorKey) // Allows metadata updates
    .setTokenMemo(JSON.stringify(fileMetadata))
    .freezeWith(client);

  const response = await transaction.execute(client);
  return await response.getReceipt(client);
}
```

### Token Permission Matrix
```javascript
const TOKEN_PERMISSIONS = {
  supplyKey: operatorKey,     // Create/mint new tokens
  adminKey: operatorKey,      // Administrative functions
  kycKey: operatorKey,        // Know Your Customer compliance
  freezeKey: operatorKey,     // Freeze/unfreeze accounts
  wipeKey: operatorKey,       // Remove tokens from accounts
  pauseKey: operatorKey,      // Pause token operations
  metadataKey: operatorKey    // Update metadata (NFTs only)
};
```

---

## 📁 **4. File Upload and NFT Minting**

### Supported File Types
Configure support for various file types:

```javascript
const SUPPORTED_FILE_TYPES = {
  documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  spreadsheets: ['.xls', '.xlsx', '.csv'],
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
  videos: ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
  audio: ['.mp3', '.wav', '.flac', '.aac'],
  archives: ['.zip', '.rar', '.7z', '.tar'],
  presentations: ['.ppt', '.pptx', '.odp']
};
```

### File Processing Pipeline
```javascript
async function uploadFileAsNFT(fileData, folderTokenId, userAccountId) {
  // 1. Generate file hash for integrity
  const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');
  
  // 2. Create file metadata
  const fileMetadata = {
    type: "file",
    filename: fileData.originalname,
    mime_type: fileData.mimetype,
    file_size: fileData.size,
    file_hash: fileHash,
    folder_id: folderTokenId,
    version: "1.0",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    editable: true,
    uploader: userAccountId
  };
  
  // 3. Create NFT collection (if not exists)
  const nftCollectionId = await getOrCreateNFTCollection(folderTokenId);
  
  // 4. Mint NFT with metadata
  const mintTransaction = new TokenMintTransaction()
    .setTokenId(nftCollectionId)
    .setMetadata([Buffer.from(JSON.stringify(fileMetadata))])
    .freezeWith(client);
    
  const response = await mintTransaction.execute(client);
  const receipt = await response.getReceipt(client);
  
  return {
    tokenId: nftCollectionId,
    serialNumber: receipt.serials[0],
    metadata: fileMetadata
  };
}
```

### File Integrity Verification
```javascript
async function verifyFileIntegrity(tokenId, serialNumber, fileData) {
  // Get NFT metadata
  const nftInfo = await new TokenNftInfoQuery()
    .setNftId(new NftId(tokenId, serialNumber))
    .execute(client);
    
  const metadata = JSON.parse(nftInfo.metadata.toString());
  const currentHash = crypto.createHash('sha256').update(fileData).digest('hex');
  
  return metadata.file_hash === currentHash;
}
```

---

## 🔗 **5. Blockchain-Direct Creation**

### Direct Blockchain Storage
Ensure all operations write directly to Hedera blockchain:

```javascript
class HederaDirectStorage {
  constructor(client, operatorKey) {
    this.client = client;
    this.operatorKey = operatorKey;
  }

  async createFolderStructure(folderHierarchy) {
    const results = [];
    
    for (const folder of folderHierarchy) {
      // Create folder token directly on blockchain
      const folderToken = await this.createFolderToken(folder);
      
      // Store relationship metadata on-chain
      const relationshipData = {
        parent_id: folder.parentId,
        children: folder.children || [],
        permissions: folder.permissions,
        created_by: folder.createdBy
      };
      
      // Submit to consensus service for audit trail
      await this.submitToConsensus(folderToken.tokenId, relationshipData);
      
      results.push(folderToken);
    }
    
    return results;
  }

  async submitToConsensus(tokenId, data) {
    const topicId = await this.getAuditTopic();
    const message = JSON.stringify({
      action: 'folder_created',
      token_id: tokenId.toString(),
      data: data,
      timestamp: new Date().toISOString()
    });
    
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message);
      
    return await transaction.execute(this.client);
  }
}
```

### Metadata Storage Strategy
```javascript
const METADATA_STORAGE = {
  onChain: {
    folderRelationships: true,
    fileHashes: true,
    permissions: true,
    auditLogs: true
  },
  offChain: {
    largeFileContent: false, // Store hashes only
    thumbnails: false,
    searchIndexes: false
  }
};
```

---

## 🔐 **6. Key Infrastructure Requirements**

### AWS KMS Configuration
```javascript
const KMS_CONFIG = {
  keyId: process.env.WALLET_KMS_KEY_ID,
  region: 'ap-southeast-2',
  encryptionAlgorithm: 'SYMMETRIC_DEFAULT',
  keySpec: 'SYMMETRIC_DEFAULT'
};

async function encryptPrivateKey(privateKey) {
  const kms = new AWS.KMS({ region: KMS_CONFIG.region });
  
  const params = {
    KeyId: KMS_CONFIG.keyId,
    Plaintext: Buffer.from(privateKey)
  };
  
  const result = await kms.encrypt(params).promise();
  return result.CiphertextBlob.toString('base64');
}
```

### DynamoDB Schema
```javascript
const DYNAMODB_TABLES = {
  walletKeys: {
    tableName: 'default-safemate-wallet-keys',
    partitionKey: 'userId',
    attributes: {
      encryptedPrivateKey: 'String',
      publicKey: 'String',
      accountId: 'String',
      kmsKeyId: 'String',
      createdAt: 'String'
    }
  },
  walletMetadata: {
    tableName: 'default-safemate-wallet-metadata',
    partitionKey: 'userId',
    attributes: {
      balance: 'Number',
      tokenAssociations: 'List',
      folderStructure: 'Map',
      lastActivity: 'String'
    }
  }
};
```

### JWT Authentication
```javascript
async function validateJWTToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      valid: true,
      userId: decoded.sub,
      accountType: decoded['custom:account_type'],
      email: decoded.email
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

---

## 🛠️ **7. API Endpoints to Implement**

### Folder Management Endpoints
```javascript
// POST /hedera/create-folder
app.post('/hedera/create-folder', authenticateJWT, async (req, res) => {
  const { folder_name, parent_folder_id, metadata } = req.body;
  
  try {
    const folderToken = await createFolderToken(folder_name, {
      ...metadata,
      parent_id: parent_folder_id,
      created_by: req.user.userId,
      created_at: new Date().toISOString()
    });
    
    res.json({
      success: true,
      folder_id: folderToken.tokenId.toString(),
      message: 'Folder created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /hedera/folder-contents
app.get('/hedera/folder-contents/:folderId', authenticateJWT, async (req, res) => {
  const { folderId } = req.params;
  
  try {
    const contents = await getFolderContents(folderId, req.user.userId);
    res.json({ success: true, contents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### File Management Endpoints
```javascript
// POST /hedera/upload-file
app.post('/hedera/upload-file', authenticateJWT, upload.single('file'), async (req, res) => {
  const { folder_id, metadata } = req.body;
  const file = req.file;
  
  try {
    const nftResult = await uploadFileAsNFT(file, folder_id, req.user.userId);
    
    res.json({
      success: true,
      file_id: `${nftResult.tokenId}-${nftResult.serialNumber}`,
      metadata: nftResult.metadata,
      message: 'File uploaded as NFT successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /hedera/update-metadata
app.put('/hedera/update-metadata', authenticateJWT, async (req, res) => {
  const { token_id, serial_number, new_metadata } = req.body;
  
  try {
    const result = await updateNFTMetadata(token_id, serial_number, new_metadata);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Transfer and Sharing Endpoints
```javascript
// POST /hedera/transfer-file
app.post('/hedera/transfer-file', authenticateJWT, async (req, res) => {
  const { file_id, target_folder_id, target_user_id } = req.body;
  
  try {
    const [tokenId, serialNumber] = file_id.split('-');
    const result = await transferNFT(tokenId, serialNumber, target_user_id);
    
    res.json({
      success: true,
      transaction_id: result.transactionId.toString(),
      message: 'File transferred successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📋 **8. Metadata Schema**

### Folder Metadata Schema
```json
{
  "type": "folder",
  "name": "Project Documents",
  "description": "Main project documentation folder",
  "parent_folder_id": "0.0.1234567",
  "created_at": "2025-08-22T10:30:00.000Z",
  "created_by": "user-123",
  "permissions": {
    "owner": "user-123",
    "read": ["user-123", "user-456"],
    "write": ["user-123"],
    "share": ["user-123"]
  },
  "tags": ["project", "documentation", "important"],
  "color": "#FF5722",
  "icon": "folder",
  "children_count": 5,
  "total_size": 1024000
}
```

### File Metadata Schema
```json
{
  "type": "file",
  "filename": "project-specification.pdf",
  "original_name": "Project Specification v2.1.pdf",
  "mime_type": "application/pdf",
  "file_size": 2048000,
  "file_hash": "sha256:a1b2c3d4e5f6...",
  "folder_id": "0.0.1234567",
  "version": "2.1",
  "created_at": "2025-08-22T10:30:00.000Z",
  "updated_at": "2025-08-22T15:45:00.000Z",
  "created_by": "user-123",
  "last_modified_by": "user-456",
  "editable": true,
  "encrypted": false,
  "tags": ["specification", "v2.1", "approved"],
  "thumbnail_hash": "sha256:thumb123...",
  "access_log": [
    {
      "user_id": "user-123",
      "action": "created",
      "timestamp": "2025-08-22T10:30:00.000Z"
    },
    {
      "user_id": "user-456",
      "action": "viewed",
      "timestamp": "2025-08-22T14:20:00.000Z"
    }
  ]
}
```

### Permission Schema
```json
{
  "permissions": {
    "owner": "user-123",
    "readers": ["user-123", "user-456", "group-789"],
    "writers": ["user-123"],
    "sharers": ["user-123"],
    "public": false,
    "expiry": null,
    "inherited": true,
    "custom_rules": [
      {
        "user_id": "user-456",
        "permissions": ["read", "comment"],
        "expires_at": "2025-12-31T23:59:59.000Z"
      }
    ]
  }
}
```

---

## 🌐 **9. Network Configuration**

### Hedera Testnet Setup
```javascript
const HEDERA_CONFIG = {
  network: 'testnet',
  mirrorNode: 'https://testnet.mirrornode.hedera.com',
  consensusNodes: {
    '0.testnet.hedera.com:50211': '0.0.3',
    '1.testnet.hedera.com:50211': '0.0.4',
    '2.testnet.hedera.com:50211': '0.0.5',
    '3.testnet.hedera.com:50211': '0.0.6'
  },
  maxTransactionFee: new Hbar(1),
  maxQueryPayment: new Hbar(0.1)
};

function initializeHederaClient() {
  const client = Client.forTestnet();
  
  // Set operator
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_OPERATOR_ID),
    PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY)
  );
  
  // Configure limits
  client.setDefaultMaxTransactionFee(HEDERA_CONFIG.maxTransactionFee);
  client.setDefaultMaxQueryPayment(HEDERA_CONFIG.maxQueryPayment);
  
  return client;
}
```

### Transaction Configuration
```javascript
const TRANSACTION_CONFIG = {
  defaultTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  maxFee: {
    accountCreate: new Hbar(1),
    tokenCreate: new Hbar(2),
    tokenMint: new Hbar(0.1),
    tokenTransfer: new Hbar(0.01),
    metadataUpdate: new Hbar(0.05)
  }
};
```

### Mirror Node Queries
```javascript
async function queryAccountBalance(accountId) {
  const url = `${HEDERA_CONFIG.mirrorNode}/api/v1/accounts/${accountId}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.balance.balance / 100000000; // Convert tinybars to HBAR
}

async function queryTokenInfo(tokenId) {
  const url = `${HEDERA_CONFIG.mirrorNode}/api/v1/tokens/${tokenId}`;
  const response = await fetch(url);
  return await response.json();
}
```

---

## 🚨 **10. Error Handling and Recovery**

### Transaction Error Handling
```javascript
class HederaTransactionHandler {
  constructor(client, maxRetries = 3) {
    this.client = client;
    this.maxRetries = maxRetries;
  }

  async executeWithRetry(transaction) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await transaction.execute(this.client);
        const receipt = await response.getReceipt(this.client);
        
        if (receipt.status === Status.Success) {
          return { success: true, receipt, response };
        }
        
        throw new Error(`Transaction failed with status: ${receipt.status}`);
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
          continue;
        }
      }
    }
    
    return { success: false, error: lastError };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Network Recovery
```javascript
async function handleNetworkErrors(operation, ...args) {
  const networkErrors = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'CONNECTION_REFUSED',
    'GRPC_STATUS_UNAVAILABLE'
  ];

  try {
    return await operation(...args);
  } catch (error) {
    if (networkErrors.some(err => error.message.includes(err))) {
      // Wait and retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await operation(...args);
    }
    throw error;
  }
}
```

### Account Balance Verification
```javascript
async function verifyAccountBalance(accountId, requiredAmount) {
  try {
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(accountId)
      .execute(client);
      
    const balance = accountInfo.balance.toBigNumber();
    const required = Hbar.from(requiredAmount).toBigNumber();
    
    if (balance.isLessThan(required)) {
      throw new Error(`Insufficient balance. Required: ${requiredAmount} HBAR, Available: ${balance.toString()}`);
    }
    
    return true;
  } catch (error) {
    throw new Error(`Balance verification failed: ${error.message}`);
  }
}
```

### Comprehensive Logging
```javascript
const LOGGING_CONFIG = {
  levels: ['error', 'warn', 'info', 'debug'],
  destinations: ['console', 'cloudwatch', 'file'],
  blockchain: {
    logTransactions: true,
    logBalanceChanges: true,
    logTokenOperations: true,
    logErrors: true
  }
};

function logBlockchainOperation(operation, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    data,
    transactionId: data.transactionId?.toString(),
    accountId: data.accountId?.toString(),
    success: data.success || false
  };
  
  console.log('BLOCKCHAIN_OP:', JSON.stringify(logEntry));
  
  // Send to CloudWatch or other logging service
  if (process.env.NODE_ENV === 'production') {
    sendToCloudWatch(logEntry);
  }
}
```

---

## 🎯 **Implementation Checklist**

### Phase 1: Core Setup
- [ ] Configure Hedera SDK 2.70.0
- [ ] Set up operator account credentials
- [ ] Implement KMS encryption for private keys
- [ ] Create DynamoDB tables for wallet storage
- [ ] Configure JWT authentication

### Phase 2: Token Infrastructure
- [ ] Implement folder token creation
- [ ] Implement file NFT minting
- [ ] Set up metadata schemas
- [ ] Configure token permissions
- [ ] Test token operations

### Phase 3: File Management
- [ ] Build file upload pipeline
- [ ] Implement metadata updates
- [ ] Create folder hierarchy system
- [ ] Add file integrity verification
- [ ] Test various file types

### Phase 4: API Development
- [ ] Create folder management endpoints
- [ ] Build file management endpoints
- [ ] Implement transfer/sharing endpoints
- [ ] Add authentication middleware
- [ ] Test all API endpoints

### Phase 5: Error Handling & Recovery
- [ ] Implement transaction retry logic
- [ ] Add network error handling
- [ ] Create comprehensive logging
- [ ] Test failure scenarios
- [ ] Verify recovery mechanisms

### Phase 6: Testing & Deployment
- [ ] Unit tests for all functions
- [ ] Integration tests for workflows
- [ ] Load testing for scalability
- [ ] Security audit
- [ ] Deploy to testnet

---

## 📚 **Reference Documentation**

### Official Hedera Resources
- [Hedera SDK Documentation](https://docs.hedera.com/)
- [Hedera Testnet Explorer](https://hashscan.io/testnet)
- [Hedera JavaScript SDK](https://github.com/hashgraph/hedera-sdk-js)

### AWS Resources
- [AWS KMS Documentation](https://docs.aws.amazon.com/kms/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [Lambda Node.js Guide](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)

### SafeMate Specific
- Project knowledge contains detailed implementation examples
- Existing API endpoints and infrastructure
- Current environment configuration
- Working code examples and patterns

This comprehensive guide provides all the necessary information for implementing a robust Hedera testnet wallet system for the SafeMate application with hierarchical file management capabilities.