# SafeMate Security Hooks Setup
# This script sets up pre-commit security checks

Write-Host "🔐 SafeMate Security Hooks Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "   Please run this script from the root of your git repository" -ForegroundColor Red
    exit 1
}

# Create hooks directory if it doesn't exist
$HooksDir = ".git\hooks"
if (-not (Test-Path $HooksDir)) {
    New-Item -ItemType Directory -Path $HooksDir -Force | Out-Null
}

# Create the pre-commit hook
$PreCommitHook = @"
#!/bin/sh
# SafeMate Pre-Commit Security Check

# Get the script directory
SCRIPT_DIR="`$(cd "`$(dirname "`$0")" && pwd)"
PROJECT_ROOT="`$(cd "`$SCRIPT_DIR/../.." && pwd)"

# Run the PowerShell security check
powershell.exe -ExecutionPolicy Bypass -File "`$PROJECT_ROOT/scripts/security/pre-commit-security-check.ps1"

# Exit with the same code as the PowerShell script
exit `$?
"@

$PreCommitHookPath = Join-Path $HooksDir "pre-commit"
$PreCommitHook | Out-File -FilePath $PreCommitHookPath -Encoding UTF8

# Make the hook executable (on Unix-like systems)
if ($IsLinux -or $IsMacOS) {
    chmod +x $PreCommitHookPath
}

Write-Host "✅ Pre-commit security hook installed" -ForegroundColor Green

# Create a test script to verify the setup
$TestScript = @"
# Test the security check
Write-Host "🧪 Testing security check..." -ForegroundColor Yellow

# Create a temporary test file with a fake AWS key
`$TestFile = "test-security-check.tmp"
"`$env:AWS_ACCESS_KEY_ID = `"AKIA1234567890ABCDEF`"" | Out-File -FilePath `$TestFile

# Stage the test file
git add `$TestFile

# Run the security check
powershell.exe -ExecutionPolicy Bypass -File "scripts/security/pre-commit-security-check.ps1"

# Clean up
git reset HEAD `$TestFile
Remove-Item `$TestFile -Force

Write-Host "✅ Security check test completed" -ForegroundColor Green
"@

$TestScriptPath = "scripts/security/test-security-check.ps1"
$TestScript | Out-File -FilePath $TestScriptPath -Encoding UTF8

Write-Host "✅ Test script created: $TestScriptPath" -ForegroundColor Green

# Create a manual security scan script
$ScanScript = @"
# SafeMate Manual Security Scan
# Run this script to scan the entire repository for secrets

Write-Host "🔍 SafeMate Manual Security Scan" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Define secret patterns
`$SecretPatterns = @(
    @{ Pattern = "AKIA[0-9A-Z]{16}"; Description = "AWS Access Key ID" },
    @{ Pattern = "[0-9a-zA-Z/+=]{40}"; Description = "AWS Secret Access Key" },
    @{ Pattern = "-----BEGIN.*PRIVATE KEY-----"; Description = "Private Key" },
    @{ Pattern = "password\s*=\s*['\"][^'\"]{8,}['\"]"; Description = "Hardcoded Password" },
    @{ Pattern = "secret\s*=\s*['\"][^'\"]{8,}['\"]"; Description = "Hardcoded Secret" },
    @{ Pattern = "api[_-]?key\s*=\s*['\"][^'\"]{8,}['\"]"; Description = "API Key" }
)

`$ErrorCount = 0
`$FileCount = 0

# Get all files to scan
`$Files = Get-ChildItem -Recurse -File | Where-Object {
    `$_.Extension -notin @('.zip', '.exe', '.dll', '.so', '.dylib', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf') -and
    `$_.FullName -notlike "*node_modules*" -and
    `$_.FullName -notlike "*.git*" -and
    `$_.Length -lt 10MB
}

Write-Host "📁 Scanning `$(`$Files.Count) files..." -ForegroundColor Yellow

foreach (`$File in `$Files) {
    `$FileCount++
    if (`$FileCount % 100 -eq 0) {
        Write-Host "   Processed `$FileCount files..." -ForegroundColor Gray
    }
    
    try {
        `$Content = Get-Content `$File.FullName -Raw -ErrorAction Stop
        
        foreach (`$SecretPattern in `$SecretPatterns) {
            if (`$Content -match `$SecretPattern.Pattern) {
                Write-Host "❌ SECURITY VIOLATION in `$(`$File.FullName)" -ForegroundColor Red
                Write-Host "   Found: `$(`$SecretPattern.Description)" -ForegroundColor Red
                Write-Host ""
                `$ErrorCount++
            }
        }
    }
    catch {
        # Skip files that can't be read
    }
}

Write-Host "=================================" -ForegroundColor Green
if (`$ErrorCount -eq 0) {
    Write-Host "✅ Security scan completed - No secrets found!" -ForegroundColor Green
} else {
    Write-Host "❌ Security scan completed - Found `$ErrorCount potential secrets!" -ForegroundColor Red
    Write-Host "   Please review and remove these secrets before committing" -ForegroundColor Red
}
"@

$ScanScriptPath = "scripts/security/manual-security-scan.ps1"
$ScanScript | Out-File -FilePath $ScanScriptPath -Encoding UTF8

Write-Host "✅ Manual security scan script created: $ScanScriptPath" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Security hooks setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the setup: .\scripts\security\test-security-check.ps1" -ForegroundColor Yellow
Write-Host "2. Run manual scan: .\scripts\security\manual-security-scan.ps1" -ForegroundColor Yellow
Write-Host "3. Read security guide: docs\guides\SECURITY_AND_SECRET_MANAGEMENT.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔐 Your repository is now protected against accidental secret commits!" -ForegroundColor Green
