// Hedera NFT Service - Direct blockchain folder creation as NFTs
import { 
  Client, 
  PrivateKey, 
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenUpdateNftsTransaction,
  Hbar,
  AccountId,
  TokenId,
  CustomFee,
  TokenInfoQuery,
  TokenNftInfoQuery,
  NftId
} from '@hashgraph/sdk';
import { hederaConfig } from '../amplify-config';

interface NftFolderMetadata {
  name: string;
  description?: string;
  parentFolderId?: string;
  createdBy: string;
  createdAt: string;
  folderType: 'folder';
  version: string;
}

interface CreateNftFolderResult {
  success: boolean;
  tokenId?: string;
  nftId?: string;
  transactionId?: string;
  folderName?: string;
  network?: string;
  metadata?: NftFolderMetadata;
  timestamp?: string;
  blockchainVerified?: boolean;
  error?: string;
}

interface NftFolderInfo {
  tokenId: string;
  nftId: string;
  name: string;
  metadata: NftFolderMetadata;
  owner: string;
  createdAt: string;
  parentFolderId?: string;
}

export class HederaNftService {
  private client: Client;
  private userPrivateKey: PrivateKey;
  private userAccountId: string;
  private network: 'testnet' | 'mainnet';

  constructor(
    accountId: string, 
    privateKey: string, 
    network: 'testnet' | 'mainnet' = 'testnet'
  ) {
    this.userAccountId = accountId;
    this.userPrivateKey = PrivateKey.fromString(privateKey);
    this.network = network;
    
    // Initialize client directly to Hedera network
    this.client = network === 'testnet' 
      ? Client.forTestnet() 
      : Client.forMainnet();
    
    this.client.setOperator(accountId, this.userPrivateKey);
  }

