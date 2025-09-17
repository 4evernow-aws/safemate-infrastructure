import { fetchAuthSession, updateUserAttribute } from 'aws-amplify/auth';
import { hederaConfig } from '../amplify-config';
import type { UserProfile, UserAttributes, UserStats, SubscriptionTier } from '../types/user';

export class UserService {
  /**
   * Get access token for API requests
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      return idToken || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get formatted display name for user
   */
  static getDisplayName(user: UserProfile | null): string {
    if (!user) {
      console.log('🔍 UserService: No user provided to getDisplayName');
      return 'User';
    }
    
    console.log('🔍 UserService: Getting display name for user:', {
      givenName: user.givenName,
      familyName: user.familyName,
      name: user.name,
      username: user.username,
      email: user.email
    });
    
    // Try to construct full name from given_name and family_name
    if (user.givenName && user.familyName) {
      // Capitalize first letter of each name part
      const capitalizedGivenName = user.givenName.charAt(0).toUpperCase() + user.givenName.slice(1).toLowerCase();
      const capitalizedFamilyName = user.familyName.charAt(0).toUpperCase() + user.familyName.slice(1).toLowerCase();
      const fullName = `${capitalizedGivenName} ${capitalizedFamilyName}`;
      console.log('🔍 UserService: Using full name (capitalized):', fullName);
      return fullName;
    }
    
    // Fallback to name if available
    if (user.name) {
      console.log('🔍 UserService: Using name field:', user.name);
      return user.name;
    }
    
    // Fallback to given_name only
    if (user.givenName) {
      const capitalizedGivenName = user.givenName.charAt(0).toUpperCase() + user.givenName.slice(1).toLowerCase();
      console.log('🔍 UserService: Using given name only (capitalized):', capitalizedGivenName);
      return capitalizedGivenName;
    }
    
    // Extract name from email if it looks like a real email
    if (user.email && user.email.includes('@')) {
      const emailName = user.email.split('@')[0];
      // Convert email name to proper case (e.g., "simon.woods" -> "Simon Woods")
      const nameParts = emailName.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      );
      const emailDerivedName = nameParts.join(' ');
      console.log('🔍 UserService: Using email-derived name from email:', emailDerivedName);
      return emailDerivedName;
    }
    
