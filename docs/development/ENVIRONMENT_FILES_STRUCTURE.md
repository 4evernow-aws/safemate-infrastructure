# SafeMate Environment Files Structure

## 🎯 **Environment File Organization**

This document explains the proper organization of environment files for SafeMate's multi-environment setup.

## 📁 **Environment Files**

### **1. `.env` (Base Development)**
- **Purpose**: Base configuration for local development
- **Used by**: `npm run dev` (local development server)
- **Configuration**: Development Cognito pool, local URLs, debug mode enabled

### **2. `.env.preprod` (Pre-Production)**
- **Purpose**: Configuration for pre-production environment
- **Used by**: `npm run build:preprod` (pre-production builds)
- **Configuration**: Pre-production Cognito pool, CloudFront URL, testnet

### **3. `.env.production` (Production)**
- **Purpose**: Configuration for production environment (future use)
- **Used by**: `npm run build` (production builds)
- **Configuration**: Production Cognito pool, production URL, mainnet

## 🔧 **Build Commands**

### **Development**
```bash
npm run dev          # Uses .env (development configuration)
```

### **Pre-Production**
```bash
npm run build:preprod  # Uses .env.preprod (pre-production configuration)
npm run deploy:preprod # Builds and deploys to S3/CloudFront
```

### **Production**
```bash
npm run build        # Uses .env.production (production configuration)
```

## 📋 **Environment-Specific Configurations**

### **Development Environment** (`.env`)
```env
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_uLgMRpWlw
VITE_APP_URL=http://localhost:5173
VITE_DEBUG_MODE=true
VITE_HEDERA_NETWORK=testnet
```

### **Pre-Production Environment** (`.env.preprod`)
```env
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_pMo5BXFiM
VITE_APP_URL=https://d19a5c2wn4mtdt.cloudfront.net
VITE_DEBUG_MODE=false
VITE_HEDERA_NETWORK=testnet
```

### **Production Environment** (`.env.production`)
```env
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_[PROD_POOL_ID]
VITE_APP_URL=https://prod.safemate.com
VITE_DEBUG_MODE=false
VITE_HEDERA_NETWORK=mainnet
```

## ✅ **Benefits of This Structure**

1. **Clear Separation**: Each environment has its own dedicated configuration file
2. **No Conflicts**: Development and pre-production configurations are completely separate
3. **Easy Switching**: Simple build commands for different environments
4. **Maintainable**: Easy to update environment-specific settings
5. **Scalable**: Easy to add new environments (staging, testing, etc.)

## 🚀 **Migration Summary**

The migration has been updated to use the proper environment file structure:

- ✅ **`.env`**: Now contains development configuration
- ✅ **`.env.preprod`**: Contains pre-production configuration
- ✅ **`.env.production`**: Reserved for future production use
- ✅ **Build scripts**: Updated to use correct environment files

This structure ensures proper separation between development and pre-production environments while maintaining clarity and ease of use.
