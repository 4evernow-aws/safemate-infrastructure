# SafeMate File Management System Documentation

## 🚀 **Overview**

SafeMate implements a revolutionary file management system where **folders are tokens** and **files are NFTs** on the Hedera blockchain. This system provides:

- ✅ **Direct blockchain storage** of all metadata
- ✅ **Hierarchical folder structure** using tokens
- ✅ **File storage as NFTs** with content verification
- ✅ **Immutable metadata** stored on blockchain
- ✅ **Content integrity verification** using SHA256 hashing
- ✅ **File versioning** with blockchain tracking
- ✅ **Permission system** built into metadata
- ✅ **Cross-platform compatibility** with any file type

---

## 🏗️ **System Architecture**

### **Core Components**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Lambda        │
│   FileManager   │◄──►│   (JWT Auth)     │◄──►│   Functions     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   EnhancedFile  │    │   Cognito        │    │   DynamoDB      │
│   Service       │    │   (Auth)         │    │   (Storage)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Hedera        │    │   KMS            │    │   Hedera        │
│   Network       │    │   (Encryption)   │    │   Testnet       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Data Flow**

1. **User Action** → Frontend FileManager component
2. **API Call** → EnhancedFileService
3. **Authentication** → Cognito JWT verification
4. **Lambda Processing** → Hedera blockchain operations
5. **Metadata Storage** → Token memo (immutable)
6. **Content Storage** → DynamoDB (for quick access)
7. **Verification** → SHA256 hash validation

---

## 📁 **Folder System (Tokens)**

### **How Folders Work**

Each folder in SafeMate is a **NON_FUNGIBLE_UNIQUE token** on Hedera with:

- **Token Name**: `SafeMate Folder: {folderName}`
- **Token Symbol**: `FOLDER`
- **Supply**: 1 (unique folder)
- **Metadata**: Stored in token memo (immutable)

### **Folder Metadata Structure**

```json
{
  "type": "folder",
  "folderId": "uuid-generated",
  "name": "My Documents",
  "userId": "user-123",
  "parentFolderId": "parent-folder-token-id",
  "createdAt": "2024-01-15T10:30:00Z",
  "path": "/folders/parent-folder/My Documents",
  "permissions": ["read", "write", "delete"],
  "owner": "user-123",
  "network": "testnet",
  "version": "2.0",
  "metadataVersion": "2.0",
  "blockchain": {
    "network": "testnet",
    "tokenType": "NON_FUNGIBLE_UNIQUE",
    "supplyType": "FINITE",
    "maxSupply": 1,
    "decimals": 0,
    "metadataLocation": "token_memo",
    "immutable": true
  }
}
```

### **Hierarchical Structure**

```
Root
├── Documents (Token: 0.0.123456)
│   ├── Work (Token: 0.0.123457)
│   │   ├── Reports (Token: 0.0.123458)
│   │   └── Presentations (Token: 0.0.123459)
│   └── Personal (Token: 0.0.123460)
└── Photos (Token: 0.0.123461)
    └── 2024 (Token: 0.0.123462)
```

### **Folder Operations**

| Operation | Description | Blockchain Impact |
|-----------|-------------|-------------------|
| **Create** | Creates new token with metadata | New token minted |
| **List** | Retrieves folder hierarchy | Query existing tokens |
| **Navigate** | Changes current folder context | No blockchain change |
| **Verify** | Checks metadata integrity | Compares blockchain vs DynamoDB |

---

## 📄 **File System (NFTs)**

### **How Files Work**

Each file in SafeMate is a **NON_FUNGIBLE_UNIQUE token** on Hedera with:

- **Token Name**: `SafeMate File: {fileName}`
- **Token Symbol**: `FILE`
- **Supply**: 1 (unique file)
- **Metadata**: Stored in token memo (immutable)
- **Content**: Stored in DynamoDB with hash verification

### **File Metadata Structure**

```json
{
  "type": "file",
  "fileId": "uuid-generated",
  "name": "document.pdf",
  "userId": "user-123",
  "folderTokenId": "parent-folder-token-id",
  "createdAt": "2024-01-15T10:30:00Z",
  "contentHash": "sha256-hash-of-content",
  "contentSize": 1024000,
  "contentType": "application/pdf",
  "contentEncoding": "base64",
  "permissions": ["read", "write", "delete"],
  "owner": "user-123",
  "network": "testnet",
  "version": "1.0",
  "metadataVersion": "2.0",
  "blockchain": {
    "network": "testnet",
    "tokenType": "NON_FUNGIBLE_UNIQUE",
    "supplyType": "FINITE",
    "maxSupply": 1,
    "decimals": 0,
    "contentVerification": {
      "algorithm": "SHA256",
      "hash": "sha256-hash-of-content",
      "size": 1024000
    },
    "metadataLocation": "token_memo",
    "immutable": true
  }
}
```

