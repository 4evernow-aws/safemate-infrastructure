# SafeMate v2 - Environment Management Guide

## Overview

This guide covers the management of SafeMate v2 development and pre-production environments.

## Environment Status

### ✅ Current Status
- **🏠 Local Dev**: Working on http://localhost:5173 (dev configuration)
- **🌐 Preprod**: Working on https://d19a5c2wn4mtdt.cloudfront.net (preprod configuration)
- **📦 S3 Bucket**: default-safemate-static-hosting (configured and working)
- **☁️ CloudFront**: E3U5WV0TJVXFOT (configured and working)

## Environment Configurations

### Development Environment
- **URL**: http://localhost:5173
- **Config File**: `.env` (dev configuration)
- **Cognito**: dev-safemate-auth-7h6ewch5
- **API Stage**: /dev
- **Lambda Prefix**: dev-

### Pre-Production Environment
- **URL**: https://d19a5c2wn4mtdt.cloudfront.net
- **Config File**: `.env.preprod`
- **Cognito**: preprod-safemate-auth-wmacwrsy
- **API Stage**: /preprod
- **Lambda Prefix**: preprod-

## Environment Management Scripts

### Core Scripts

#### 1. Switch to Dev Environment
```bash
# WSL
cd /mnt/d/cursor_projects/safemate_v2/apps/web/safemate
chmod +x switch-to-dev.sh
./switch-to-dev.sh

# PowerShell
cd D:\cursor_projects\safemate_v2\apps\web\safemate
.\switch-to-dev.ps1
```

#### 2. Switch to Preprod Environment
```bash
# WSL
cd /mnt/d/cursor_projects/safemate_v2/apps/web/safemate
chmod +x switch-to-preprod.sh
./switch-to-preprod.sh
```

#### 3. Deploy to Preprod
```bash
# WSL
cd /mnt/d/cursor_projects/safemate_v2
chmod +x wsl-fix-preprod-deployment.sh
./wsl-fix-preprod-deployment.sh
```

### Migration Scripts

#### 1. Complete Migration (WSL)
```bash
cd /mnt/d/cursor_projects/safemate_v2
chmod +x wsl-fix-and-migrate.sh
./wsl-fix-and-migrate.sh
```

#### 2. Status Check (PowerShell)
```powershell
cd D:\cursor_projects\safemate_v2
.\check-dev-status.ps1
```

## File Structure

### Environment Files
```
apps/web/safemate/
├── .env                    # Current environment (dev)
├── .env.dev               # Development configuration
├── .env.preprod           # Pre-production configuration
├── .env.production        # Production configuration
├── .env.dev.backup        # Dev configuration backup
└── .env.backup-*          # Timestamped backups
```

### Scripts Location
```
safemate_v2/
├── wsl-*.sh               # WSL scripts
├── *.ps1                  # PowerShell scripts
├── migrate-*.sh           # Migration scripts
├── switch-*.sh            # Environment switching scripts
└── fix-*.sh               # Fix/deployment scripts
```

## Deployment Process

### 1. Development Workflow
1. **Start Dev Server**: `npm run dev` (uses dev configuration)
2. **Make Changes**: Develop locally with dev APIs
3. **Test**: Verify functionality with dev environment
4. **Commit**: Save changes to git

### 2. Preprod Deployment
1. **Switch to Preprod**: `./switch-to-preprod.sh`
2. **Build**: `npm run build` (creates preprod build)
3. **Deploy**: Upload to S3 and invalidate CloudFront
4. **Switch Back**: `./switch-to-dev.sh`

### 3. Full Migration
1. **Run Migration**: `./wsl-fix-and-migrate.sh`
2. **Verify**: Check both environments work
3. **Test**: Test preprod deployment

## AWS Resources

### S3 Buckets
- **Development**: Not used (local development)
- **Preprod**: `default-safemate-static-hosting`

### CloudFront Distributions
- **Preprod**: `E3U5WV0TJVXFOT` → `d19a5c2wn4mtdt.cloudfront.net`

### Cognito User Pools
- **Development**: `ap-southeast-2_pMo5BXFiM` (dev-safemate-auth-7h6ewch5)
- **Preprod**: `ap-southeast-2_pMo5BXFiM` (preprod-safemate-auth-wmacwrsy)

## Troubleshooting

### Common Issues

#### 1. Dev Server Not Starting
```bash
# Kill existing processes
taskkill /F /IM node.exe  # PowerShell
pkill -f "node.*vite"      # WSL

# Clear cache and restart
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### 2. Preprod Site Not Working
```bash
# Check S3 bucket
aws s3 ls s3://default-safemate-static-hosting

# Check CloudFront
aws cloudfront get-distribution --id E3U5WV0TJVXFOT

# Invalidate cache
aws cloudfront create-invalidation --distribution-id E3U5WV0TJVXFOT --paths '/*'
```

#### 3. Environment Configuration Issues
```bash
# Restore dev configuration
cp .env.dev.backup .env

# Restore preprod configuration
cp .env.preprod .env
```

## Best Practices

### 1. Environment Separation
- Always use dev configuration for local development
- Use preprod configuration only for deployment
- Never commit environment-specific files

### 2. Script Usage
- Use WSL scripts for AWS operations
- Use PowerShell scripts for local development
- Always backup before switching environments

### 3. Deployment Safety
- Test locally before deploying
- Verify preprod deployment before production
- Keep environment configurations synchronized

## Quick Reference

### Environment URLs
- **Dev**: http://localhost:5173
- **Preprod**: https://d19a5c2wn4mtdt.cloudfront.net

### Key Commands
```bash
# Start dev server
npm run dev

# Switch environments
./switch-to-dev.sh
./switch-to-preprod.sh

# Deploy to preprod
./wsl-fix-preprod-deployment.sh

# Check status
./check-dev-status.ps1
```

### AWS Resources
- **S3 Bucket**: default-safemate-static-hosting
- **CloudFront**: E3U5WV0TJVXFOT
- **Region**: ap-southeast-2
