// Secure Credential Storage Service - Manages user's Hedera credentials in browser
import { fetchAuthSession } from 'aws-amplify/auth';

interface HederaCredentials {
  accountId: string;
  privateKey: string;
  network: 'testnet' | 'mainnet';
  encryptedAt: string;
}

interface EncryptedCredentials {
  data: string;
  iv: string;
  salt: string;
}

export class SecureCredentialStorage {
  private static readonly STORAGE_KEY = 'safemate_hedera_credentials';
  private static readonly CREDENTIALS_VERSION = '1.0';

  /**
   * Store user's Hedera credentials securely in browser storage
   */
  static async storeCredentials(
    accountId: string,
    privateKey: string,
    network: 'testnet' | 'mainnet' = 'testnet'
  ): Promise<boolean> {
    try {
      console.log('🔐 Storing Hedera credentials securely...');
      
      // Get user's passphrase from session
      const passphrase = await this.getUserPassphrase();
      
      // Encrypt credentials
      const encrypted = await this.encryptCredentials({
        accountId,
        privateKey,
        network,
        encryptedAt: new Date().toISOString()
      }, passphrase);
      
      // Store encrypted data
      const storageData = {
        version: this.CREDENTIALS_VERSION,
        encrypted: encrypted,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      
      console.log('✅ Credentials stored securely');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to store credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve user's Hedera credentials from secure storage
   */
  static async getCredentials(): Promise<HederaCredentials | null> {
    try {
      console.log('🔓 Retrieving Hedera credentials...');
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📭 No stored credentials found');
        return null;
      }
      
      const storageData = JSON.parse(stored);
      
      // Validate version
      if (storageData.version !== this.CREDENTIALS_VERSION) {
        console.warn('⚠️ Stored credentials version mismatch, clearing old data');
        this.clearCredentials();
        return null;
      }
      
      // Get user's passphrase
      const passphrase = await this.getUserPassphrase();
      
      // Decrypt credentials
      const credentials = await this.decryptCredentials(storageData.encrypted, passphrase);
      
      console.log('✅ Credentials retrieved successfully');
      return credentials;
      
    } catch (error) {
      console.error('❌ Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Clear stored credentials
   */
  static clearCredentials(): void {
    console.log('🗑️ Clearing stored credentials...');
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if credentials are available
   */
  static hasCredentials(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Get user's passphrase from authentication session
   */
  private static async getUserPassphrase(): Promise<string> {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      
      if (!idToken) {
        throw new Error('No authentication token available');
      }
      
      // Use a combination of user ID and token for passphrase
      // In production, you might want to prompt user for a separate passphrase
      const userId = session.tokens?.accessToken?.payload?.sub || 'default';
      return `${userId}_${idToken.substring(0, 32)}`;
      
    } catch (error) {
      console.error('❌ Failed to get user passphrase:', error);
      throw new Error('Authentication required for credential access');
    }
  }

  /**
   * Encrypt credentials using Web Crypto API
   */
  private static async encryptCredentials(
    credentials: HederaCredentials,
    passphrase: string
  ): Promise<EncryptedCredentials> {
    try {
      // Generate salt and derive key
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await this.deriveKey(passphrase, salt);
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt data
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(credentials));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      return {
        data: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt)
      };
      
    } catch (error) {
      console.error('❌ Failed to encrypt credentials:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt credentials using Web Crypto API
   */
  private static async decryptCredentials(
    encrypted: EncryptedCredentials,
    passphrase: string
  ): Promise<HederaCredentials> {
    try {
      // Derive key from passphrase and salt
      const salt = this.base64ToArrayBuffer(encrypted.salt);
      const key = await this.deriveKey(passphrase, new Uint8Array(salt));
      
      // Decrypt data
      const iv = this.base64ToArrayBuffer(encrypted.iv);
      const data = this.base64ToArrayBuffer(encrypted.data);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decrypted);
      
      return JSON.parse(jsonString);
      
    } catch (error) {
      console.error('❌ Failed to decrypt credentials:', error);
      throw new Error('Decryption failed - credentials may be corrupted');
    }
  }

  /**
   * Derive encryption key from passphrase
   */
  private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseBuffer = encoder.encode(passphrase);
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passphraseBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default SecureCredentialStorage;
