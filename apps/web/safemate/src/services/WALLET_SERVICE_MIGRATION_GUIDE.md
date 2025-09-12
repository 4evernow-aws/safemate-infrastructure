# Wallet Service Migration Guide

## 🚀 **SafeMate Wallet Service Consolidation**

This guide helps you migrate from the old wallet services to the new `ConsolidatedWalletService` that eliminates duplications and provides a unified API.

---

## 📋 **Migration Overview**

### **Old Services (To Be Deprecated)**
- `secureWalletService.ts` (1,338 lines) - KMS-enhanced operations
- `walletService.ts` (369 lines) - Basic wallet operations  
- `hederaApiService.ts` (841 lines) - Direct blockchain operations

### **New Service**
- `consolidatedWalletService.ts` - **Unified wallet service with all functionality**

---

## 🔄 **Migration Steps**

### **Step 1: Update Imports**

#### **Before (Old Services)**
```typescript
// Multiple imports
import { SecureWalletService } from './secureWalletService';
import { WalletService } from './walletService';
import { HederaApiService } from './hederaApiService';
```

#### **After (New Service)**
```typescript
// Single import
import { ConsolidatedWalletService } from './consolidatedWalletService';
// Or use default import
import ConsolidatedWalletService from './consolidatedWalletService';
```

### **Step 2: Update Method Calls**

#### **Wallet Status Checking**

**Before:**
```typescript
// SecureWalletService
const hasWallet = await SecureWalletService.hasSecureWallet();

// WalletService  
const hasWallet = await WalletService.hasWallet();

// HederaApiService
const hasWallet = await HederaApiService.hasWallet();
```

**After:**
```typescript
// Unified method
const hasWallet = await ConsolidatedWalletService.hasWallet();
```

#### **Getting Wallet Information**

**Before:**
```typescript
// SecureWalletService
const wallet = await SecureWalletService.getSecureWallet();

// WalletService
const wallet = await WalletService.getWallet();

// HederaApiService
const wallet = await HederaApiService.getWallet();
```

**After:**
```typescript
// Unified method
const wallet = await ConsolidatedWalletService.getWallet();
```

#### **Creating Wallets**

**Before:**
```typescript
// SecureWalletService
const result = await SecureWalletService.createSecureWallet(request, onStatusUpdate);

// WalletService
const result = await WalletService.createWallet(request, onStatusUpdate);
```

**After:**
```typescript
// Unified method
const result = await ConsolidatedWalletService.createWallet(request, onStatusUpdate);
```

#### **Getting Balance**

**Before:**
```typescript
// SecureWalletService
const balance = await SecureWalletService.getSecureWalletBalance(accountId);

// WalletService
const balance = await WalletService.getBalance(accountId);
```

**After:**
```typescript
// Unified method
const balance = await ConsolidatedWalletService.getBalance(accountId);
```

#### **Getting Transactions**

**Before:**
```typescript
// WalletService
const transactions = await WalletService.getTransactions(accountId, limit);
```

**After:**
```typescript
// Unified method
const transactions = await ConsolidatedWalletService.getTransactions(accountId, limit);
```

### **Step 3: Update Component Imports**

#### **HederaContext.tsx**
```typescript
// Before
import { SecureWalletService } from '../services/secureWalletService';

// After
import { ConsolidatedWalletService } from '../services/consolidatedWalletService';

// Update method calls
const hasWallet = await ConsolidatedWalletService.hasWallet();
const wallet = await ConsolidatedWalletService.getWallet();
```

#### **BlockchainService.ts**
```typescript
// Before
import { WalletService } from './walletService';

// After
import { ConsolidatedWalletService } from './consolidatedWalletService';

// Update method calls
const wallet = await ConsolidatedWalletService.getWallet();
const isValid = ConsolidatedWalletService.validateAccountId(accountId);
```

#### **EnhancedFileService.ts**
```typescript
// Before
import { SecureWalletService } from './secureWalletService';

// After
import { ConsolidatedWalletService } from './consolidatedWalletService';

// Update method calls
const hasWallet = await ConsolidatedWalletService.hasWallet();
```

---

## 🎯 **New Service Features**

### **Enhanced Configuration**
```typescript
// Update service configuration
ConsolidatedWalletService.updateConfig({
  enableDemoMode: false,
  enableDebugLogging: true,
  maxRetries: 5,
  retryDelay: 2000
});
```

### **Network Information**
```typescript
// Get network details
const networkInfo = ConsolidatedWalletService.getNetworkInfo();
console.log(networkInfo.network); // 'testnet' or 'mainnet'
console.log(networkInfo.mirrorNodeUrl);
```

### **Account Validation**
```typescript
// Validate Hedera account IDs
const isValid = ConsolidatedWalletService.validateAccountId('0.0.123456');
```

### **Direct Blockchain Operations**
```typescript
// Upload files directly to blockchain
const result = await ConsolidatedWalletService.uploadFileToBlockchain(
  fileData,
  onProgress
);
```

---

## 📊 **Method Mapping**

