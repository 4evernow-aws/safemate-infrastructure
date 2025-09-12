import { hederaConfig } from '../amplify-config';
import { config } from '../config/environment';
import { UserService } from './userService';
import { SecureWalletService } from './secureWalletService';

export interface FolderMetadata {
  type: 'folder';
  folderId: string;
  name: string;
  userId: string;
  parentFolderId?: string;
  createdAt: string;
  path: string;
  permissions: string[];
  owner: string;
  network: string;
  version: string;
  metadataVersion: string;
  blockchain: {
    network: string;
    tokenType: string;
    supplyType: string;
    maxSupply: number;
    decimals: number;
    metadataLocation: string;
    immutable: boolean;
  };
  [key: string]: any; // Allow custom metadata
}

export interface FileMetadata {
  type: 'file';
  fileId: string;
  name: string;
  userId: string;
  folderTokenId: string;
  createdAt: string;
  contentHash: string;
  contentSize: number;
  contentType: string;
  contentEncoding: string;
  permissions: string[];
  owner: string;
  network: string;
  version: string;
  metadataVersion: string;
  blockchain: {
    network: string;
    tokenType: string;
    supplyType: string;
    maxSupply: number;
    decimals: number;
    contentVerification: {
      algorithm: string;
      hash: string;
      size: number;
    };
    metadataLocation: string;
    immutable: boolean;
  };
  [key: string]: any; // Allow custom metadata
}

export interface FolderInfo {
  tokenId: string;
  folderId: string;
  folderName: string;
  parentFolderId?: string;
  createdAt: string;
  transactionId: string;
  network: string;
  metadata: FolderMetadata;
  blockchainVerified: boolean;
  children?: FolderInfo[];
}

export interface FileInfo {
  tokenId: string;
  fileId: string;
  fileName: string;
  folderTokenId: string;
  createdAt: string;
  updatedAt?: string;
  transactionId: string;
  network: string;
  version: string;
  contentSize: number;
  contentType: string;
  contentHash: string;
  metadata: FileMetadata;
  blockchainVerified: boolean;
}

export interface FileContent {
  success: boolean;
  fileName: string;
  fileContent: string;
  tokenId: string;
  fileId: string;
  createdAt: string;
  updatedAt?: string;
  version: string;
  metadata: FileMetadata;
  contentHash: string;
  hashVerified: boolean;
  contentType: string;
  error?: string;
}

export interface BlockchainMetadata {
  success: boolean;
  metadata: FolderMetadata | FileMetadata;
  tokenInfo: {
    tokenId: string;
    name: string;
    symbol: string;
    totalSupply: string;
    treasury: string;
    memo: string;
    tokenType: number;
    supplyType: number;
    maxSupply: string;
    decimals: number;
  };
  error?: string;
}

export interface IntegrityVerification {
  success: boolean;
  integrityValid: boolean;
  blockchainMetadata: FolderMetadata | FileMetadata;
  dynamoMetadata: FolderMetadata | FileMetadata;
  tableName: string;
  tokenInfo: any;
  verificationTimestamp: string;
  error?: string;
}

export interface CreateFolderRequest {
  name: string;
  parentFolderId?: string;
  metadata?: Record<string, any>;
}

export interface CreateFileRequest {
  fileName: string;
  fileData: string; // base64 encoded
  fileSize?: number;
  contentType?: string;
  folderId: string;
  version?: string;
  metadata?: Record<string, any>;
}

export interface UpdateFileRequest {
  fileData: string; // base64 encoded
  version: string;
  fileName?: string;
  metadata?: Record<string, any>;
}

export class EnhancedFileService {
  private static readonly API_BASE_URL = (import.meta as any).env.VITE_HEDERA_API_URL || 'https://527ye7o1j0.execute-api.ap-southeast-2.amazonaws.com/default';
  private static readonly NETWORK = hederaConfig.currentNetwork as 'testnet' | 'mainnet';

