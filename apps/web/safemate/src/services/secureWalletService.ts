import { hederaConfig } from '../amplify-config';
import { config } from '../config/environment';
import { UserService } from './userService';
import { TokenService } from './tokenService';
import { fetchAuthSession } from 'aws-amplify/auth';
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

export class SecureWalletService {
  private static readonly API_BASE_URL = (import.meta as any).env.VITE_ONBOARDING_API_URL || '';
  private static readonly NETWORK = hederaConfig.currentNetwork as 'testnet' | 'mainnet';
  private static readonly MIRROR_NODE_URL = hederaConfig.network[hederaConfig.currentNetwork as 'testnet' | 'mainnet'].mirrorNodeUrl;

  /**
   * Check if user has a secure KMS-enhanced wallet
   */
  static async hasSecureWallet(): Promise<boolean> {
    console.log('🔍 SecureWalletService: Checking for secure wallet, demo mode:', config.isDemoMode);
    
    if (config.isDemoMode) {
      console.log('🎭 Demo mode: Returning true for hasSecureWallet');
      return true;
    }
    
    try {
      const wallet = await this.getSecureWallet();
      console.log('🔍 SecureWalletService: getSecureWallet result:', wallet);
      const hasWallet = wallet !== null;
      console.log('🔍 SecureWalletService: hasSecureWallet returning:', hasWallet);
      return hasWallet;
    } catch (error) {
      console.error('❌ Error checking secure wallet existence:', error);
      
      // If it's an authentication error, don't treat it as a failure
      // Just return false to indicate no wallet found (user needs to authenticate first)
      if (error instanceof Error && 
          (error.message.includes('401') || 
           error.message.includes('Unauthorized') || 
           error.message.includes('No user claims found'))) {
        console.log('🔄 SecureWalletService: Authentication error - user needs to authenticate first');
        return false;
      }
      
      // For other errors, still return false but log the error
      return false;
    }
  }