    // Also try username if it's an email
    if (user.username && user.username.includes('@')) {
      const emailName = user.username.split('@')[0];
      // Convert email name to proper case (e.g., "simon.woods" -> "Simon Woods")
      const nameParts = emailName.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      );
      const emailDerivedName = nameParts.join(' ');
      console.log('🔍 UserService: Using email-derived name from username:', emailDerivedName);
      return emailDerivedName;
    }
    
    // Fallback to username if it's not an email
    if (user.username) {
      console.log('🔍 UserService: Using username:', user.username);
      return user.username;
    }
    
    // Final fallback
    console.log('🔍 UserService: Using final fallback: User');
    return 'User';
  }

  /**
   * Get user profile with custom attributes
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      
      if (!idToken) {
        console.log('No ID token found in session');
        return null;
      }

      const payload = idToken.payload;
      
      // Debug: Log all available payload fields
      console.log('🔍 UserService: ID Token payload:', JSON.stringify(payload, null, 2));
      
      return {
        email: payload.email as string || '',
        username: payload['cognito:username'] as string || payload.email as string || '',
        sub: payload.sub as string || '',
        givenName: payload.given_name as string || '',
        familyName: payload.family_name as string || '',
        name: payload.name as string || '',
        hederaAccountId: payload['custom:hedera_account'] as string,
        assetCount: payload['custom:asset_count'] ? parseInt(payload['custom:asset_count'] as string) : 0,
        subscriptionTier: (payload['custom:subscription_tier'] as 'basic' | 'premium' | 'enterprise') || 'basic',
        mateTokenBalance: payload['custom:mate_balance'] ? parseInt(payload['custom:mate_balance'] as string) : 0,
        kycVerificationStatus: (payload['custom:kyc_status'] as 'pending' | 'approved' | 'rejected' | 'in_review') || 'pending',
        lastBlockchainActivity: payload['custom:last_activity'] as string,
        storageQuotaUsed: payload['custom:storage_used'] ? parseInt(payload['custom:storage_used'] as string) : 0,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }


  /**
   * Update user profile with custom attributes
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      console.log('🔍 UserService: Attempting to update user attributes...');
      
      // Update attributes one by one using the new Amplify v6 auth
      const updatePromises: Promise<void>[] = [];

      if (updates.hederaAccountId !== undefined) {
        updatePromises.push(
          updateUserAttribute({
            userAttributeKey: 'custom:hedera_account',
            value: updates.hederaAccountId,
          })
        );
      }
      if (updates.assetCount !== undefined) {
        updatePromises.push(
          updateUserAttribute({
            userAttributeKey: 'custom:asset_count',
            value: updates.assetCount.toString(),
          })
        );
      }
      if (updates.subscriptionTier !== undefined) {
        updatePromises.push(
          updateUserAttribute({
            userAttributeKey: 'custom:subscription_tier',
            value: updates.subscriptionTier,
          })
        );
      }
      if (updates.mateTokenBalance !== undefined) {
        updatePromises.push(
          updateUserAttribute({
            userAttributeKey: 'custom:mate_balance',
            value: updates.mateTokenBalance.toString(),
          })
        );
      }
      if (updates.kycVerificationStatus !== undefined) {
        updatePromises.push(
          updateUserAttribute({
            userAttributeKey: 'custom:kyc_status',
            value: updates.kycVerificationStatus,
          })
        );
      }
      if (updates.lastBlockchainActivity !== undefined) {
        updatePromises.push(
          updateUserAttribute({
            userAttributeKey: 'custom:last_activity',
            value: updates.lastBlockchainActivity,
          })
        );
      }
      if (updates.storageQuotaUsed !== undefined) {
        updatePromises.push(
          updateUserAttribute({
            userAttributeKey: 'custom:storage_used',
            value: updates.storageQuotaUsed.toString(),
          })
        );
      }

      console.log('🔍 UserService: Updating', updatePromises.length, 'attributes');
      await Promise.all(updatePromises);
      console.log('✅ UserService: User attributes updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }


  /**
   * Initialize user profile with default values
   */
  static async initializeUserProfile(hederaAccountId: string): Promise<boolean> {
    try {
      const defaultAttributes = hederaConfig.defaultUserAttributes;
      const updates: Partial<UserProfile> = {
        hederaAccountId,
        assetCount: defaultAttributes.assetCount,
        subscriptionTier: defaultAttributes.subscriptionTier as 'basic' | 'premium' | 'enterprise',
        mateTokenBalance: defaultAttributes.mateTokenBalance,
        kycVerificationStatus: defaultAttributes.kycVerificationStatus as 'pending' | 'approved' | 'rejected' | 'in_review',
        storageQuotaUsed: defaultAttributes.storageQuotaUsed,
        lastBlockchainActivity: new Date().toISOString(),
      };

      return await this.updateUserProfile(updates);
    } catch (error) {
      console.error('Error initializing user profile:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<UserStats | null> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) return null;

      const subscriptionTier = this.getSubscriptionTier(profile.subscriptionTier || 'basic');
      
      return {
        totalAssets: profile.assetCount || 0,
        storageUsed: profile.storageQuotaUsed || 0,
        storageQuota: subscriptionTier.storageQuota,
        storagePercentage: subscriptionTier.storageQuota > 0 
          ? Math.round(((profile.storageQuotaUsed || 0) / subscriptionTier.storageQuota) * 100)
          : 0,
        mateTokenBalance: profile.mateTokenBalance || 0,
        lastActivity: profile.lastBlockchainActivity 
          ? new Date(profile.lastBlockchainActivity) 
          : null,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Get subscription tier information
   */
  static getSubscriptionTier(tier: 'basic' | 'premium' | 'enterprise'): SubscriptionTier {
    return hederaConfig.subscriptionTiers[tier];
  }

  /**
   * Check if user can upload more assets
   */
  static async canUploadAsset(fileSize: number): Promise<{
    canUpload: boolean;
    reason?: string;
  }> {
    try {
      const stats = await this.getUserStats();
      if (!stats) return { canUpload: false, reason: 'Unable to fetch user stats' };

      const subscriptionTier = this.getSubscriptionTier(stats.storageQuota > 0 ? 'basic' : 'basic');
      
      // Check storage quota
      if (stats.storageUsed + fileSize > stats.storageQuota) {
        return {
          canUpload: false,
          reason: `Storage quota exceeded. Available: ${this.formatBytes(stats.storageQuota - stats.storageUsed)}, Required: ${this.formatBytes(fileSize)}`,
        };
      }

      // Check asset count limit
      if (stats.totalAssets >= subscriptionTier.maxAssets) {
        return {
          canUpload: false,
          reason: `Asset limit exceeded. Maximum assets for ${subscriptionTier.name} tier: ${subscriptionTier.maxAssets}`,
        };
      }

      return { canUpload: true };
    } catch (error) {
      console.error('Error checking upload eligibility:', error);
      return { canUpload: false, reason: 'Error checking upload eligibility' };
    }
  }

  /**
   * Update asset count after successful upload
   */
  static async incrementAssetCount(fileSize: number): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      if (!profile) return false;

      const updates: Partial<UserProfile> = {
        assetCount: (profile.assetCount || 0) + 1,
        storageQuotaUsed: (profile.storageQuotaUsed || 0) + fileSize,
        lastBlockchainActivity: new Date().toISOString(),
      };

      return await this.updateUserProfile(updates);
    } catch (error) {
      console.error('Error incrementing asset count:', error);
      return false;
    }
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if user needs to complete KYC
   */
  static async needsKYC(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      return !profile || profile.kycVerificationStatus === 'pending' || profile.kycVerificationStatus === 'rejected';
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return true;
    }
  }

  /**
   * Check if user has Hedera account
   */
  static async hasHederaAccount(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      return !!(profile && profile.hederaAccountId);
    } catch (error) {
      console.error('Error checking Hedera account:', error);
      return false;
    }
  }
}