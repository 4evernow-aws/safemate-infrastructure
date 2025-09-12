# SafeMate Blockchain-Only Storage Implementation Guide

## 🎯 **Overview**

SafeMate now supports **Complete Blockchain-Only Storage** where both file content AND metadata are stored directly on the Hedera blockchain in immutable token memos, providing maximum security and decentralization.

## 🔧 **Storage Strategy Comparison**

### **Previous: Hybrid Storage**
```
DynamoDB: File content + metadata
Blockchain: Metadata + content hash
```

### **Current: Complete Blockchain-Only Storage**
```
DynamoDB: Minimal reference only (no content, no metadata)
Blockchain: File content + metadata (immutable)
```

## 📊 **Implementation Details**

### **File Creation Process**

1. **Content Processing**
   ```javascript
   const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
   ```

2. **Blockchain Storage Object**
   ```javascript
   const blockchainStorage = {
     metadata: fileMetadata,
     content: fileContent, // ACTUAL FILE CONTENT
     contentHash: contentHash,
     timestamp: new Date().toISOString()
   };
   ```

3. **Token Creation**
   ```javascript
   const transaction = new TokenCreateTransaction()
     .setMemo(JSON.stringify(blockchainStorage)) // Content + metadata
     .setTokenName(fileName)
     .setTokenSymbol('FILE')
     // ... other token properties
   ```

4. **DynamoDB Reference (Minimal)**
   ```javascript
   const fileRecord = {
     tokenId: tokenId.toString(),
     userId: userId,
     fileName: fileName,
     contentHash: contentHash,
     contentSize: fileContent.length,
     // NO fileContent field
     // NO metadata field
     storageType: 'blockchain_only',
     metadataLocation: 'blockchain_only',
     contentLocation: 'blockchain_only'
   };
   ```

### **File Retrieval Process**

1. **DynamoDB Lookup (Reference Only)**
   ```javascript
   const fileRecord = await dynamodb.get({ tokenId: fileTokenId });
   // Contains only basic info, no content or metadata
   ```

2. **Blockchain Content & Metadata Retrieval**
   ```javascript
   const tokenInfo = await new TokenInfoQuery()
     .setTokenId(TokenId.fromString(fileTokenId))
     .execute(client);
   
   const blockchainStorage = JSON.parse(tokenInfo.memo);
   const fileContent = blockchainStorage.content; // Content from blockchain
   const metadata = blockchainStorage.metadata; // Metadata from blockchain
   ```

## 🔒 **Security Features**

### **Content & Metadata Integrity**
- **SHA256 Hash Verification**: Content verified against blockchain hash
- **Immutable Storage**: Content AND metadata cannot be modified once stored
- **Decentralized**: No reliance on centralized storage for any data
- **Complete Audit Trail**: All data changes recorded on blockchain

### **Access Control**
- **Cognito Authentication**: User-based access control
- **IAM Policies**: AWS service-level permissions
- **Token Ownership**: Blockchain-level ownership verification

## 📈 **Performance Considerations**

### **Advantages**
- ✅ **Maximum Security**: All data stored on immutable blockchain
- ✅ **Complete Decentralization**: No reliance on centralized storage
- ✅ **Full Audit Trail**: Complete transaction history for all data
- ✅ **Tamper-Proof**: Content AND metadata cannot be modified
- ✅ **Single Source of Truth**: Blockchain is the only data source

### **Trade-offs**
- ⚠️ **Slower Retrieval**: Blockchain queries take 2-5 seconds
- ⚠️ **Higher Costs**: Blockchain transaction fees for all operations
- ⚠️ **Size Limits**: Hedera memo size limitations
- ⚠️ **Network Dependency**: Requires Hedera network access

## 🛠️ **API Endpoints**

### **File Upload (Complete Blockchain-Only)**
```http
POST /files/upload
Content-Type: application/json

{
  "fileName": "document.txt",
  "fileData": "File content stored on blockchain",
  "fileSize": 100,
  "contentType": "text/plain",
  "folderId": "0.0.123456",
  "version": "1.0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokenId": "0.0.789012",
    "transactionId": "0.0.123456@1234567890.123456789",
    "fileName": "document.txt",
    "storageType": "blockchain_only",
    "contentHash": "abc123...",
    "contentSize": 100,
    "metadataLocation": "blockchain_only",
    "contentLocation": "blockchain_only",
    "note": "File content and metadata stored on Hedera blockchain for maximum security"
  }
}
```

