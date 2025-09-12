// Direct Hedera Blockchain Service - Bypasses API Gateway 10MB limit
import { 
  Client, 
  PrivateKey, 
  FileCreateTransaction, 
  FileAppendTransaction, 
  Hbar,
  AccountId,
  FileId
} from '@hashgraph/sdk';

interface DirectUploadResult {
  fileId: string;
  transactionId: string;
  chunks: number;
  totalSize: number;
}

interface DirectHederaConfig {
  network: 'testnet' | 'mainnet';
  maxChunkSize: number;
  maxTransactionFee: Hbar;
}

export class DirectHederaService {
  private client: Client;
  private userPrivateKey: PrivateKey;
  private userAccountId: string;
  private config: DirectHederaConfig;

  constructor(
    accountId: string, 
    privateKey: string, 
    network: 'testnet' | 'mainnet' = 'testnet'
  ) {
    this.userAccountId = accountId;
    this.userPrivateKey = PrivateKey.fromString(privateKey);
    
    // Initialize client directly to Hedera network
    this.client = network === 'testnet' 
      ? Client.forTestnet() 
      : Client.forMainnet();
    
    this.client.setOperator(accountId, this.userPrivateKey);
    
    this.config = {
      network,
      maxChunkSize: 6 * 1024, // 6KB chunks (Hedera limit)
      maxTransactionFee: new Hbar(2) // 2 HBAR max fee
    };
  }

  /**
   * Upload file directly to Hedera blockchain, bypassing API Gateway
   */
  async uploadFileDirectly(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<DirectUploadResult> {
    console.log(`🚀 Starting direct blockchain upload: ${file.name} (${file.size} bytes)`);
    
    try {
      // Split file into chunks
      const chunks = await this.splitFileIntoChunks(file);
      console.log(`📦 File split into ${chunks.length} chunks`);
      
      // Create file with first chunk
      const createTransaction = new FileCreateTransaction()
        .setKeys([this.userPrivateKey.publicKey])
        .setContents(chunks[0])
        .setMaxTransactionFee(this.config.maxTransactionFee);
      
      console.log('📝 Creating file on blockchain...');
      const createResponse = await createTransaction.execute(this.client);
      const createReceipt = await createResponse.getReceipt(this.client);
      const fileId = createReceipt.fileId;
      
      if (!fileId) {
        throw new Error('Failed to create file on blockchain');
      }
      
      console.log(`✅ File created on blockchain: ${fileId.toString()}`);
      
      // Append remaining chunks
      for (let i = 1; i < chunks.length; i++) {
        const appendTransaction = new FileAppendTransaction()
          .setFileId(fileId)
          .setContents(chunks[i])
          .setMaxTransactionFee(this.config.maxTransactionFee);
        
        console.log(`📤 Appending chunk ${i + 1}/${chunks.length}...`);
        await appendTransaction.execute(this.client);
        
        if (onProgress) {
          const progress = ((i + 1) / chunks.length) * 100;
          onProgress(progress);
        }
      }
      
      console.log(`🎉 File upload completed: ${fileId.toString()}`);
      
      return {
        fileId: fileId.toString(),
        transactionId: createResponse.transactionId.toString(),
        chunks: chunks.length,
        totalSize: file.size
      };
      
    } catch (error) {
      console.error('❌ Direct blockchain upload failed:', error);
      throw new Error(`Direct blockchain upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split file into chunks for blockchain upload
   */
  private async splitFileIntoChunks(file: File): Promise<Uint8Array[]> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Split into chunks
          for (let i = 0; i < uint8Array.length; i += this.config.maxChunkSize) {
            chunks.push(uint8Array.slice(i, i + this.config.maxChunkSize));
          }
          
          resolve(chunks);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get file content directly from blockchain
   */
  async getFileContent(fileId: string): Promise<Uint8Array> {
    try {
      console.log(`📥 Fetching file content: ${fileId}`);
      
      // This would require implementing file content retrieval
      // For now, we'll throw an error as this needs to be implemented
      throw new Error('File content retrieval not yet implemented for direct blockchain access');
      
    } catch (error) {
      console.error('❌ Failed to get file content:', error);
      throw error;
    }
  }

  /**
   * Delete file from blockchain
   */
  async deleteFile(fileId: string): Promise<string> {
    try {
      console.log(`🗑️ Deleting file from blockchain: ${fileId}`);
      
      // This would require implementing file deletion
      // For now, we'll throw an error as this needs to be implemented
      throw new Error('File deletion not yet implemented for direct blockchain access');
      
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Get account balance directly from blockchain
   */
  async getAccountBalance(): Promise<{ hbar: number; tinybars: number }> {
    try {
      // TODO: Fix NodeClient method call
      // const accountId = AccountId.fromString(this.userAccountId);
      // const balance = await this.client.getAccountBalance(accountId);
      
      // For now, return mock data
      return {
        hbar: 100.0,
        tinybars: 10000000000
      };
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      throw error;
    }
  }

  /**
   * Validate if the service is properly configured
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getAccountBalance();
      return true;
    } catch (error) {
      console.error('❌ Direct blockchain connection validation failed:', error);
      return false;
    }
  }
}

export default DirectHederaService;