| Old Service | Old Method | New Service | New Method | Notes |
|-------------|------------|-------------|------------|-------|
| `SecureWalletService` | `hasSecureWallet()` | `ConsolidatedWalletService` | `hasWallet()` | Unified method |
| `SecureWalletService` | `getSecureWallet()` | `ConsolidatedWalletService` | `getWallet()` | Unified method |
| `SecureWalletService` | `createSecureWallet()` | `ConsolidatedWalletService` | `createWallet()` | Unified method |
| `SecureWalletService` | `getSecureWalletBalance()` | `ConsolidatedWalletService` | `getBalance()` | Unified method |
| `WalletService` | `hasWallet()` | `ConsolidatedWalletService` | `hasWallet()` | Unified method |
| `WalletService` | `getWallet()` | `ConsolidatedWalletService` | `getWallet()` | Unified method |
| `WalletService` | `createWallet()` | `ConsolidatedWalletService` | `createWallet()` | Unified method |
| `WalletService` | `getBalance()` | `ConsolidatedWalletService` | `getBalance()` | Unified method |
| `WalletService` | `getTransactions()` | `ConsolidatedWalletService` | `getTransactions()` | Unified method |
| `WalletService` | `validateAccountId()` | `ConsolidatedWalletService` | `validateAccountId()` | Unified method |
| `HederaApiService` | `hasWallet()` | `ConsolidatedWalletService` | `hasWallet()` | Unified method |
| `HederaApiService` | `getWallet()` | `ConsolidatedWalletService` | `getWallet()` | Unified method |
| `HederaApiService` | `createWallet()` | `ConsolidatedWalletService` | `createWallet()` | Unified method |

---

## 🔧 **Backward Compatibility**

The new service provides backward compatibility through individual method exports:

```typescript
// You can still import individual methods
import { 
  hasWallet, 
  getWallet, 
  createWallet, 
  getBalance 
} from './consolidatedWalletService';

// Use them directly
const hasWallet = await hasWallet();
const wallet = await getWallet();
```

---

## 🚨 **Breaking Changes**

### **1. Method Name Changes**
- `SecureWalletService.hasSecureWallet()` → `ConsolidatedWalletService.hasWallet()`
- `SecureWalletService.getSecureWallet()` → `ConsolidatedWalletService.getWallet()`
- `SecureWalletService.createSecureWallet()` → `ConsolidatedWalletService.createWallet()`
- `SecureWalletService.getSecureWalletBalance()` → `ConsolidatedWalletService.getBalance()`

### **2. Response Format Changes**
The new service maintains the same response formats for compatibility, but some internal structures may have changed.

### **3. Error Handling**
Error handling is now more consistent across all operations, with better error messages and logging.

---

## 📝 **Migration Checklist**

### **Phase 1: Preparation**
- [ ] Review current wallet service usage in your components
- [ ] Identify all imports of old wallet services
- [ ] Document current method calls and their purposes

### **Phase 2: Implementation**
- [ ] Update imports to use `ConsolidatedWalletService`
- [ ] Update method calls to use new unified methods
- [ ] Test wallet operations in development environment
- [ ] Verify demo mode functionality

### **Phase 3: Testing**
- [ ] Test wallet creation flow
- [ ] Test wallet status checking
- [ ] Test balance retrieval
- [ ] Test transaction history
- [ ] Test error handling scenarios

### **Phase 4: Cleanup**
- [ ] Remove old service imports
- [ ] Update documentation
- [ ] Remove unused code
- [ ] Verify no regressions

---

## 🎯 **Benefits of Migration**

### **1. Reduced Code Duplication**
- **Before**: 3 separate services with overlapping functionality
- **After**: 1 unified service with clear separation of concerns

### **2. Improved Maintainability**
- Single source of truth for wallet operations
- Consistent error handling and logging
- Easier to add new features

### **3. Better Developer Experience**
- Unified API for all wallet operations
- Consistent method naming
- Better TypeScript support

### **4. Enhanced Features**
- Configurable service behavior
- Better demo mode support
- Improved error messages
- Network information utilities

---

## 🆘 **Getting Help**

### **Common Issues**

#### **1. Import Errors**
```typescript
// If you get import errors, make sure the path is correct
import { ConsolidatedWalletService } from './consolidatedWalletService';
```

#### **2. Method Not Found**
```typescript
// All methods are static, so use the class name
const hasWallet = await ConsolidatedWalletService.hasWallet();
```

#### **3. Type Errors**
```typescript
// Make sure you're using the correct types
import type { SecureWalletInfo } from './consolidatedWalletService';
```

### **Support**
- Check the service documentation for detailed API reference
- Review the TypeScript types for proper usage
- Test in demo mode first before production deployment

---

## 📈 **Performance Improvements**

### **Before Migration**
- Multiple service instances
- Duplicate network requests
- Inconsistent caching
- Overlapping functionality

### **After Migration**
- Single service instance
- Optimized network requests
- Unified caching strategy
- Clear separation of concerns

---

**Migration Status**: ✅ **Ready for Implementation**  
**Backward Compatibility**: ✅ **Maintained**  
**Breaking Changes**: ⚠️ **Minimal**  
**Performance Impact**: ✅ **Improved**