### **File Retrieval (From Blockchain)**
```http
GET /files/{fileTokenId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileName": "document.txt",
    "fileContent": "File content stored on blockchain",
    "tokenId": "0.0.789012",
    "storageType": "blockchain_only",
    "contentHash": "abc123...",
    "contentSize": 100,
    "blockchainVerified": true,
    "metadata": { /* Full metadata from blockchain */ },
    "note": "Content and metadata retrieved from Hedera blockchain"
  }
}
```

### **Integrity Verification**
```http
GET /verify/{fileTokenId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "integrityValid": true,
    "storageType": "blockchain_only",
    "contentHash": "abc123...",
    "calculatedHash": "abc123...",
    "contentSize": 100,
    "dynamoHasMetadata": false,
    "note": "Content verified against blockchain hash, metadata only on blockchain"
  }
}
```

## 🔄 **Migration from Hybrid Storage**

### **Legacy File Support**
The system maintains backward compatibility with legacy files:

- **Legacy Files**: Content and metadata stored in DynamoDB
- **New Files**: Content and metadata stored on blockchain only
- **Automatic Detection**: System detects storage type automatically

### **Storage Type Detection**
```javascript
if (result.Item.storageType === 'blockchain_only') {
  // Retrieve from blockchain
  const blockchainStorage = JSON.parse(tokenInfo.memo);
  return {
    content: blockchainStorage.content,
    metadata: blockchainStorage.metadata
  };
} else {
  // Legacy: retrieve from DynamoDB
  return {
    content: result.Item.fileContent,
    metadata: result.Item.metadata
  };
}
```

## 📋 **Configuration**

### **Environment Variables**
```bash
HEDERA_NETWORK=testnet
SAFEMATE_FILES_TABLE=default-safemate-files
WALLET_KEYS_TABLE=default-safemate-wallet-keys
APP_SECRETS_KMS_KEY_ID=arn:aws:kms:...
```

### **DynamoDB Schema (Complete Blockchain-Only)**
```json
{
  "tokenId": "0.0.789012",
  "userId": "user123",
  "folderTokenId": "0.0.123456",
  "fileName": "document.txt",
  "contentHash": "abc123...",
  "contentSize": 100,
  "tokenType": "file",
  "network": "testnet",
  "transactionId": "0.0.123456@1234567890.123456789",
  "createdAt": "2025-08-22T10:00:00.000Z",
  "storageType": "blockchain_only",
  "blockchainVerified": true,
  "metadataLocation": "blockchain_only",
  "contentLocation": "blockchain_only"
  // NO fileContent field
  // NO metadata field
}
```

## 🚀 **Testing**

### **Test Script**
Run the complete blockchain-only storage test:
```powershell
.\test-blockchain-only-api.ps1
```

### **Test Scenarios**
1. **File Upload**: Content and metadata stored on blockchain
2. **File Retrieval**: Content and metadata retrieved from blockchain
3. **Integrity Check**: Hash verification
4. **Metadata Access**: Blockchain metadata retrieval
5. **DynamoDB Verification**: Confirm no metadata in DynamoDB
6. **Legacy Compatibility**: Backward compatibility testing

## 🎯 **Best Practices**

### **File Size Limits**
- **Recommended**: < 1KB for optimal performance
- **Maximum**: Limited by Hedera memo size (~4KB)
- **Large Files**: Consider chunking or IPFS integration

### **Content Types**
- **Text Files**: Optimal for blockchain storage
- **Binary Files**: Base64 encoding required
- **Large Files**: Consider hybrid approach

### **Security Considerations**
- **Private Keys**: Securely managed via AWS KMS
- **Access Control**: Implement proper authentication
- **Audit Logging**: Monitor all blockchain operations

## 🔮 **Future Enhancements**

### **Planned Features**
- **IPFS Integration**: For larger files
- **Content Chunking**: Split large files across multiple tokens
- **Compression**: Reduce blockchain storage costs
- **Caching Layer**: Improve retrieval performance

### **Scalability Improvements**
- **Batch Operations**: Multiple file operations
- **Async Processing**: Background blockchain operations
- **CDN Integration**: Content delivery optimization

---

## 📞 **Support**

For questions about complete blockchain-only storage implementation:
- **Documentation**: Check this guide and API documentation
- **Testing**: Use the provided test scripts
- **Issues**: Review CloudWatch logs for debugging
