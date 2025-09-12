/**
 * Consolidated Wallet Service for SafeMate
 * 
 * This service consolidates all wallet-related functionality from:
 * - secureWalletService.ts (KMS-enhanced operations)
 * - walletService.ts (basic wallet operations)
 * - hederaApiService.ts (direct blockchain operations)
 * 
 * Provides a unified API for all wallet operations with clear separation of concerns.
 */

import { hederaConfig } from '../amplify-config';
import { config } from '../config/environment';
import { UserService } from './userService';
import { TokenService } from './tokenService';
import type {
  HederaWallet,
  WalletMetadata,
  WalletCreationRequest,
  WalletCreationResponse,
  WalletCreationStatus,
  WalletCreationState,
  HederaTransaction,
  WalletBalance,
  WalletOperationResult
} from '../types/wallet';

// =======================
// TYPES AND INTERFACES
// =======================

export interface SecureWalletInfo {
  userId: string;
  accountAlias: string;
  publicKey: string;
  encryptionInfo: {
    kmsKeyId: string;
    secretName: string;
  };
  security: 'kms-enhanced';
  accountType: 'auto_created_secure';
  needsFunding: boolean;
  createdAt: string;
  version: string;
  autoAccountInfo?: {
    type: 'auto_created';
    activation_method: 'first_transfer';
    benefits: string[];
  };
}

export interface HederaAccountInfo {
  accountId: string;
  publicKey: string;
  balance: string;
  network: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WalletServiceConfig {
  enableDemoMode: boolean;
  enableDebugLogging: boolean;
  maxRetries: number;
  retryDelay: number;
}

// =======================
// CONSOLIDATED WALLET SERVICE
// =======================

export class ConsolidatedWalletService {
  // Configuration
  private static readonly API_BASE_URL = (import.meta as any).env.VITE_ONBOARDING_API_URL || '';
  private static readonly WALLET_API_URL = (import.meta as any).env.VITE_WALLET_API_URL || '';
  private static readonly NETWORK = hederaConfig.currentNetwork as 'testnet' | 'mainnet';
  private static readonly MIRROR_NODE_URL = hederaConfig.network[hederaConfig.currentNetwork as 'testnet' | 'mainnet'].mirrorNodeUrl;
  
  private static config: WalletServiceConfig = {
    enableDemoMode: config.isDemoMode,
    enableDebugLogging: config.isDebugMode,
    maxRetries: 3,
    retryDelay: 1000
  };

  // =======================
  // CORE WALLET OPERATIONS
  // =======================

  /**
   * Check if user has a secure KMS-enhanced wallet
   */
  static async hasWallet(): Promise<boolean> {
    this.log('🔍 Checking for secure wallet');
    
    if (this.config.enableDemoMode) {
      this.log('🎭 Demo mode: Returning true for hasWallet');
      return true;
    }
    
    try {
      const wallet = await this.getWallet();
      const hasWallet = wallet !== null;
      this.log(`Wallet check result: ${hasWallet}`);
      return hasWallet;
    } catch (error) {
      this.logError('Error checking wallet existence:', error);
      
      // Handle authentication errors gracefully
      if (this.isAuthenticationError(error)) {
        this.log('🔄 Authentication error - user needs to authenticate first');
        return false;
      }
      
      return false;
    }
  }

  /**
   * Get user's secure wallet information
   */
  static async getWallet(): Promise<SecureWalletInfo | null> {
    this.log('🔍 Getting secure wallet');
    
    if (this.config.enableDemoMode) {
      this.log('🎭 Demo mode: Returning mock wallet data');
      return this.getDemoWallet();
    }

    try {
      const response = await this.makeAuthenticatedRequest('/onboarding/status', 'GET');
      
      if (response.success && response.data?.hasWallet) {
        return this.transformWalletResponse(response.data);
      }
      
      return null;
    } catch (error) {
      this.logError('Error fetching wallet:', error);
      
      if (this.isAuthenticationError(error)) {
        throw new Error('Authentication required');
      }
      
      return null;
    }
  }

