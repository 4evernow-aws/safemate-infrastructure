# WSL Setup Guide for API Configuration

## Why WSL is Better

WSL (Windows Subsystem for Linux) provides a much more stable environment for AWS CLI commands and avoids the PowerShell string escaping issues we've been experiencing.

## Quick Setup Steps

### 1. Open WSL Terminal
- Press `Windows + R`
- Type `wsl` and press Enter
- Or open "Ubuntu" from the Start menu

### 2. Navigate to Project Directory
```bash
cd /mnt/d/cursor_projects/safemate_v2/terraform
```

### 3. Make Script Executable
```bash
chmod +x configure-preprod-apis.sh
```

### 4. Run the Configuration Script
```bash
./configure-preprod-apis.sh
```

## What the Script Does

The WSL script will:

1. **Configure all 6 preprod APIs** with CORS and Lambda integrations
2. **Handle retry logic** for AWS API rate limits
3. **Provide colored output** for easy progress tracking
4. **Configure each API step by step**:
   - Create OPTIONS method (CORS)
   - Set up CORS headers
   - Create POST method
   - Set up Lambda integration
   - Deploy to 'preprod' stage

## APIs Being Configured

1. **Hedera API** (`2kwe2ly8vh`) → `preprod-safemate-hedera-service`
2. **Vault API** (`fg85dzr0ag`) → `preprod-safemate-token-vault`
3. **Wallet API** (`9t9hk461kh`) → `preprod-safemate-wallet-manager`
4. **Group API** (`8a6qaslcbc`) → `preprod-safemate-group-manager`
5. **Directory API** (`e3k7nfvzab`) → `preprod-safemate-directory-creator`
6. **Onboarding API** (`ol212feqdl`) → `preprod-safemate-user-onboarding`

## Expected Output

The script will show:
- ✅ **Colored progress indicators**
- ✅ **Step-by-step configuration**
- ✅ **Retry attempts for failed commands**
- ✅ **Success/failure status for each API**
- ✅ **Final summary of all configurations**

## Troubleshooting

### If AWS CLI is not installed in WSL:
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
```

### If you get permission errors:
```bash
# Make sure the script is executable
chmod +x configure-preprod-apis.sh
```

### If you need to check AWS credentials:
```bash
aws sts get-caller-identity
```

## Benefits of WSL Approach

- ✅ **No PowerShell string escaping issues**
- ✅ **More stable terminal environment**
- ✅ **Better error handling**
- ✅ **Native Linux command compatibility**
- ✅ **Faster execution**
- ✅ **Better AWS CLI support**

## Next Steps After Configuration

1. **Update frontend configuration** with preprod endpoints
2. **Test each API endpoint** to verify CORS and Lambda integration
3. **Verify all endpoints are working correctly**

Ready to proceed with WSL? Just run the commands above!