### **File Versioning**

When a file is updated, a new version is created with:

```json
{
  "version": "2.0",
  "updatedAt": "2024-01-16T14:30:00Z",
  "isVersioned": true,
  "previousVersion": "original-token-id",
  "versionHistory": [
    {
      "version": "1.0",
      "timestamp": "2024-01-15T10:30:00Z",
      "contentHash": "previous-hash"
    }
  ]
}
```

### **File Operations**

| Operation | Description | Blockchain Impact |
|-----------|-------------|-------------------|
| **Upload** | Creates new NFT with content | New token minted |
| **Download** | Retrieves file content | No blockchain change |
| **Update** | Creates new version | NFT metadata updated |
| **Verify** | Checks content integrity | SHA256 hash validation |
| **List** | Shows files in folder | Query existing tokens |

---

## 🔗 **API Endpoints**

### **Folder Management**

```typescript
// Create folder
POST /folders
{
  "name": "My Folder",
  "parentFolderId": "optional-parent-token-id",
  "metadata": { "custom": "data" }
}

// List folders
GET /folders
// Returns: { folders: FolderInfo[], folderTree: FolderInfo[] }

// List files in folder
GET /folders/{folderTokenId}
// Returns: { files: FileInfo[] }

// Update folder
PUT /folders/{folderTokenId}
{
  "folderName": "Updated Name"
}

// Delete folder
DELETE /folders/{folderTokenId}
```

### **File Management**

```typescript
// Upload file
POST /files/upload
{
  "fileName": "document.pdf",
  "fileData": "base64-encoded-content",
  "fileSize": 1024000,
  "contentType": "application/pdf",
  "folderId": "folder-token-id",
  "version": "1.0",
  "metadata": { "custom": "data" }
}

// Get file content
GET /files/{fileTokenId}
// Returns: FileContent with verification

// Update file
PUT /files/{fileTokenId}
{
  "fileData": "new-base64-content",
  "version": "2.0",
  "fileName": "Updated Name"
}
```

### **Metadata & Verification**

```typescript
// Get blockchain metadata
GET /metadata/{tokenId}
// Returns: BlockchainMetadata

// Verify integrity
GET /verify/{tokenId}
// Returns: IntegrityVerification
```

---

## 🔐 **Security Features**

### **Content Verification**

Every file upload includes:

1. **SHA256 Hash Calculation**: Content is hashed for integrity
2. **Blockchain Storage**: Hash stored in token metadata
3. **Download Verification**: Hash verified on download
4. **Tamper Detection**: Any content change detected

### **Permission System**

Built into metadata:

```json
{
  "permissions": ["read", "write", "delete"],
  "owner": "user-123",
  "userId": "user-123"
}
```

### **KMS Encryption**

- Private keys encrypted with AWS KMS
- Secure wallet creation and management
- Operator account protection

---

## 🎯 **Frontend Integration**

### **FileManager Component**

The main file management interface provides:

- **Folder Navigation**: Breadcrumb navigation
- **File Upload**: Drag & drop or file picker
- **Context Menus**: Right-click actions
- **Integrity Verification**: Blockchain verification
- **Download**: Direct file download
- **Metadata Viewing**: Blockchain metadata display

### **EnhancedFileService**

TypeScript service for all file operations:

```typescript
// Create folder
const result = await EnhancedFileService.createFolder({
  name: "My Folder",
  parentFolderId: "parent-token-id"
});

// Upload file
const result = await EnhancedFileService.uploadFile(
  file, 
  folderTokenId, 
  metadata
);

// List folders
const result = await EnhancedFileService.listFolders();

// Verify integrity
const result = await EnhancedFileService.verifyMetadataIntegrity(tokenId);
```

---

## 🔧 **Technical Implementation**

### **Backend Services**

1. **Enhanced File Management Module** (`enhanced-file-management.js`)
   - Complete folder and file operations
   - Blockchain integration
   - Metadata management

2. **Hedera Service** (`index.js`)
   - Token creation and management
   - Account operations
   - Transaction handling

### **Frontend Services**

1. **EnhancedFileService** (`enhancedFileService.ts`)
   - TypeScript interface for all operations
   - Error handling and validation
   - File conversion utilities

2. **FileManager Component** (`FileManager.tsx`)
   - React component for UI
   - State management
   - User interactions

### **Database Schema**

#### **Folders Table** (`SAFEMATE_FOLDERS_TABLE`)