  /**
   * Create a new secure wallet for the user
   */
  static async createWallet(
    request: WalletCreationRequest = {},
    onStatusUpdate?: (status: WalletCreationStatus) => void
  ): Promise<WalletCreationResponse> {
    this.log('🚀 Creating secure wallet');
    
    if (this.config.enableDemoMode) {
      this.log('🎭 Demo mode: Creating mock wallet');
      return this.createDemoWallet(request, onStatusUpdate);
    }

    try {
      // Check if user already has a wallet
      const existingWallet = await this.getWallet();
      if (existingWallet) {
        return {
          success: false,
          wallet: {
            accountId: existingWallet.accountAlias,
            publicKey: existingWallet.publicKey,
            balance: 0
          },
          error: 'User already has a wallet'
        };
      }

      // Update status: Starting
      onStatusUpdate?.({
        state: 'creating',
        progress: 10,
        message: 'Initializing wallet creation...'
      });

      // Update status: Creating account
      onStatusUpdate?.({
        state: 'creating',
        progress: 30,
        message: 'Creating Hedera account...'
      });

      const response = await this.makeAuthenticatedRequest('/onboarding/start', 'POST', request);

      if (response.success) {
        // Update status: Updating profile
        onStatusUpdate?.({
          state: 'creating',
          progress: 70,
          message: 'Updating user profile...'
        });

        // Update user's Cognito attributes
        await UserService.updateUserProfile({
          hederaAccountId: response.data.hedera_account_id
        });

        // Update status: Complete
        onStatusUpdate?.({
          state: 'completed',
          progress: 100,
          message: 'Wallet created successfully!'
        });

        return {
          success: true,
          wallet: {
            accountId: response.data.hedera_account_id,
            publicKey: response.data.public_key,
            balance: parseFloat(response.data.balance) || 0
          }
        };
      }

      throw new Error(response.error || 'Failed to create wallet');
    } catch (error) {
      this.logError('Error creating wallet:', error);
      
      onStatusUpdate?.({
        state: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to create wallet'
      });

      return {
        success: false,
        wallet: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =======================
  // WALLET BALANCE & TRANSACTIONS
  // =======================

  /**
   * Get wallet balance from Hedera Mirror Node
   */
  static async getBalance(accountId?: string): Promise<WalletBalance | null> {
    this.log('💰 Getting wallet balance');
    
    if (this.config.enableDemoMode) {
      return {
        hbar: 100.0,
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      const wallet = await this.getWallet();
      if (!wallet) {
        throw new Error('No wallet found');
      }

      const accountAlias = accountId || wallet.accountAlias;
      const url = `${this.MIRROR_NODE_URL}/accounts/${accountAlias}`;
      
      this.log(`Fetching balance from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status}`);
      }

      const data = await response.json();
      this.log('Balance response:', data);

      // Extract HBAR balance
      let hbarBalance = '0';
      if (data.balance && data.balance.balance) {
        hbarBalance = (parseInt(data.balance.balance) / 100000000).toString();
      } else if (data.balances && data.balances.length > 0) {
        const hbarAccount = data.balances.find((b: any) => b.account === accountAlias);
        if (hbarAccount && hbarAccount.balance) {
          hbarBalance = (parseInt(hbarAccount.balance) / 100000000).toString();
        }
      }

      return {
        hbar: parseFloat(hbarBalance),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.logError('Error fetching balance:', error);
      return null;
    }
  }

  /**
   * Get wallet transactions from Hedera Mirror Node
   */
  static async getTransactions(accountId?: string, limit: number = 10): Promise<HederaTransaction[]> {
    this.log('📊 Getting wallet transactions');
    
    if (this.config.enableDemoMode) {
      return [
        {
          id: 'demo-tx-123',
          from: '0.0.123456',
          timestamp: new Date().toISOString(),
          type: 'CRYPTOTRANSFER',
          amount: 10.0,
          fee: 0.0001,
          status: 'SUCCESS'
        }
      ];
    }

    try {
      const wallet = await this.getWallet();
      if (!wallet) {
        throw new Error('No wallet found');
      }

      const accountAlias = accountId || wallet.accountAlias;
      const url = `${this.MIRROR_NODE_URL}/transactions?account.id=${accountAlias}&limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      
      return data.transactions?.map((tx: any) => ({
        transactionId: tx.transaction_id,
        timestamp: tx.consensus_timestamp,
        type: tx.name,
        amount: tx.amount || '0',
        fee: tx.charged_tx_fee || '0',
        status: tx.result
      })) || [];
    } catch (error) {
      this.logError('Error fetching transactions:', error);
      return [];
    }
  }

  // =======================
  // DIRECT BLOCKCHAIN OPERATIONS
  // =======================

  /**
   * Upload file directly to blockchain (bypassing API Gateway)
   */
  static async uploadFileToBlockchain(
    fileData: {
      fileName: string;
      fileData: string; // base64 encoded
      fileSize: number;
      contentType: string;
      folderId?: string;
      version?: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ 
    fileId: string; 
    tokenId: string;
    transactionId: string;
    version: string;
    fileName: string;
    network: string;
  }>> {
    this.log('📤 Uploading file to blockchain');
    
    if (this.config.enableDemoMode) {
      return {
        success: true,
        data: {
          fileId: '0.0.123456',
          tokenId: '0.0.789012',
          transactionId: 'demo-tx-123',
          version: '1.0',
          fileName: fileData.fileName,
          network: 'testnet'
        }
      };
    }

    try {
      // This would integrate with the direct blockchain upload functionality
      // For now, return a placeholder response
      throw new Error('Direct blockchain upload not yet implemented');
    } catch (error) {
      this.logError('Error uploading file to blockchain:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // =======================
  // UTILITY METHODS
  // =======================

  /**
   * Validate Hedera account ID format
   */
  static validateAccountId(accountId: string): boolean {
    const accountIdRegex = /^0\.0\.\d+$/;
    return accountIdRegex.test(accountId);
  }

  /**
   * Get network information
   */
  static getNetworkInfo() {
    return {
      network: this.NETWORK,
      mirrorNodeUrl: this.MIRROR_NODE_URL,
      isTestnet: this.NETWORK === 'testnet',
      isMainnet: this.NETWORK === 'mainnet'
    };
  }

  /**
   * Update service configuration
   */
  static updateConfig(newConfig: Partial<WalletServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // =======================
  // PRIVATE HELPER METHODS
  // =======================

  private static async makeAuthenticatedRequest(
    endpoint: string, 
    method: string = 'GET', 
    body?: any
  ): Promise<ApiResponse> {
    try {
      const token = await TokenService.getValidIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = `${this.API_BASE_URL}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const requestOptions: RequestInit = {
        method,
        headers,
        credentials: 'include'
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      this.log(`Making ${method} request to: ${url}`);
      
      const response = await fetch(url, requestOptions);
      const responseText = await response.text();
      
      this.log(`Response status: ${response.status}`);
      this.log(`Response body: ${responseText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid JSON response');
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      this.logError('Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      };
    }
  }

  private static transformWalletResponse(data: any): SecureWalletInfo {
    return {
      userId: data.userId || 'unknown',
      accountAlias: data.accountId || data.hedera_account_id || 'unknown',
      publicKey: data.publicKey || data.public_key || '',
      encryptionInfo: {
        kmsKeyId: data.encryption_info?.kmsKeyId || 'unknown',
        secretName: data.encryption_info?.secretName || 'unknown'
      },
      security: 'kms-enhanced',
      accountType: 'auto_created_secure',
      needsFunding: data.needsFunding || data.needs_funding || false,
      createdAt: data.createdAt || data.created || new Date().toISOString(),
      version: data.version || '2.0'
    };
  }

  private static getDemoWallet(): SecureWalletInfo {
    return {
      userId: 'demo-user-123',
      accountAlias: '0.0.123456',
      publicKey: '302a300506032b657003210000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
      encryptionInfo: {
        kmsKeyId: 'alias/safemate-demo-key',
        secretName: 'safemate/hedera/demo-keys'
      },
      security: 'kms-enhanced',
      accountType: 'auto_created_secure',
      needsFunding: false,
      createdAt: new Date().toISOString(),
      version: '2.0-demo'
    };
  }

  private static async createDemoWallet(
    request: WalletCreationRequest,
    onStatusUpdate?: (status: WalletCreationStatus) => void
  ): Promise<WalletCreationResponse> {
    // Simulate wallet creation process
    onStatusUpdate?.({
      state: 'creating',
      progress: 25,
      message: 'Creating demo wallet...'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    onStatusUpdate?.({
      state: 'creating',
      progress: 75,
      message: 'Finalizing demo wallet...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    onStatusUpdate?.({
      state: 'completed',
      progress: 100,
      message: 'Demo wallet created successfully!'
    });

    return {
      success: true,
      wallet: {
        accountId: '0.0.123456',
        publicKey: '302a300506032b657003210000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
        balance: 100.0
      }
    };
  }

  private static isAuthenticationError(error: any): boolean {
    if (!(error instanceof Error)) return false;
    
    return error.message.includes('401') || 
           error.message.includes('Unauthorized') || 
           error.message.includes('No user claims found') ||
           error.message.includes('Authentication required');
  }

  private static log(message: string, ...args: any[]) {
    if (this.config.enableDebugLogging) {
      console.log(`[ConsolidatedWalletService] ${message}`, ...args);
    }
  }

  private static logError(message: string, error: any) {
    if (this.config.enableDebugLogging) {
      console.error(`[ConsolidatedWalletService] ${message}`, error);
    }
  }
}

// =======================
// EXPORT FOR BACKWARD COMPATIBILITY
// =======================

// Export the main service as default
export default ConsolidatedWalletService;

// Export individual methods for backward compatibility
export const {
  hasWallet,
  getWallet,
  createWallet,
  getBalance,
  getTransactions,
  uploadFileToBlockchain,
  validateAccountId,
  getNetworkInfo,
  updateConfig
} = ConsolidatedWalletService;