  /**
   * Create a new folder (token) on the blockchain
   */
  static async createFolder(request: CreateFolderRequest): Promise<{
    success: boolean;
    tokenId?: string;
    folderId?: string;
    transactionId?: string;
    folderName?: string;
    network?: string;
    metadata?: FolderMetadata;
    timestamp?: string;
    blockchainVerified?: boolean;
    metadataLocation?: string;
    error?: string;
  }> {
    console.log('🔧 EnhancedFileService: Creating folder:', request);
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/folders`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: request.name,
          parentFolderId: request.parentFolderId,
          metadata: request.metadata || {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create folder: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: Folder created successfully:', result);
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to create folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all folders for the current user
   */
  static async listFolders(): Promise<{
    success: boolean;
    folders?: FolderInfo[];
    folderTree?: FolderInfo[];
    error?: string;
  }> {
    console.log('🔍 EnhancedFileService: Listing folders');
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/folders`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list folders: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: Folders retrieved successfully:', result);
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to list folders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new file (NFT) on the blockchain
   */
  static async createFile(request: CreateFileRequest): Promise<{
    success: boolean;
    tokenId?: string;
    fileId?: string;
    transactionId?: string;
    fileName?: string;
    network?: string;
    metadata?: FileMetadata;
    contentHash?: string;
    timestamp?: string;
    blockchainVerified?: boolean;
    metadataLocation?: string;
    error?: string;
  }> {
    console.log('🔧 EnhancedFileService: Creating file:', request.fileName);
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/files/upload`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fileName: request.fileName,
          fileData: request.fileData,
          fileSize: request.fileSize || Buffer.from(request.fileData, 'base64').length,
          contentType: request.contentType,
          folderId: request.folderId,
          version: request.version || '1.0',
          metadata: request.metadata || {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create file: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: File created successfully:', result);
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to create file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List files in a specific folder
   */
  static async listFilesInFolder(folderTokenId: string): Promise<{
    success: boolean;
    files?: FileInfo[];
    error?: string;
  }> {
    console.log('🔍 EnhancedFileService: Listing files in folder:', folderTokenId);
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/folders/${folderTokenId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list files: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: Files retrieved successfully:', result);
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to list files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get file content with verification
   */
  static async getFileContent(fileTokenId: string): Promise<FileContent> {
    console.log('📄 EnhancedFileService: Getting file content:', fileTokenId);
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/files/${fileTokenId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get file content: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: File content retrieved successfully');
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to get file content:', error);
      return {
        success: false,
        fileName: '',
        fileContent: '',
        tokenId: '',
        fileId: '',
        createdAt: new Date().toISOString(),
        version: '1.0',
        metadata: {
          type: 'file',
          fileId: '',
          name: '',
          userId: '',
          folderTokenId: '',
          createdAt: new Date().toISOString(),
          contentHash: '',
          contentSize: 0,
          contentType: '',
          contentEncoding: '',
          permissions: [],
          owner: '',
          network: 'testnet',
          version: '1.0',
          metadataVersion: '1.0',
          blockchain: {
            network: 'testnet',
            tokenType: 'FUNGIBLE_COMMON',
            supplyType: 'INFINITE',
            maxSupply: 0,
            decimals: 0,
            contentVerification: {
              algorithm: 'SHA256',
              hash: '',
              size: 0
            },
            metadataLocation: '',
            immutable: false
          }
        },
        contentHash: '',
        hashVerified: false,
        contentType: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update file content and create new version
   */
  static async updateFile(fileTokenId: string, request: UpdateFileRequest): Promise<{
    success: boolean;
    tokenId?: string;
    transactionId?: string;
    network?: string;
    updatedAt?: string;
    metadata?: FileMetadata;
    contentHash?: string;
    error?: string;
  }> {
    console.log('🔄 EnhancedFileService: Updating file:', fileTokenId);
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/files/${fileTokenId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fileData: request.fileData,
          version: request.version,
          fileName: request.fileName,
          metadata: request.metadata || {}
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update file: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: File updated successfully:', result);
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to update file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get metadata directly from blockchain
   */
  static async getBlockchainMetadata(tokenId: string): Promise<BlockchainMetadata> {
    console.log('🔍 EnhancedFileService: Getting blockchain metadata:', tokenId);
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/metadata/${tokenId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get blockchain metadata: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: Blockchain metadata retrieved successfully');
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to get blockchain metadata:', error);
      return {
        success: false,
        metadata: {
          type: 'folder',
          folderId: '',
          name: '',
          userId: '',
          createdAt: new Date().toISOString(),
          path: '',
          permissions: [],
          owner: '',
          network: 'testnet',
          version: '1.0',
          metadataVersion: '1.0',
          blockchain: {
            network: 'testnet',
            tokenType: 'FUNGIBLE_COMMON',
            supplyType: 'INFINITE',
            maxSupply: 0,
            decimals: 0,
            metadataLocation: '',
            immutable: false
          }
        },
        tokenInfo: {
          tokenId: '',
          name: '',
          symbol: '',
          totalSupply: '',
          treasury: '',
          memo: '',
          tokenType: 0,
          supplyType: 0,
          maxSupply: '',
          decimals: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify metadata integrity between blockchain and DynamoDB
   */
  static async verifyMetadataIntegrity(tokenId: string): Promise<IntegrityVerification> {
    console.log('🔍 EnhancedFileService: Verifying metadata integrity:', tokenId);
    
    try {
      const token = await UserService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${this.API_BASE_URL}/verify/${tokenId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to verify metadata integrity: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ EnhancedFileService: Metadata integrity verified successfully');
      
      return result.data || result;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to verify metadata integrity:', error);
      return {
        success: false,
        integrityValid: false,
        blockchainMetadata: {
          type: 'folder',
          folderId: '',
          name: '',
          userId: '',
          createdAt: new Date().toISOString(),
          path: '',
          permissions: [],
          owner: '',
          network: 'testnet',
          version: '1.0',
          metadataVersion: '1.0',
          blockchain: {
            network: 'testnet',
            tokenType: 'FUNGIBLE_COMMON',
            supplyType: 'INFINITE',
            maxSupply: 0,
            decimals: 0,
            metadataLocation: '',
            immutable: false
          }
        },
        dynamoMetadata: {
          type: 'folder',
          folderId: '',
          name: '',
          userId: '',
          createdAt: new Date().toISOString(),
          path: '',
          permissions: [],
          owner: '',
          network: 'testnet',
          version: '1.0',
          metadataVersion: '1.0',
          blockchain: {
            network: 'testnet',
            tokenType: 'FUNGIBLE_COMMON',
            supplyType: 'INFINITE',
            maxSupply: 0,
            decimals: 0,
            metadataLocation: '',
            immutable: false
          }
        },
        tableName: '',
        tokenInfo: {},
        verificationTimestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload a file from the frontend
   */
  static async uploadFile(file: File, folderTokenId: string, metadata?: Record<string, any>): Promise<{
    success: boolean;
    tokenId?: string;
    fileId?: string;
    transactionId?: string;
    fileName?: string;
    network?: string;
    metadata?: FileMetadata;
    contentHash?: string;
    timestamp?: string;
    blockchainVerified?: boolean;
    metadataLocation?: string;
    error?: string;
  }> {
    console.log('📤 EnhancedFileService: Uploading file:', file.name);
    
    try {
      // Convert file to base64
      const base64Data = await this.fileToBase64(file);
      
      const request: CreateFileRequest = {
        fileName: file.name,
        fileData: base64Data,
        fileSize: file.size,
        contentType: file.type,
        folderId: folderTokenId,
        version: '1.0',
        metadata: {
          originalFileName: file.name,
          originalFileSize: file.size,
          originalFileType: file.type,
          uploadTimestamp: new Date().toISOString(),
          ...metadata
        }
      };

      return await this.createFile(request);
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to upload file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert file to base64
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Download file content
   */
  static async downloadFile(fileTokenId: string, fileName?: string): Promise<void> {
    console.log('📥 EnhancedFileService: Downloading file:', fileTokenId);
    
    try {
      const fileContent = await this.getFileContent(fileTokenId);
      
      if (!fileContent.success || !fileContent.fileContent) {
        throw new Error('Failed to get file content');
      }

      // Convert base64 to blob
      const byteCharacters = atob(fileContent.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileContent.contentType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || fileContent.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ EnhancedFileService: File downloaded successfully');
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to download file:', error);
      throw error;
    }
  }

  /**
   * Get file type icon based on content type
   */
  static getFileTypeIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.startsWith('video/')) return '🎥';
    if (contentType.startsWith('audio/')) return '🎵';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📈';
    if (contentType.includes('text/')) return '📄';
    if (contentType.includes('json')) return '📋';
    if (contentType.includes('xml')) return '📋';
    if (contentType.includes('zip') || contentType.includes('compressed')) return '📦';
    return '📄';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if user has wallet (required for file operations)
   */
  static async checkWalletStatus(): Promise<boolean> {
    try {
      const hasWallet = await SecureWalletService.hasSecureWallet();
      console.log('🔍 EnhancedFileService: Wallet status check:', hasWallet);
      return hasWallet;
    } catch (error) {
      console.error('❌ EnhancedFileService: Failed to check wallet status:', error);
      return false;
    }
  }
}

export default EnhancedFileService;
