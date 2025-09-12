# SafeMate Development Setup Script
# This script ensures team members are using the new modular system

Write-Host "🚀 SafeMate Development Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if we're in the right directory
$currentDir = Get-Location
if ($currentDir.Path -notlike "*safemate_v2*") {
    Write-Host "❌ Error: Please run this script from the safemate_v2 directory" -ForegroundColor Red
    Write-Host "Current directory: $($currentDir.Path)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Current directory: $($currentDir.Path)" -ForegroundColor Green

# Navigate to the safemate directory
$safemateDir = Join-Path $currentDir "apps\web\safemate"
if (-not (Test-Path $safemateDir)) {
    Write-Host "❌ Error: safemate directory not found at $safemateDir" -ForegroundColor Red
    exit 1
}

Set-Location $safemateDir
Write-Host "✅ Navigated to: $(Get-Location)" -ForegroundColor Green

# Check git status
Write-Host "`n📋 Checking Git Status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
$currentBranch = git branch --show-current

Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

if ($currentBranch -ne "team/wallet-widgets") {
    Write-Host "⚠️  Warning: You're not on the team/wallet-widgets branch" -ForegroundColor Yellow
    Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
    $switchBranch = Read-Host "Do you want to switch to team/wallet-widgets? (y/n)"
    if ($switchBranch -eq "y" -or $switchBranch -eq "Y") {
        git checkout team/wallet-widgets
        Write-Host "✅ Switched to team/wallet-widgets branch" -ForegroundColor Green
    }
}

# Check for uncommitted changes
if ($gitStatus) {
    Write-Host "⚠️  Warning: You have uncommitted changes:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    $commitChanges = Read-Host "Do you want to commit these changes before continuing? (y/n)"
    if ($commitChanges -eq "y" -or $commitChanges -eq "Y") {
        $commitMessage = Read-Host "Enter commit message"
        git add .
        git commit -m $commitMessage
        Write-Host "✅ Changes committed" -ForegroundColor Green
    }
}

# Pull latest changes
Write-Host "`n📥 Pulling latest changes..." -ForegroundColor Yellow
git pull origin team/wallet-widgets
Write-Host "✅ Latest changes pulled" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "`n📦 Checking for dependency updates..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies up to date" -ForegroundColor Green
}

# Kill any existing Node processes
Write-Host "`n🔄 Stopping any existing development servers..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Stopped $($nodeProcesses.Count) Node processes" -ForegroundColor Green
}

# Clear Vite cache
Write-Host "`n🧹 Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
    Write-Host "✅ Vite cache cleared" -ForegroundColor Green
}

# Check if port 5173 is available
Write-Host "`n🔍 Checking if port 5173 is available..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":5173"
if ($portCheck) {
    Write-Host "⚠️  Warning: Port 5173 is in use" -ForegroundColor Yellow
    Write-Host "You may need to stop the process using this port" -ForegroundColor Yellow
}

# Start development server
Write-Host "`n🚀 Starting development server..." -ForegroundColor Yellow
Write-Host "The server will start in the background" -ForegroundColor Cyan
Write-Host "You can access it at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan

# Start the development server
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow

Write-Host "`n✅ Development environment is ready!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🌐 Open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📋 Remember to use the new modular dashboard system" -ForegroundColor Cyan
Write-Host "📖 Check documentation/TEAM_DEVELOPMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host "📚 Full documentation available at: documentation/README.md" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