  /**
   * Get user's secure wallet information
   */
  static async getSecureWallet(): Promise<SecureWalletInfo | null> {
    console.log('🔍 SecureWalletService: Getting secure wallet, demo mode:', config.isDemoMode);
    
    if (config.isDemoMode) {
      console.log('🎭 Demo mode: Returning mock secure wallet data');
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

    try {
      const response = await this.makeAuthenticatedRequest('/onboarding/status', 'GET');
      
      console.log('🔍 SecureWalletService: Raw response from Lambda:', response);
      console.log('🔍 SecureWalletService: Response fields:', {
        success: response.success,
        hasWallet: response.hasWallet,
        accountId: response.accountId,
        publicKey: response.publicKey,
        walletId: response.walletId
      });
      
      if (response.success && response.hasWallet && response.wallet) {
        console.log('✅ SecureWalletService: Creating wallet object from response');
        console.log('🔍 SecureWalletService: Wallet data:', response.wallet);
        
        return {
          userId: response.userId || 'unknown',
          accountAlias: response.wallet.hedera_account_id,
          publicKey: response.wallet.public_key,
          encryptionInfo: {
            kmsKeyId: response.wallet.encryption_info?.kmsKeyId || 'alias/safemate-master-key-dev',
            secretName: response.wallet.encryption_info?.secretName || 'safemate/hedera/private-keys-dev'
          },
          security: 'kms-enhanced',
          accountType: response.wallet.account_type || 'auto_created_secure',
          needsFunding: response.wallet.needs_funding || false,
          createdAt: response.wallet.created_at || new Date().toISOString(),
          version: response.wallet.version || '2.0-kms',
          network: response.wallet.network || 'testnet',
          initialBalance: response.wallet.initial_balance_hbar || '0.1',
          createdByOperator: response.wallet.created_by_operator || true,
          autoAccountInfo: response.wallet.auto_account_info || {
            type: 'auto_created',
            activation_method: 'first_transfer',
            benefits: [
              'No upfront account creation fees',
              'Account created instantly when funded',
              'Works offline - alias generated locally'
            ]
          }
        };
      }
      
      console.log('❌ SecureWalletService: Response does not indicate wallet exists');
      return null;
    } catch (error) {
      console.error('Error fetching secure wallet:', error);
      
      // Re-throw authentication errors so they can be handled properly
      if (error instanceof Error && 
          (error.message.includes('401') || 
           error.message.includes('Unauthorized') || 
           error.message.includes('No user claims found'))) {
        console.log('🔄 SecureWalletService: Authentication error in getSecureWallet - user needs to authenticate');
        throw error; // Re-throw so calling code can handle it
      }
      
      // For other errors, return null
      return null;
    }
  }

  /**
   * Create a new secure KMS-enhanced wallet for the user
   */
  static async createSecureWallet(
    request: WalletCreationRequest = {},
    onStatusUpdate?: (status: WalletCreationStatus) => void
  ): Promise<WalletCreationResponse> {
    console.log('🔍 SecureWalletService: Creating secure wallet, demo mode:', config.isDemoMode);
    
    // Skip demo mode completely for now
    // if (config.isDemoMode) {
    //   console.log('🎭 Demo mode: Simulating secure wallet creation');
    //   
    //   onStatusUpdate?.({
    //     state: 'creating',
    //     progress: 10,
    //     message: 'Initializing secure wallet creation...'
    //   });

    //   // Simulate progress updates
    //   setTimeout(() => {
    //     onStatusUpdate?.({
    //       state: 'creating',
    //       progress: 30,
    //       message: 'Creating secure Hedera account with KMS encryption...'
    //   });
    //   }, 500);

    //   setTimeout(() => {
    //     onStatusUpdate?.({
    //       state: 'creating',
    //       progress: 70,
    //       message: 'Updating user profile with secure wallet...'
    //   });
    //   }, 1000);

    //   setTimeout(() => {
    //     onStatusUpdate?.({
    //       state: 'completed',
    //       progress: 100,
    //       message: 'Secure wallet created successfully with KMS encryption!'
    //   });
    //   }, 1500);

    //   return {
    //     success: true,
    //     wallet: {
    //       accountId: '0.0.123456',
    //       publicKey: '302a300506032b657003210000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    //       balance: { hbar: 42.5, usd: 0 },
    //       security: 'kms-enhanced',
    //       encryptionInfo: {
    //         kmsKeyId: 'alias/safemate-demo-key',
    //         secretName: 'safemate/hedera/demo-keys'
    //       }
    //     }
    //   };
    // }

    try {
      // Update status: Starting
      onStatusUpdate?.({
        state: 'creating',
        progress: 10,
        message: 'Initializing secure wallet creation...'
      });

      // Check if user already has a secure wallet
      const existingWallet = await this.getSecureWallet();
      if (existingWallet) {
        console.log('✅ User already has a secure wallet:', existingWallet.accountAlias);
        return {
          success: true,  // Changed from false to true
          wallet: {
            accountId: existingWallet.accountAlias,
            publicKey: existingWallet.publicKey,
            balance: { hbar: 0, usd: 0 },
            security: 'kms-enhanced',
            encryptionInfo: existingWallet.encryptionInfo
          }
          // Removed message property as it's not in the interface
        };
      }

      // Update status: Creating secure account
      onStatusUpdate?.({
        state: 'creating',
        progress: 30,
        message: 'Creating secure Hedera account with KMS encryption...'
      });

      const response = await this.makeAuthenticatedRequest('/onboarding/start', 'POST', {
        action: 'start',
        ...request
      });

      if (response.success) {
        // Update status: Updating profile
        onStatusUpdate?.({
          state: 'creating',
          progress: 70,
          message: 'Updating user profile with secure wallet...'
        });

        // Try to update user's Cognito attributes, but don't fail if it doesn't work
        try {
          await UserService.updateUserProfile({
            hederaAccountId: response.hedera_account_id,
            lastBlockchainActivity: new Date().toISOString(),
            walletSecurity: 'kms-enhanced'
          });
          console.log('✅ User profile updated successfully');
        } catch (profileError) {
          console.warn('⚠️ Failed to update user profile, but wallet creation was successful:', profileError);
          // Don't throw error - wallet creation was successful, profile update is optional
        }

        // Update status: Complete
        onStatusUpdate?.({
          state: 'completed',
          progress: 100,
          message: 'Secure wallet created successfully with KMS encryption!'
        });

        return {
          success: true,
          wallet: {
            accountId: response.hedera_account_id,
            publicKey: response.public_key,
            balance: { 
              hbar: response.initial_balance_hbar || 0, 
              usd: 0 
            },
            security: 'kms-enhanced',
            encryptionInfo: response.encryption_info,
            needsFunding: response.needs_funding || false,
            accountType: response.account_type || 'operator_created'
          }
        };
      } else {
        throw new Error(response.error || 'Failed to create secure wallet');
      }
    } catch (error) {
      console.error('Error creating secure wallet:', error);
      
      onStatusUpdate?.({
        state: 'failed',
        progress: 0,
        message: `Failed to create secure wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        success: false,
        wallet: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get wallet balance from Hedera network via API Gateway
   */
  static async getSecureWalletBalance(accountAlias: string): Promise<WalletBalance | null> {
    try {
      console.log('🔍 SecureWalletService: Fetching balance for account:', accountAlias);
      
      // Use the Hedera API Gateway endpoint instead of mirror node
      const hederaApiUrl = 'https://uvk4xxwjyg.execute-api.ap-southeast-2.amazonaws.com/preprod';
      const url = `${hederaApiUrl}/balance?accountId=${accountAlias}`;
      console.log('🔍 SecureWalletService: Balance URL:', url);
      
      // Get authentication token
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('🔍 SecureWalletService: Balance response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ SecureWalletService: Balance fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 SecureWalletService: Balance response data:', data);
      
      if (data.success && data.data && data.data.balance) {
        // Parse the balance from our API Gateway response
        const balanceStr = data.data.balance.replace(' ℏ', ''); // Remove ℏ symbol
        const hbarBalance = parseFloat(balanceStr);
        console.log('✅ SecureWalletService: Balance parsed:', hbarBalance, 'HBAR');
        return {
          hbar: hbarBalance,
          usd: hbarBalance * 0.05, // Approximate USD value
          lastUpdated: new Date().toISOString()
        };
      }
      
      console.log('ℹ️ SecureWalletService: No balance data found in response');
      return null;
    } catch (error) {
      console.error('❌ SecureWalletService: Error fetching secure wallet balance:', error);
      return null;
    }
  }

  /**
   * Get wallet transactions from Hedera network
   */
  static async getSecureWalletTransactions(
    accountAlias: string,
    limit: number = 25
  ): Promise<HederaTransaction[]> {
    try {
      const response = await fetch(
        `${this.MIRROR_NODE_URL}/accounts/${accountAlias}/transactions?limit=${limit}&order=desc`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.transactions?.map((tx: any) => this.transformTransaction(tx)) || [];
    } catch (error) {
      console.error('Error fetching secure wallet transactions:', error);
      return [];
    }
  }

  /**
   * Refresh secure wallet information
   */
  static async refreshSecureWallet(): Promise<SecureWalletInfo | null> {
    try {
      const wallet = await this.getSecureWallet();
      if (wallet) {
        // Update balance information
        const balance = await this.getSecureWalletBalance(wallet.accountAlias);
        console.log(`Secure wallet balance: ${balance?.hbar || 0} HBAR`);
      }
      return wallet;
    } catch (error) {
      console.error('Error refreshing secure wallet:', error);
      return null;
    }
  }

  /**
   * Initialize secure wallet for user
   */
  static async initializeSecureWalletForUser(): Promise<WalletOperationResult> {
    try {
      const hasWallet = await this.hasSecureWallet();
      
      if (hasWallet) {
        return {
          success: true,
          message: 'Secure wallet already exists',
          wallet: await this.getSecureWallet()
        };
      }

      const result = await this.createSecureWallet();
      
      return {
        success: result.success,
        message: result.success ? 'Secure wallet created successfully' : result.error || 'Failed to create wallet',
        wallet: result.wallet ? await this.getSecureWallet() : null
      };
    } catch (error) {
      console.error('Error initializing secure wallet:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        wallet: null
      };
    }
  }

  /**
   * Get network information
   */
  static getNetworkInfo() {
    return {
      network: this.NETWORK,
      mirrorNodeUrl: this.MIRROR_NODE_URL,
      security: 'kms-enhanced'
    };
  }

  /**
   * Debug method to test authentication status
   */
  static async debugAuthenticationStatus(): Promise<void> {
    console.log('🔍 SecureWalletService: Debugging authentication status...');
    
    try {
      // Test token retrieval
      console.log('🔍 Testing token retrieval...');
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      console.log('🔍 Token status:', {
        hasIdToken: !!idToken,
        hasAccessToken: !!accessToken,
        idTokenLength: idToken?.length || 0,
        accessTokenLength: accessToken?.length || 0
      });
      
      if (idToken) {
        console.log('🔍 ID Token preview:', idToken.substring(0, 50) + '...');
      }
      
      if (accessToken) {
        console.log('🔍 Access Token preview:', accessToken.substring(0, 50) + '...');
      }
      
      // Test API endpoint
      console.log('🔍 Testing API endpoint...');
      console.log('🔍 API_BASE_URL:', this.API_BASE_URL);
      
      if (!this.API_BASE_URL) {
        console.error('❌ API_BASE_URL is not configured');
        return;
      }
      
      // Test a simple GET request to the status endpoint
      try {
        const response = await this.makeAuthenticatedRequest('/onboarding/status', 'GET');
        console.log('✅ Authentication test successful:', response);
      } catch (error) {
        console.error('❌ Authentication test failed:', error);
      }
      
    } catch (error) {
      console.error('❌ Debug authentication status failed:', error);
    }
  }

  /**
   * Test authentication without making API calls
   */
  static async testAuthenticationOnly(): Promise<void> {
    console.log('🔍 SecureWalletService: Testing authentication only...');
    
    try {
      // Test token retrieval
      console.log('🔍 Testing token retrieval...');
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      console.log('🔍 Token status:', {
        hasIdToken: !!idToken,
        hasAccessToken: !!accessToken,
        idTokenLength: idToken?.length || 0,
        accessTokenLength: accessToken?.length || 0
      });
      
      if (idToken) {
        console.log('🔍 ID Token preview:', idToken.substring(0, 50) + '...');
        
        // Decode and analyze the token
        try {
          const tokenParts = idToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔍 ID Token payload analysis:', {
              iss: payload.iss,
              aud: payload.aud,
              exp: payload.exp,
              iat: payload.iat,
              sub: payload.sub,
              token_use: payload.token_use,
              'cognito:username': payload['cognito:username'],
              'cognito:groups': payload['cognito:groups']
            });
            
            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            const isExpired = now > payload.exp;
            console.log('🔍 Token expiry check:', {
              currentTime: now,
              tokenExpiry: payload.exp,
              isExpired,
              timeUntilExpiry: payload.exp - now
            });
            
            if (isExpired) {
              console.error('❌ Token is expired!');
            } else {
              console.log('✅ Token is valid');
            }
          }
        } catch (decodeError) {
          console.error('❌ Could not decode token:', decodeError);
        }
      }
      
      if (accessToken) {
        console.log('🔍 Access Token preview:', accessToken.substring(0, 50) + '...');
      }
      
      // Test API configuration
      console.log('🔍 API configuration:', {
        apiBaseUrl: this.API_BASE_URL,
        hasApiUrl: !!this.API_BASE_URL
      });
      
      if (!this.API_BASE_URL) {
        console.error('❌ API_BASE_URL is not configured');
        return;
      }
      
      console.log('✅ Authentication test completed');
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
    }
  }

  /**
   * Test API call with detailed debugging
   */
  static async testApiCall(): Promise<void> {
    console.log('🔍 SecureWalletService: Testing API call...');
    
    if (!this.API_BASE_URL) {
      console.error('❌ API_BASE_URL is not configured');
      return;
    }
    
    try {
      // Get tokens
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      if (!idToken && !accessToken) {
        console.error('❌ No tokens available');
        return;
      }
      
      const url = `${this.API_BASE_URL}/onboarding/status`;
      console.log('🔍 Testing URL:', url);
      
      // Test with ID token first
      if (idToken) {
        console.log('🔍 Testing with ID token...');
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
          console.log('🔍 ID Token response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ ID Token test successful:', data);
            return;
          } else {
            const errorText = await response.text();
            console.log('❌ ID Token test failed:', errorText);
          }
        } catch (error) {
          console.error('❌ ID Token test error:', error);
        }
      }
      
      // Test with Access token if ID token failed
      if (accessToken && !idToken) {
        console.log('🔍 Testing with Access token...');
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
          console.log('🔍 Access Token response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Access Token test successful:', data);
            return;
          } else {
            const errorText = await response.text();
            console.log('❌ Access Token test failed:', errorText);
          }
        } catch (error) {
          console.error('❌ Access Token test error:', error);
        }
      }
      
      console.log('❌ All token tests failed');
      
    } catch (error) {
      console.error('❌ API call test failed:', error);
    }
  }

  /**
   * Try different authentication approaches to work around common issues
   */
  static async tryAlternativeAuth(): Promise<void> {
    console.log('🔍 SecureWalletService: Trying alternative authentication approaches...');
    
    if (!this.API_BASE_URL) {
      console.error('❌ API_BASE_URL is not configured');
      return;
    }
    
    try {
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      if (!idToken && !accessToken) {
        console.error('❌ No tokens available');
        return;
      }
      
      const url = `${this.API_BASE_URL}/onboarding/status`;
      
      // Test different header formats
      const testCases = [
        {
          name: 'ID Token with Bearer',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'Accept': 'application/json'
          }
        },
        {
          name: 'ID Token without Bearer',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken || '',
            'Accept': 'application/json'
          }
        },
        {
          name: 'Access Token with Bearer',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        },
        {
          name: 'ID Token with X-Authorization',
          headers: {
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${idToken}`,
            'Accept': 'application/json'
          }
        },
        {
          name: 'ID Token with custom header',
          headers: {
            'Content-Type': 'application/json',
            'X-Cognito-Token': idToken || '',
            'Accept': 'application/json'
          }
        }
      ];
      
      for (const testCase of testCases) {
        // Skip if no token in this test case
        const hasToken = testCase.headers.Authorization || testCase.headers['X-Authorization'] || testCase.headers['X-Cognito-Token'];
        if (!hasToken) {
          continue;
        }
        
        console.log(`🔍 Testing: ${testCase.name}`);
        try {
          const headers: Record<string, string> = {};
          Object.entries(testCase.headers).forEach(([key, value]) => {
            if (value !== undefined) {
              headers[key] = value;
            }
          });
          
          const response = await fetch(url, {
            method: 'GET',
            headers,
            credentials: 'include'
          });
          
          console.log(`🔍 ${testCase.name} response:`, {
            status: response.status,
            statusText: response.statusText
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${testCase.name} successful:`, data);
            return;
          } else {
            const errorText = await response.text();
            console.log(`❌ ${testCase.name} failed:`, errorText);
          }
        } catch (error) {
          console.error(`❌ ${testCase.name} error:`, error);
        }
      }
      
      console.log('❌ All alternative authentication approaches failed');
      
    } catch (error) {
      console.error('❌ Alternative auth test failed:', error);
    }
  }

  /**
   * Test with different token formats to work around API Gateway issues
   */
  static async testTokenFormats(): Promise<void> {
    console.log('🔍 SecureWalletService: Testing different token formats...');
    
    if (!this.API_BASE_URL) {
      console.error('❌ API_BASE_URL is not configured');
      return;
    }
    
    try {
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      if (!idToken && !accessToken) {
        console.error('❌ No tokens available');
        return;
      }
      
      const url = `${this.API_BASE_URL}/onboarding/status`;
      
      // Test different token formats
      const testCases = [
        {
          name: 'ID Token with Bearer',
          token: idToken,
          header: `Bearer ${idToken}`
        },
        {
          name: 'ID Token without Bearer',
          token: idToken,
          header: idToken || ''
        },
        {
          name: 'Access Token with Bearer',
          token: accessToken,
          header: `Bearer ${accessToken}`
        }
      ];
      
      for (const testCase of testCases) {
        if (!testCase.token) continue;
        
        console.log(`🔍 Testing: ${testCase.name}`);
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': testCase.header,
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
          console.log(`🔍 ${testCase.name} response:`, {
            status: response.status,
            statusText: response.statusText
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${testCase.name} successful:`, data);
            return;
          } else {
            const errorText = await response.text();
            console.log(`❌ ${testCase.name} failed:`, errorText);
          }
        } catch (error) {
          console.error(`❌ ${testCase.name} error:`, error);
        }
      }
      
      console.log('❌ All token format tests failed');
      
    } catch (error) {
      console.error('❌ Token format test failed:', error);
    }
  }

