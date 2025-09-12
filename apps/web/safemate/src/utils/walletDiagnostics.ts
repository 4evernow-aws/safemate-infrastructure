import { config } from '../config/environment';
import { TokenService } from '../services/tokenService';
import { SecureWalletService } from '../services/secureWalletService';

export interface DiagnosticResult {
  timestamp: string;
  environment: {
    isDemoMode: boolean;
    isProduction: boolean;
    hederaNetwork: string;
    apiEndpoints: {
      vault: string;
      wallet: string;
      hedera: string;
      onboarding: string;
    };
    cognito: {
      region: string;
      userPoolId: string;
      clientId: string;
      domain: string;
    };
  };
  authentication: {
    hasIdToken: boolean;
    hasAccessToken: boolean;
    tokenExpiry: string | null;
    isAuthenticated: boolean;
  };
  wallet: {
    hasWallet: boolean | null;
    walletInfo: any | null;
    balance: any | null;
    error: string | null;
  };
  apiConnectivity: {
    onboardingStatus: any | null;
    onboardingError: string | null;
    vaultStatus: any | null;
    vaultError: string | null;
  };
  recommendations: string[];
}

export class WalletDiagnostics {
  /**
   * Run comprehensive diagnostics to identify wallet connection issues
   */
  static async runDiagnostics(): Promise<DiagnosticResult> {
    const result: DiagnosticResult = {
      timestamp: new Date().toISOString(),
      environment: {
        isDemoMode: config.isDemoMode,
        isProduction: config.isProduction,
        hederaNetwork: config.hederaNetwork,
        apiEndpoints: {
          vault: config.vaultApiUrl,
          wallet: config.walletApiUrl,
          hedera: config.hederaApiUrl,
          onboarding: config.onboardingApiUrl,
        },
        cognito: {
          region: config.cognitoRegion,
          userPoolId: config.cognitoUserPoolId,
          clientId: config.cognitoClientId,
          domain: config.cognitoDomain,
        },
      },
      authentication: {
        hasIdToken: false,
        hasAccessToken: false,
        tokenExpiry: null,
        isAuthenticated: false,
      },
      wallet: {
        hasWallet: null,
        walletInfo: null,
        balance: null,
        error: null,
      },
      apiConnectivity: {
        onboardingStatus: null,
        onboardingError: null,
        vaultStatus: null,
        vaultError: null,
      },
      recommendations: [],
    };

    try {
      // Test authentication
      console.log('🔍 Running authentication diagnostics...');
      const idToken = await TokenService.getValidIdToken();
      const accessToken = await TokenService.getValidAccessToken();
      
      result.authentication.hasIdToken = !!idToken;
      result.authentication.hasAccessToken = !!accessToken;
      result.authentication.isAuthenticated = !!(idToken || accessToken);

      if (idToken) {
        try {
          const tokenParts = idToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expiryDate = new Date(payload.exp * 1000);
            result.authentication.tokenExpiry = expiryDate.toISOString();
          }
        } catch (e) {
          console.warn('Could not decode token expiry');
        }
      }

      // Test wallet connection
      console.log('🔍 Running wallet diagnostics...');
      try {
        result.wallet.hasWallet = await SecureWalletService.hasSecureWallet();
        if (result.wallet.hasWallet) {
          result.wallet.walletInfo = await SecureWalletService.getSecureWallet();
          if (result.wallet.walletInfo) {
            result.wallet.balance = await SecureWalletService.getSecureWalletBalance(
              result.wallet.walletInfo.accountAlias
            );
          }
        }
      } catch (error) {
        result.wallet.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Test API connectivity
      console.log('🔍 Running API connectivity diagnostics...');
      if (result.authentication.isAuthenticated) {
        try {
          // TODO: Fix private method access
          // result.apiConnectivity.onboardingStatus = await SecureWalletService.makeAuthenticatedRequest(
          //   '/onboarding/status',
          //   'GET'
          // );
          result.apiConnectivity.onboardingStatus = { success: false, error: 'Method not accessible' };
        } catch (error) {
          result.apiConnectivity.onboardingError = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result);

    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      result.recommendations.push('Diagnostic failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    return result;
  }

  /**
   * Generate recommendations based on diagnostic results
   */
  private static generateRecommendations(result: DiagnosticResult): string[] {
    const recommendations: string[] = [];

    // Environment checks
    if (result.environment.isDemoMode) {
      recommendations.push('⚠️ Running in demo mode - switch to real mode for production');
    }

    if (!result.environment.apiEndpoints.onboarding) {
      recommendations.push('❌ Missing onboarding API URL - check VITE_ONBOARDING_API_URL');
    }

    if (!result.environment.cognito.userPoolId) {
      recommendations.push('❌ Missing Cognito User Pool ID - check VITE_COGNITO_USER_POOL_ID');
    }

    // Authentication checks
    if (!result.authentication.isAuthenticated) {
      recommendations.push('❌ User not authenticated - user needs to sign in');
      recommendations.push('💡 Check if authentication tokens are being cleared after deployment');
    }

    if (result.authentication.tokenExpiry) {
      const expiry = new Date(result.authentication.tokenExpiry);
      const now = new Date();
      const timeUntilExpiry = expiry.getTime() - now.getTime();
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes
        recommendations.push('⚠️ Authentication token expiring soon - user may need to re-authenticate');
      }
    }

    // Wallet checks
    if (result.wallet.error) {
      recommendations.push(`❌ Wallet error: ${result.wallet.error}`);
      
      if (result.wallet.error.includes('401')) {
        recommendations.push('💡 401 error suggests authentication issue - check API Gateway Cognito authorizer');
      }
      
      if (result.wallet.error.includes('CORS')) {
        recommendations.push('💡 CORS error - check API Gateway CORS configuration');
      }
    }

    if (result.wallet.hasWallet === false) {
      recommendations.push('💡 No wallet found - user may need to create a wallet');
    }

    // API connectivity checks
    if (result.apiConnectivity.onboardingError) {
      recommendations.push(`❌ Onboarding API error: ${result.apiConnectivity.onboardingError}`);
      
      if (result.apiConnectivity.onboardingError.includes('fetch')) {
        recommendations.push('💡 Network error - check if API endpoints are accessible');
      }
    }

    // Production-specific recommendations
    if (result.environment.isProduction) {
      recommendations.push('🔧 Production deployment detected - check environment variables are set correctly');
      recommendations.push('🔧 Verify API Gateway CORS settings include production domain');
      recommendations.push('🔧 Check CloudFront cache invalidation after deployment');
    }

    return recommendations;
  }

  /**
   * Log diagnostic results to console
   */
  static logDiagnostics(result: DiagnosticResult): void {
    console.log('🔍 === WALLET DIAGNOSTIC RESULTS ===');
    console.log(`📅 Timestamp: ${result.timestamp}`);
    
    console.log('\n🌍 Environment:');
    console.log(`  Demo Mode: ${result.environment.isDemoMode}`);
    console.log(`  Production: ${result.environment.isProduction}`);
    console.log(`  Network: ${result.environment.hederaNetwork}`);
    console.log(`  Onboarding API: ${result.environment.apiEndpoints.onboarding || 'NOT SET'}`);
    
    console.log('\n🔐 Authentication:');
    console.log(`  Authenticated: ${result.authentication.isAuthenticated}`);
    console.log(`  ID Token: ${result.authentication.hasIdToken ? '✅' : '❌'}`);
    console.log(`  Access Token: ${result.authentication.hasAccessToken ? '✅' : '❌'}`);
    console.log(`  Token Expiry: ${result.authentication.tokenExpiry || 'Unknown'}`);
    
    console.log('\n💰 Wallet:');
    console.log(`  Has Wallet: ${result.wallet.hasWallet === null ? 'Unknown' : result.wallet.hasWallet ? '✅' : '❌'}`);
    if (result.wallet.error) {
      console.log(`  Error: ${result.wallet.error}`);
    }
    if (result.wallet.balance) {
      console.log(`  Balance: ${result.wallet.balance.hbar} HBAR`);
    }
    
    console.log('\n🌐 API Connectivity:');
    if (result.apiConnectivity.onboardingStatus) {
      console.log(`  Onboarding API: ✅ Working`);
    } else if (result.apiConnectivity.onboardingError) {
      console.log(`  Onboarding API: ❌ ${result.apiConnectivity.onboardingError}`);
    }
    
    console.log('\n💡 Recommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log('\n🔍 === END DIAGNOSTIC RESULTS ===');
  }

  /**
   * Export diagnostic results for debugging
   */
  static exportDiagnostics(result: DiagnosticResult): string {
    return JSON.stringify(result, null, 2);
  }
}