```json
{
  "tokenId": "0.0.123456",
  "folderId": "uuid-generated",
  "userId": "user-123",
  "folderName": "My Documents",
  "parentFolderId": "parent-token-id",
  "tokenType": "folder",
  "network": "testnet",
  "transactionId": "tx-hash",
  "createdAt": "2024-01-15T10:30:00Z",
  "metadata": { "complete": "metadata" },
  "blockchainVerified": true,
  "metadataLocation": "token_memo",
  "lastVerified": "2024-01-15T10:30:00Z"
}
```

#### **Files Table** (`SAFEMATE_FILES_TABLE`)

```json
{
  "tokenId": "0.0.123457",
  "fileId": "uuid-generated",
  "userId": "user-123",
  "folderTokenId": "folder-token-id",
  "fileName": "document.pdf",
  "fileContent": "base64-encoded-content",
  "tokenType": "file",
  "network": "testnet",
  "transactionId": "tx-hash",
  "createdAt": "2024-01-15T10:30:00Z",
  "metadata": { "complete": "metadata" },
  "version": "1.0",
  "blockchainVerified": true,
  "metadataLocation": "token_memo",
  "contentHash": "sha256-hash",
  "lastVerified": "2024-01-15T10:30:00Z"
}
```

---

## 🚀 **Usage Examples**

### **Creating a Folder Structure**

```typescript
// Create root folder
const documents = await EnhancedFileService.createFolder({
  name: "Documents"
});

// Create subfolder
const work = await EnhancedFileService.createFolder({
  name: "Work",
  parentFolderId: documents.tokenId
});

// Create sub-subfolder
const reports = await EnhancedFileService.createFolder({
  name: "Reports",
  parentFolderId: work.tokenId
});
```

### **Uploading Files**

```typescript
// Upload to specific folder
const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
const result = await EnhancedFileService.uploadFile(file, reports.tokenId, {
  category: 'monthly',
  priority: 'high'
});
```

### **Verifying Integrity**

```typescript
// Verify file integrity
const verification = await EnhancedFileService.verifyMetadataIntegrity(file.tokenId);
if (verification.integrityValid) {
  console.log('File integrity verified!');
} else {
  console.error('Integrity check failed!');
}
```

### **Downloading Files**

```typescript
// Download file
await EnhancedFileService.downloadFile(file.tokenId, 'custom-name.pdf');
```

---

## 🔍 **Blockchain Verification**

### **Metadata Verification**

Every operation includes blockchain verification:

1. **Token Creation**: Metadata stored in token memo
2. **Content Hash**: SHA256 hash of file content
3. **Integrity Check**: Compare blockchain vs DynamoDB
4. **Version Tracking**: Complete version history

### **Verification Process**

```typescript
// 1. Get blockchain metadata
const blockchain = await EnhancedFileService.getBlockchainMetadata(tokenId);

// 2. Verify integrity
const integrity = await EnhancedFileService.verifyMetadataIntegrity(tokenId);

// 3. Check content hash
const content = await EnhancedFileService.getFileContent(tokenId);
if (content.hashVerified) {
  console.log('Content integrity verified!');
}
```

---

## 📊 **Performance Considerations**

### **Optimizations**

1. **DynamoDB Caching**: Quick access to file content
2. **Blockchain Metadata**: Immutable metadata on blockchain
3. **Content Verification**: Hash-based integrity checks
4. **Lazy Loading**: Load content only when needed

### **Limitations**

1. **File Size**: Base64 encoding increases size by ~33%
2. **Transaction Costs**: Hedera transaction fees apply
3. **Network Latency**: Blockchain operations take time
4. **Storage Costs**: DynamoDB storage for file content

---

## 🔮 **Future Enhancements**

### **Planned Features**

1. **File Sharing**: Permission-based sharing system
2. **Collaboration**: Multi-user editing capabilities
3. **Search**: Full-text search across files
4. **Backup**: Automated backup to IPFS
5. **Compression**: File compression before storage
6. **Encryption**: End-to-end file encryption

### **Scalability Improvements**

1. **Chunked Uploads**: Large file support
2. **Batch Operations**: Multiple file operations
3. **CDN Integration**: Content delivery optimization
4. **Caching Layer**: Redis-based caching

---

## 🎯 **Conclusion**

SafeMate's file management system represents a **revolutionary approach** to file storage by:

- **Leveraging blockchain** for immutable metadata
- **Using tokens as folders** for hierarchical organization
- **Storing files as NFTs** with content verification
- **Providing direct blockchain integration** for all operations
- **Ensuring data integrity** through cryptographic verification

This system provides **unprecedented security, transparency, and reliability** for file management while maintaining the familiar user experience of traditional file systems.

---

## 📚 **References**

- [Hedera Token Service Documentation](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service)
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [SHA256 Hash Algorithm](https://en.wikipedia.org/wiki/SHA-2)
- [Base64 Encoding](https://en.wikipedia.org/wiki/Base64)