  /**
   * Test API Gateway configuration and authentication
   */
  static async testApiGatewayConfiguration(): Promise<void> {
    console.log('🔍 SecureWalletService: Testing API Gateway configuration...');
    
    if (!this.API_BASE_URL) {
      console.error('❌ API_BASE_URL is not configured');
      return;
    }
    
    try {
      // Get tokens
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      if (!idToken && !accessToken) {
        console.error('❌ No tokens available');
        return;
      }
      
      console.log('🔍 SecureWalletService: Testing API Gateway endpoints...');
      
      // Test different endpoints to see which ones work
      const testEndpoints = [
        '/onboarding/status',
        '/onboarding/start'
      ];
      
      for (const endpoint of testEndpoints) {
        console.log(`🔍 SecureWalletService: Testing endpoint: ${endpoint}`);
        
        try {
          const response = await this.makeAuthenticatedRequest(endpoint, 'GET');
          console.log(`✅ SecureWalletService: ${endpoint} successful:`, response);
        } catch (error) {
          console.error(`❌ SecureWalletService: ${endpoint} failed:`, error);
        }
      }
      
      // Test CORS preflight
      console.log('🔍 SecureWalletService: Testing CORS preflight...');
      try {
        const response = await fetch(`${this.API_BASE_URL}/onboarding/status`, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:5173',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization,Content-Type'
          }
        });
        
        console.log('🔍 SecureWalletService: CORS preflight response:', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (error) {
        console.error('❌ SecureWalletService: CORS preflight failed:', error);
      }
      
    } catch (error) {
      console.error('❌ SecureWalletService: API Gateway configuration test failed:', error);
    }
  }

