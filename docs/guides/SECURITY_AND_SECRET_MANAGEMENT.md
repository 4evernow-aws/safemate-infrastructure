# 🔐 SafeMate Security & Secret Management Guide

**Location**: `docs/guides/SECURITY_AND_SECRET_MANAGEMENT.md`  
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")  
**Status**: ✅ **CRITICAL SECURITY DOCUMENT**

## 🚨 **CRITICAL SECURITY RULES**

### **❌ NEVER COMMIT THESE TO GIT:**
- AWS Access Keys (`AKIA...`)
- AWS Secret Access Keys (40+ character strings)
- Private keys (`.pem`, `.key` files)
- Database passwords
- API keys and tokens
- JWT secrets
- Hedera private keys
- Any credentials or secrets

### **✅ ALWAYS USE:**
- Environment variables for secrets
- `.env.example` files for templates
- AWS IAM roles instead of hardcoded credentials
- Secure secret management services

---

## 🛡️ **Secret Management Best Practices**

### **1. Environment Variables**
```bash
# ✅ CORRECT: Use environment variables
$env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_KEY"

# ❌ WRONG: Never hardcode in files
$env:AWS_ACCESS_KEY_ID = "AKIA6O7BIKJSRA3CR3F3"
```

### **2. .env Files**
```bash
# ✅ CORRECT: Create .env.example (safe to commit)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=ap-southeast-2

# ❌ WRONG: Never commit actual .env files
```

### **3. AWS IAM Roles (Recommended)**
```bash
# ✅ BEST PRACTICE: Use IAM roles instead of keys
# Attach IAM role to EC2/Lambda instances
# No credentials needed in code
```

---

## 🔍 **Pre-Commit Security Checks**

### **Git Hooks Setup**
```bash
# Install git-secrets (recommended)
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'AKIA[0-9A-Z]{16}'
git secrets --add '[0-9a-zA-Z/+=]{40}'
```

### **Manual Checks Before Commit**
```bash
# Check for AWS credentials
grep -r "AKIA" . --exclude-dir=node_modules
grep -r "[0-9a-zA-Z/+=]{40}" . --exclude-dir=node_modules

# Check for common secret patterns
grep -r "password\|secret\|key\|token" . --exclude-dir=node_modules
```

---

## 🚨 **Emergency Response**

### **If Secrets Are Accidentally Committed:**

1. **Immediate Actions:**
   ```bash
   # Remove from current commit (if not pushed)
   git reset --soft HEAD~1
   
   # Remove from history (if already pushed)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/secret/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Rotate Credentials:**
   - Change all exposed passwords/keys immediately
   - Revoke and regenerate API keys
   - Update all systems using the exposed credentials

3. **Notify Team:**
   - Alert all team members
   - Check for unauthorized access
   - Review access logs

---

## 📋 **Security Checklist**

### **Before Every Commit:**
- [ ] No hardcoded credentials in code
- [ ] No `.env` files in staging area
- [ ] No private keys or certificates
- [ ] No API keys or tokens
- [ ] All secrets use environment variables
- [ ] `.gitignore` is up to date

### **Before Every Push:**
- [ ] Run security scan: `git secrets --scan`
- [ ] Check for AWS credentials: `grep -r "AKIA" .`
- [ ] Verify no sensitive data in commit history
- [ ] Test with clean repository clone

### **Weekly Security Audit:**
- [ ] Review recent commits for secrets
- [ ] Check AWS access logs
- [ ] Rotate credentials if needed
- [ ] Update security documentation

---

## 🛠️ **Tools & Resources**

### **Secret Scanning Tools:**
- **git-secrets**: Pre-commit hooks for AWS
- **gitleaks**: Comprehensive secret detection
- **truffleHog**: High entropy secret finder
- **GitHub Secret Scanning**: Built-in protection

### **Installation Commands:**
```bash
# git-secrets
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets && make install

# gitleaks
go install github.com/zricethezav/gitleaks/v8@latest

# truffleHog
pip install truffleHog
```

---

## 📚 **Documentation Security**

### **Safe Documentation Practices:**
- ✅ Use placeholder values: `YOUR_ACCESS_KEY_HERE`
- ✅ Reference environment variables: `$env:AWS_ACCESS_KEY_ID`
- ✅ Use example configurations
- ❌ Never include real credentials
- ❌ Never include actual private keys
- ❌ Never include real API keys

### **Example Documentation:**
```markdown
# ✅ CORRECT Documentation
```bash
# Set your AWS credentials
$env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY_ID"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_ACCESS_KEY"
```

# ❌ WRONG Documentation
```bash
# Set your AWS credentials
$env:AWS_ACCESS_KEY_ID = "AKIA1234567890ABCDEF"
$env:AWS_SECRET_ACCESS_KEY = "your-secret-key-here-40-characters-long"
```
```

---

## 🔄 **Recovery Procedures**

### **If Repository Contains Secrets:**

1. **Immediate Response:**
   ```bash
   # Stop all development
   # Rotate all exposed credentials
   # Notify security team
   ```

2. **Clean Repository:**
   ```bash
   # Use BFG Repo-Cleaner (recommended)
   java -jar bfg.jar --delete-files '*.env' --delete-files '*.key' your-repo.git
   
   # Or use git filter-branch
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/secret' \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force Push Clean History:**
   ```bash
   git push --force --all
   git push --force --tags
   ```

---

## 📞 **Emergency Contacts**

### **Security Issues:**
- **Immediate**: Rotate all credentials
- **Team Lead**: Notify immediately
- **AWS Support**: If AWS credentials exposed
- **GitHub Support**: If repository compromised

### **Recovery Resources:**
- **AWS Credential Rotation**: AWS Console → IAM → Users
- **GitHub Secret Scanning**: Repository Settings → Security
- **Team Security Channel**: #security-alerts

---

## ✅ **Success Metrics**

### **Security Goals:**
- **Zero** hardcoded credentials in code
- **100%** of secrets in environment variables
- **Daily** security scans
- **Weekly** credential rotation
- **Monthly** security audits

### **Monitoring:**
- Pre-commit hooks active
- Secret scanning enabled
- Access logs reviewed
- Team training current

---

**🔐 Remember: Security is everyone's responsibility. When in doubt, ask the security team before committing sensitive data.**

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")  
**Next Review**: $(Get-Date -Format "yyyy-MM-dd" -AddDays 30)
