#!/usr/bin/env pwsh

Write-Host "Building Lambda Functions..." -ForegroundColor Green

# Lambda services to build
$services = @(
    "group-manager",
    "hedera-service", 
    "token-vault",
    "user-onboarding",
    "wallet-manager"
)

foreach ($service in $services) {
    Write-Host "Building $service..." -ForegroundColor Yellow
    
    $servicePath = "services\$service"
    $zipPath = "$servicePath\$service.zip"
    
    if (Test-Path $servicePath) {
        # Create temporary directory for clean build
        $tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
        
        try {
            # Copy only necessary files (exclude node_modules, .git, etc.)
            Copy-Item "$servicePath\index.js" -Destination $tempDir -Force
            Copy-Item "$servicePath\package.json" -Destination $tempDir -Force
            
            # Install production dependencies in temp directory
            Push-Location $tempDir
            npm install --production --silent
            Pop-Location
            
            # Create zip from temp directory
            Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
            
            # Check file size
            $fileSize = (Get-Item $zipPath).Length
            $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
            
            if ($fileSizeMB -lt 50) {
                Write-Host "SUCCESS: $service built successfully: $fileSizeMB MB" -ForegroundColor Green
            } else {
                Write-Host "WARNING: $service is large: $fileSizeMB MB" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "ERROR: Failed to build $service : $_" -ForegroundColor Red
        } finally {
            # Clean up temp directory
            Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "ERROR: Service directory not found: $servicePath" -ForegroundColor Red
    }
}

Write-Host "Lambda build complete!" -ForegroundColor Green 