  /**
   * Test authentication and API connectivity
   */
  static async testAuthentication(): Promise<boolean> {
    try {
      console.log('🔍 SecureWalletService: Testing authentication...');
      
      // First, test token retrieval
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      console.log('🔍 SecureWalletService: Token test results:');
      console.log(`  - ID Token available: ${!!idToken}`);
      console.log(`  - Access Token available: ${!!accessToken}`);
      
      if (!idToken && !accessToken) {
        console.error('❌ SecureWalletService: No tokens available');
        return false;
      }
      
      // Test a simple API call to see what happens
      try {
        console.log('🔍 SecureWalletService: Testing API connectivity...');
        const testResponse = await this.makeAuthenticatedRequest('/onboarding/status', 'GET');
        console.log('✅ SecureWalletService: API test successful:', testResponse);
        return true;
      } catch (apiError) {
        console.error('❌ SecureWalletService: API test failed:', apiError);
        
        // Try to get more details about the error
        if (apiError instanceof Error) {
          const errorMessage = apiError.message;
          console.error('🔍 SecureWalletService: Error analysis:');
          
          if (errorMessage.includes('401')) {
            console.error('  - 401 Unauthorized: Token validation failed');
            console.error('  - Possible causes:');
            console.error('    1. Token format incorrect');
            console.error('    2. API Gateway not configured for Cognito');
            console.error('    3. Token expired or invalid');
            console.error('    4. CORS issues');
          } else if (errorMessage.includes('403')) {
            console.error('  - 403 Forbidden: Token valid but insufficient permissions');
          } else if (errorMessage.includes('500')) {
            console.error('  - 500 Server Error: Backend issue');
          } else if (errorMessage.includes('CORS')) {
            console.error('  - CORS Error: Cross-origin request blocked');
          }
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ SecureWalletService: Authentication test failed:', error);
      return false;
    }
  }

  /**
   * Debug method to test token format and API Gateway authorizer
   */
  static async debugTokenFormat(): Promise<void> {
    console.log('🔍 SecureWalletService: Debugging token format...');
    
    try {
      const idToken = await TokenService.getValidIdToken();
      
      if (!idToken) {
        console.error('❌ No ID token available');
        return;
      }
      
      console.log('🔍 Token analysis:');
      console.log(`  - Token length: ${idToken.length}`);
      console.log(`  - Token starts with: ${idToken.substring(0, 20)}...`);
      console.log(`  - Token ends with: ...${idToken.substring(idToken.length - 20)}`);
      
      // Decode token payload
      try {
        const tokenParts = idToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 Token payload:');
          console.log(`  - Issuer (iss): ${payload.iss}`);
          console.log(`  - Audience (aud): ${payload.aud}`);
          console.log(`  - Subject (sub): ${payload.sub}`);
          console.log(`  - Token use: ${payload.token_use}`);
          console.log(`  - Expires at: ${new Date(payload.exp * 1000).toISOString()}`);
          console.log(`  - Issued at: ${new Date(payload.iat * 1000).toISOString()}`);
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          const isExpired = now > payload.exp;
          console.log(`  - Current time: ${new Date(now * 1000).toISOString()}`);
          console.log(`  - Is expired: ${isExpired}`);
          console.log(`  - Time until expiry: ${payload.exp - now} seconds`);
          
          if (isExpired) {
            console.error('❌ Token is expired!');
            return;
          }
        }
      } catch (decodeError) {
        console.error('❌ Could not decode token payload:', decodeError);
      }
      
      // Test the exact format expected by API Gateway
      const url = `${this.API_BASE_URL}/onboarding/status`;
      console.log('🔍 Testing API Gateway authorizer with exact format...');
      console.log(`  - URL: ${url}`);
      console.log(`  - Authorization header: Bearer ${idToken.substring(0, 20)}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('🔍 Response analysis:');
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Status text: ${response.statusText}`);
      console.log(`  - Headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Gateway authorizer test successful:', data);
      } else {
        const errorText = await response.text();
        console.error('❌ API Gateway authorizer test failed:', errorText);
        
        if (response.status === 401) {
          console.error('🔍 401 Analysis:');
          console.error('  - This means the API Gateway Cognito Authorizer rejected the token');
          console.error('  - Possible causes:');
          console.error('    1. Token format is incorrect');
          console.error('    2. Token is expired');
          console.error('    3. Token is from wrong Cognito User Pool');
          console.error('    4. API Gateway authorizer configuration issue');
        }
      }
      
    } catch (error) {
      console.error('❌ Token format debug failed:', error);
    }
  }

  /**
   * Make authenticated request to backend
   */
  private static async makeAuthenticatedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS',
    body?: any
  ): Promise<any> {
    try {
      console.log(`🔍 SecureWalletService: Starting ${method} request to ${endpoint}`);
      console.log(`🔍 SecureWalletService: API_BASE_URL = ${this.API_BASE_URL}`);
      
      // All APIs now use authentication
      console.log('🔍 SecureWalletService: Using authenticated API');
      
      // Get user's auth token with automatic refresh
      // Try ID token first, then fall back to access token
      let token = await TokenService.getValidIdToken();
      let tokenType = 'ID';
      if (!token) {
        console.log('🔍 SecureWalletService: No ID token, trying access token...');
        token = await TokenService.getValidAccessToken();
        tokenType = 'Access';
      }
      
      if (!token) {
        console.error('❌ SecureWalletService: No valid token available');
        throw new Error('User not authenticated or token refresh failed');
      }

      console.log(`🔍 SecureWalletService: Using ${tokenType} token`);
      console.log(`🔍 SecureWalletService: Token details:`);
      console.log(`  - Token length: ${token.length}`);
      console.log(`  - Token preview: ${token.substring(0, 50)}...`);
      console.log(`  - Token ends with: ...${token.substring(token.length - 20)}`);
      
      // Enhanced token payload debugging
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log(`🔍 SecureWalletService: Token payload:`, {
            iss: payload.iss,
            aud: payload.aud,
            exp: payload.exp,
            iat: payload.iat,
            sub: payload.sub,
            token_use: payload.token_use,
            scope: payload.scope,
            auth_time: payload.auth_time,
            'cognito:groups': payload['cognito:groups'],
            'cognito:username': payload['cognito:username']
          });
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          console.log(`🔍 SecureWalletService: Token expiry check:`, {
            currentTime: now,
            tokenExpiry: payload.exp,
            isExpired: now > payload.exp,
            timeUntilExpiry: payload.exp - now
          });
          
          // Verify this is the right token type for Cognito User Pools
          if (payload.token_use === 'id') {
            console.log('✅ SecureWalletService: Using ID token (correct for Cognito User Pools)');
          } else if (payload.token_use === 'access') {
            console.log('⚠️ SecureWalletService: Using Access token (may not work with Cognito User Pools)');
          } else {
            console.log('❓ SecureWalletService: Unknown token type');
          }
        }
      } catch (payloadError) {
        console.log(`🔍 SecureWalletService: Could not decode token payload:`, payloadError);
      }

      const url = `${this.API_BASE_URL}${endpoint}`;
      console.log(`🔍 SecureWalletService: Full URL = ${url}`);
      
      // Enhanced header variations for debugging authorization issues
      const headerVariations = [
        {
          name: 'Standard Bearer (API Gateway Cognito Authorizer)',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          } as Record<string, string>
        },
        {
          name: 'Bearer with Cognito Headers',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-cognito-id-token': token,
            'Accept': 'application/json'
          } as Record<string, string>
        }
      ];

      try {
        console.log(`🔍 SecureWalletService: Making authenticated request...`);
        
        const requestOptions: RequestInit = {
          method,
          headers: headerVariations[0].headers,
          credentials: 'omit' // Changed from 'include' to 'omit' for development
        };

        if (body && method !== 'GET') {
          requestOptions.body = JSON.stringify(body);
          console.log(`🔍 SecureWalletService: Request body =`, body);
        }

        console.log(`🔍 SecureWalletService: Sending request...`);
        console.log(`🔍 SecureWalletService: Request options =`, {
          method: requestOptions.method,
          headers: requestOptions.headers,
          hasBody: !!requestOptions.body
        });
        
        const response = await fetch(url, requestOptions);
        
        console.log(`🔍 SecureWalletService: Response status = ${response.status}`);
        console.log(`🔍 SecureWalletService: Response status text = ${response.statusText}`);
        console.log(`🔍 SecureWalletService: Response headers =`, Object.fromEntries(response.headers.entries()));
        
        // Handle response based on status
        if (response.ok) {
          const responseData = await response.json();
          console.log(`✅ SecureWalletService: Request successful!`);
          console.log(`🔍 SecureWalletService: Response data =`, responseData);
          return responseData;
        } else {
          // Read response body only once
          const errorText = await response.text();
          console.log(`🔍 SecureWalletService: ${response.status} Response body =`, errorText);
          
          // Enhanced error handling for 401 responses
          if (response.status === 401) {
            try {
              const errorJson = JSON.parse(errorText);
              console.log(`🔍 SecureWalletService: 401 Error details =`, errorJson);
            } catch (parseError) {
              console.log(`🔍 SecureWalletService: Could not parse 401 response as JSON`);
            }
          }
          
          console.error(`❌ SecureWalletService: Request failed with ${response.status}: ${errorText}`);
          
          // Enhanced 401 debugging
          if (response.status === 401) {
            console.error(`❌ SecureWalletService: 401 Unauthorized - Detailed Analysis:`);
            console.error(`  - Token format: ${tokenType} token`);
            console.error(`  - Token length: ${token.length}`);
            console.error(`  - Request URL: ${url}`);
            console.error(`  - Request method: ${method}`);
            console.error(`  - Request headers:`, headerVariations[0].headers);
            console.error(`  - Response body: ${errorText}`);
            
            // Check if it's a CORS preflight issue
            if (method === 'OPTIONS') {
              console.error(`  - This might be a CORS preflight issue`);
            }
            
            // Check if it's a token validation issue
            if (errorText.includes('token') || errorText.includes('authorization')) {
              console.error(`  - Token validation failed on server side`);
            }
            
            // Check if it's an API Gateway configuration issue
            if (errorText.includes('gateway') || errorText.includes('lambda')) {
              console.error(`  - API Gateway or Lambda configuration issue`);
            }
            
            // Check if it's a Cognito User Pool issue
            if (errorText.includes('cognito') || errorText.includes('user pool')) {
              console.error(`  - Cognito User Pool configuration issue`);
            }
            
            // Check if it's an API Gateway authorizer issue
            if (errorText.includes('Unauthorized') && !errorText.includes('user claims')) {
              console.error(`  - API Gateway Cognito Authorizer rejected the token`);
              console.error(`  - This could be due to:`);
              console.error(`    * Token format (should be 'Bearer <token>')`);
              console.error(`    * Token expiration`);
              console.error(`    * Wrong token type (should be ID token, not access token)`);
              console.error(`    * Cognito User Pool configuration mismatch`);
            }
            
            // Check if it's a Lambda authorizer issue
            if (errorText.includes('user claims found')) {
              console.error(`  - Lambda function received request but no user claims`);
              console.error(`  - This means API Gateway authorizer failed to validate token`);
            }
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
      } catch (error) {
        console.error(`❌ SecureWalletService: Request error:`, error);
        throw error;
      }
      
    } catch (error) {
      console.error('❌ SecureWalletService: Error making authenticated request:', error);
      throw error;
    }
  }

  /**
   * Transform transaction data
   */
  private static transformTransaction(tx: any): HederaTransaction {
    return {
      id: tx.transaction_id,
      type: tx.name,
      from: tx.entity_id || tx.payer_account_id || '',
      status: tx.result,
      amount: tx.transfers?.[0]?.amount || 0,
      fee: tx.charged_tx_fee || 0,
      timestamp: tx.consensus_timestamp,
      memo: tx.memo || '',
      payer: tx.payer_account_id,
      transfers: tx.transfers || []
    };
  }

  /**
   * Format HBAR amount
   */
  static formatHbarAmount(amount: number, decimals: number = 8): string {
    return (amount / Math.pow(10, decimals)).toFixed(8);
  }

  /**
   * Format account ID
   */
  static formatAccountId(accountId: string): string {
    return accountId.replace(/^0\.0\./, '');
  }

  /**
   * Validate account ID
   */
  static validateAccountId(accountId: string): boolean {
    return /^0\.0\.\d+$/.test(accountId);
  }
}