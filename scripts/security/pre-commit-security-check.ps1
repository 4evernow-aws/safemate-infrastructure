# SafeMate Pre-Commit Security Check
# This script prevents accidental commits of sensitive data

param(
    [string]$CommitMessage = "",
    [string]$StagedFiles = ""
)

Write-Host "🔐 SafeMate Pre-Commit Security Check" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$ErrorCount = 0
$WarningCount = 0

# Define secret patterns to check
$SecretPatterns = @(
    @{ Pattern = "AKIA[0-9A-Z]{16}"; Description = "AWS Access Key ID" },
    @{ Pattern = "[0-9a-zA-Z/+=]{40}"; Description = "AWS Secret Access Key" },
    @{ Pattern = "-----BEGIN.*PRIVATE KEY-----"; Description = "Private Key" },
    @{ Pattern = "-----BEGIN.*RSA PRIVATE KEY-----"; Description = "RSA Private Key" },
    @{ Pattern = "-----BEGIN.*DSA PRIVATE KEY-----"; Description = "DSA Private Key" },
    @{ Pattern = "-----BEGIN.*EC PRIVATE KEY-----"; Description = "EC Private Key" },
    @{ Pattern = "password\s*=\s*['\"][^'\"]{8,}['\"]"; Description = "Hardcoded Password" },
    @{ Pattern = "secret\s*=\s*['\"][^'\"]{8,}['\"]"; Description = "Hardcoded Secret" },
    @{ Pattern = "api[_-]?key\s*=\s*['\"][^'\"]{8,}['\"]"; Description = "API Key" },
    @{ Pattern = "token\s*=\s*['\"][^'\"]{8,}['\"]"; Description = "Token" }
)

# Get staged files
$StagedFilesList = if ($StagedFiles) { 
    $StagedFiles -split "`n" | Where-Object { $_ -ne "" }
} else {
    git diff --cached --name-only
}

Write-Host "📁 Checking $(($StagedFilesList | Measure-Object).Count) staged files..." -ForegroundColor Yellow

foreach ($File in $StagedFilesList) {
    if (-not (Test-Path $File)) {
        continue
    }
    
    # Skip binary files
    $FileInfo = Get-Item $File
    if ($FileInfo.Length -gt 10MB) {
        Write-Host "⏭️  Skipping large file: $File" -ForegroundColor Gray
        continue
    }
    
    # Skip certain file types
    $SkipExtensions = @('.zip', '.exe', '.dll', '.so', '.dylib', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf')
    if ($SkipExtensions -contains $FileInfo.Extension) {
        continue
    }
    
    try {
        $Content = Get-Content $File -Raw -ErrorAction Stop
        
        foreach ($SecretPattern in $SecretPatterns) {
            if ($Content -match $SecretPattern.Pattern) {
                Write-Host "❌ SECURITY VIOLATION in $File" -ForegroundColor Red
                Write-Host "   Found: $($SecretPattern.Description)" -ForegroundColor Red
                Write-Host "   Pattern: $($SecretPattern.Pattern)" -ForegroundColor Red
                Write-Host ""
                $ErrorCount++
            }
        }
    }
    catch {
        Write-Host "⚠️  Could not read file: $File" -ForegroundColor Yellow
        $WarningCount++
    }
}

# Check for .env files
$EnvFiles = $StagedFilesList | Where-Object { $_ -match '\.env$' -and $_ -notmatch '\.env\.example$' }
if ($EnvFiles) {
    Write-Host "❌ SECURITY VIOLATION: .env files detected" -ForegroundColor Red
    foreach ($EnvFile in $EnvFiles) {
        Write-Host "   $EnvFile" -ForegroundColor Red
    }
    Write-Host "   Use .env.example instead and set actual values in environment" -ForegroundColor Red
    Write-Host ""
    $ErrorCount++
}

# Check for credential files
$CredentialFiles = $StagedFilesList | Where-Object { 
    $_ -match 'credential|secret|key|token' -and 
    $_ -notmatch '\.example$' -and 
    $_ -notmatch '\.template$' -and
    $_ -notmatch '\.md$' -and
    $_ -notmatch '\.txt$'
}
if ($CredentialFiles) {
    Write-Host "⚠️  WARNING: Potential credential files detected" -ForegroundColor Yellow
    foreach ($CredFile in $CredentialFiles) {
        Write-Host "   $CredFile" -ForegroundColor Yellow
    }
    Write-Host "   Please verify these files don't contain sensitive data" -ForegroundColor Yellow
    Write-Host ""
    $WarningCount++
}

# Summary
Write-Host "=====================================" -ForegroundColor Green
if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✅ Security check passed! Safe to commit." -ForegroundColor Green
    exit 0
}
elseif ($ErrorCount -eq 0) {
    Write-Host "⚠️  Security check completed with $WarningCount warnings" -ForegroundColor Yellow
    Write-Host "   Please review warnings before committing" -ForegroundColor Yellow
    exit 0
}
else {
    Write-Host "❌ Security check FAILED with $ErrorCount errors and $WarningCount warnings" -ForegroundColor Red
    Write-Host ""
    Write-Host "🚨 COMMIT BLOCKED - Security violations detected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix these issues:" -ForegroundColor Yellow
    Write-Host "1. Remove sensitive data from files" -ForegroundColor Yellow
    Write-Host "2. Use environment variables instead" -ForegroundColor Yellow
    Write-Host "3. Add files to .gitignore if they contain secrets" -ForegroundColor Yellow
    Write-Host "4. Use .env.example for templates" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For help, see: docs/guides/SECURITY_AND_SECRET_MANAGEMENT.md" -ForegroundColor Cyan
    exit 1
}