  /**
   * Create a new folder as an NFT on the Hedera blockchain
   * Based on the SafeMate Hedera SDK Guide patterns
   */
  async createNftFolder(
    folderName: string,
    parentFolderId?: string,
    description?: string
  ): Promise<CreateNftFolderResult> {
    console.log(`🚀 Creating NFT folder: ${folderName}`);
    
    try {
      // Create metadata for the folder (following SafeMate guide pattern)
      const metadata: NftFolderMetadata = {
        name: folderName,
        description: description || `Folder: ${folderName}`,
        parentFolderId,
        createdBy: this.userAccountId,
        createdAt: new Date().toISOString(),
        folderType: 'folder',
        version: '1.0.0'
      };

      // Convert metadata to JSON string (following guide pattern)
      const metadataJson = JSON.stringify(metadata);
      const metadataBytes = Buffer.from(metadataJson);

      console.log('📝 Creating NFT token for folder...');

      // Create the NFT token (following SafeMate guide pattern)
      const tokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName(folderName)
        .setTokenSymbol(folderName.substring(0, 4).toUpperCase()) // Use first 4 chars as symbol
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(1) // Only 1 NFT per folder
        .setTreasuryAccountId(this.userAccountId)
        .setAdminKey(this.userPrivateKey.publicKey)
        .setSupplyKey(this.userPrivateKey.publicKey)
        .setWipeKey(this.userPrivateKey.publicKey)
        .setFreezeKey(this.userPrivateKey.publicKey)
        .setPauseKey(this.userPrivateKey.publicKey)
        .setTokenMemo(`SafeMate folder: ${folderName}`)
        .setMaxTransactionFee(new Hbar(5)); // 5 HBAR max fee

      // Execute token creation
      const tokenCreateResponse = await tokenCreateTransaction.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;

      if (!tokenId) {
        throw new Error('Failed to create NFT token for folder');
      }

      console.log(`✅ NFT token created: ${tokenId.toString()}`);

      // Mint the NFT with metadata (following SafeMate guide pattern)
      console.log('🎨 Minting NFT with folder metadata...');
      
      const tokenMintTransaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([metadataBytes]) // Use array format as per guide
        .setMaxTransactionFee(new Hbar(2)); // 2 HBAR max fee

      const tokenMintResponse = await tokenMintTransaction.execute(this.client);
      const tokenMintReceipt = await tokenMintResponse.getReceipt(this.client);
      const nftId = tokenMintReceipt.serials[0];

      if (!nftId) {
        throw new Error('Failed to mint NFT for folder');
      }

      console.log(`✅ NFT minted with serial: ${nftId}`);

      // Get the full NFT ID
      const fullNftId = new NftId(tokenId, nftId);

      console.log(`🎉 Folder NFT created successfully: ${fullNftId.toString()}`);

      return {
        success: true,
        tokenId: tokenId.toString(),
        nftId: fullNftId.toString(),
        transactionId: tokenCreateResponse.transactionId.toString(),
        folderName,
        network: this.network,
        metadata,
        timestamp: new Date().toISOString(),
        blockchainVerified: true
      };

    } catch (error) {
      console.error('❌ Failed to create NFT folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get NFT folder information
   */
  async getNftFolderInfo(tokenId: string, serialNumber: number): Promise<NftFolderInfo | null> {
    try {
      console.log(`📖 Getting NFT folder info: ${tokenId}:${serialNumber}`);

      const nftId = new NftId(TokenId.fromString(tokenId), serialNumber);
      
      // Query NFT info
      const nftInfoQuery = new TokenNftInfoQuery()
        .setNftId(nftId);

      const nftInfo = await nftInfoQuery.execute(this.client);
      
      if (nftInfo.length === 0) {
        return null;
      }

      const nft = nftInfo[0];
      
      // Parse metadata
      let metadata: NftFolderMetadata;
      try {
        const metadataString = new TextDecoder().decode(nft.metadata);
        metadata = JSON.parse(metadataString);
      } catch (error) {
        console.warn('⚠️ Could not parse NFT metadata, using defaults');
        metadata = {
          name: 'Unknown Folder',
          description: 'Folder metadata not available',
          createdBy: nft.accountId?.toString() || '',
          createdAt: new Date().toISOString(),
          folderType: 'folder',
          version: '1.0'
        };
      }

      return {
        tokenId: tokenId,
        nftId: nftId.toString(),
        name: metadata.name,
        metadata,
        owner: nft.accountId?.toString() || '',
        createdAt: metadata.createdAt,
        parentFolderId: metadata.parentFolderId
      };

    } catch (error) {
      console.error('❌ Failed to get NFT folder info:', error);
      return null;
    }
  }

  /**
   * List all NFT folders owned by the user
   */
  async listUserNftFolders(): Promise<NftFolderInfo[]> {
    try {
      console.log(`📋 Listing NFT folders for user: ${this.userAccountId}`);

      // This would require implementing a more complex query
      // For now, we'll return an empty array as this needs to be implemented
      // with proper token enumeration
      console.log('⚠️ NFT folder listing not yet implemented');
      return [];

    } catch (error) {
      console.error('❌ Failed to list NFT folders:', error);
      return [];
    }
  }

  /**
   * Update NFT folder metadata (following SafeMate guide pattern)
   */
  async updateNftFolderMetadata(
    tokenId: string,
    serialNumber: number,
    updatedMetadata: Partial<NftFolderMetadata>
  ): Promise<boolean> {
    try {
      console.log(`📝 Updating NFT folder metadata: ${tokenId}:${serialNumber}`);

      // Get current metadata first
      const currentInfo = await this.getNftFolderInfo(tokenId, serialNumber);
      if (!currentInfo) {
        throw new Error('NFT folder not found');
      }

      // Update metadata with version increment
      const updatedMetadataFull: NftFolderMetadata = {
        ...currentInfo.metadata,
        ...updatedMetadata,
        version: this.incrementVersion(currentInfo.metadata.version),
        updatedAt: new Date().toISOString()
      };

      // Convert to buffer
      const metadataBytes = Buffer.from(JSON.stringify(updatedMetadataFull));

      // Update NFT metadata (following SafeMate guide pattern)
      const updateTransaction = new TokenUpdateNftsTransaction()
        .setTokenId(TokenId.fromString(tokenId))
        .setSerialNumbers([serialNumber])
        .setMetadata(metadataBytes)
        .setMaxTransactionFee(new Hbar(2));

      const response = await updateTransaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      const success = receipt.status.toString() === 'SUCCESS';
      console.log(`✅ NFT folder metadata updated: ${success}`);

      return success;

    } catch (error) {
      console.error('❌ Failed to update NFT folder metadata:', error);
      return false;
    }
  }

  /**
   * Transfer NFT folder to another account
   */
  async transferNftFolder(
    tokenId: string, 
    serialNumber: number, 
    toAccountId: string
  ): Promise<boolean> {
    try {
      console.log(`🔄 Transferring NFT folder ${tokenId}:${serialNumber} to ${toAccountId}`);

      // This would require implementing NFT transfer
      // For now, we'll throw an error as this needs to be implemented
      throw new Error('NFT folder transfer not yet implemented');

    } catch (error) {
      console.error('❌ Failed to transfer NFT folder:', error);
      return false;
    }
  }

  /**
   * Increment version number (following SafeMate guide pattern)
   */
  private incrementVersion(currentVersion: string): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Validate if the service is properly configured
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Test with a simple token info query
      const testTokenId = TokenId.fromString('0.0.0'); // This will fail but test connection
      const tokenInfoQuery = new TokenInfoQuery().setTokenId(testTokenId);
      
      try {
        await tokenInfoQuery.execute(this.client);
      } catch (error) {
        // Expected to fail, but connection is working
        if (error instanceof Error && error.message.includes('INVALID_TOKEN_ID')) {
          return true; // Connection is working
        }
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('❌ NFT service connection validation failed:', error);
      return false;
    }
  }
}

export default HederaNftService;
