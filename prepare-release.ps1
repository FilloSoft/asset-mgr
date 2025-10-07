# PowerShell script to prepare a release package locally

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "Building Asset Manager Release $Version..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Validate version format
if ($Version -notmatch '^v\d+\.\d+\.\d+$') {
    Write-Host "Error: Version must be in format 'v1.0.0'" -ForegroundColor Red
    exit 1
}

# Create release directory
$releaseDir = "release-$Version"
if (Test-Path $releaseDir) {
    Write-Host "Removing existing release directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $releaseDir
}
New-Item -ItemType Directory -Path $releaseDir | Out-Null

Write-Host "Building Docker image..." -ForegroundColor Blue
docker build -t asset-mgr-app:$Version .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Exporting Docker image..." -ForegroundColor Blue
docker save -o "$releaseDir\asset-mgr-app-$Version.tar" asset-mgr-app:$Version

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker export failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Copying friend configuration files..." -ForegroundColor Blue

# Copy essential files
Copy-Item "docker-compose.friend.yml" "$releaseDir\docker-compose.yml"
Copy-Item "friend-setup.ps1" "$releaseDir\"
Copy-Item "README-FRIEND.md" "$releaseDir\README.md"
Copy-Item "init.sql" "$releaseDir\"

# Create version info
@"
Asset Manager $Version
Built on: $(Get-Date)
Docker image: asset-mgr-app-$Version.tar

This package contains everything needed to run the Asset Manager application.
"@ | Out-File -FilePath "$releaseDir\VERSION.txt" -Encoding UTF8

# Create quick setup guide
@"
# Quick Setup Guide

## For Windows Users (Recommended)
1. Download and extract all files
2. Open PowerShell as Administrator
3. Navigate to the extracted folder
4. Run: ``.\friend-setup.ps1``
5. Access the app at: http://localhost:3000

## For Other Operating Systems
1. Download and extract all files
2. Load the Docker image: ``docker load -i asset-mgr-app-$Version.tar``
3. Start the services: ``docker-compose up -d``
4. Access the app at: http://localhost:3000

## What's Included
- Asset Manager application with web interface
- PostgreSQL database with sample data
- pgAdmin web interface for database management
- Interactive map for asset visualization
- Complete project management system

## System Requirements
- Docker and Docker Compose installed
- 4GB+ RAM recommended
- 2GB+ free disk space

## Default Access
- **Application**: http://localhost:3000
- **Database Admin**: http://localhost:8080
  - Email: admin@admin.com
  - Password: admin

## Troubleshooting
If ports 3000 or 8080 are in use, edit docker-compose.yml to change the port mappings.

For more detailed information, see README.md
"@ | Out-File -FilePath "$releaseDir\QUICK-SETUP.md" -Encoding UTF8

# Create Windows batch file
@"
@echo off
echo Starting Asset Manager setup...
echo.

echo Loading Docker image...
docker load -i asset-mgr-app-$Version.tar

if %ERRORLEVEL% NEQ 0 (
    echo Error loading Docker image!
    pause
    exit /b 1
)

echo Starting services...
docker-compose up -d

if %ERRORLEVEL% NEQ 0 (
    echo Error starting services!
    pause
    exit /b 1
)

echo.
echo Setup complete!
echo Access the application at: http://localhost:3000
echo Access database admin at: http://localhost:8080
echo.
echo To stop the application: docker-compose down
pause
"@ | Out-File -FilePath "$releaseDir\setup.bat" -Encoding ASCII

# Create Linux/Mac shell script
@"
#!/bin/bash
echo "Starting Asset Manager setup..."
echo

echo "Loading Docker image..."
docker load -i asset-mgr-app-$Version.tar

if [ `$? -ne 0 ]; then
    echo "Error loading Docker image!"
    exit 1
fi

echo "Starting services..."
docker-compose up -d

if [ `$? -ne 0 ]; then
    echo "Error starting services!"
    exit 1
fi

echo
echo "Setup complete!"
echo "Access the application at: http://localhost:3000"
echo "Access database admin at: http://localhost:8080"
echo
echo "To stop the application: docker-compose down"
"@ | Out-File -FilePath "$releaseDir\setup.sh" -Encoding UTF8

Write-Host "Creating release archives..." -ForegroundColor Blue

# Create ZIP archive for Windows users
$zipPath = "asset-manager-$Version.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipPath
    Write-Host "Created: $zipPath" -ForegroundColor Green
} else {
    Write-Host "Warning: PowerShell Compress-Archive not available. Please create ZIP manually." -ForegroundColor Yellow
}

# Create TAR.GZ for Linux/Mac users (if tar is available)
$targzPath = "asset-manager-$Version.tar.gz"
if (Get-Command tar -ErrorAction SilentlyContinue) {
    tar -czf $targzPath -C $releaseDir .
    Write-Host "Created: $targzPath" -ForegroundColor Green
} else {
    Write-Host "Warning: tar not available. TAR.GZ archive not created." -ForegroundColor Yellow
}

# Calculate checksums
Write-Host "Calculating checksums..." -ForegroundColor Blue
$checksums = @()

if (Test-Path $zipPath) {
    $zipHash = Get-FileHash $zipPath -Algorithm SHA256
    $checksums += "$($zipHash.Hash.ToLower())  $zipPath"
}

if (Test-Path $targzPath) {
    $targzHash = Get-FileHash $targzPath -Algorithm SHA256
    $checksums += "$($targzHash.Hash.ToLower())  $targzPath"
}

if ($checksums.Count -gt 0) {
    $checksums | Out-File -FilePath "checksums-$Version.txt" -Encoding UTF8
    Write-Host "Created: checksums-$Version.txt" -ForegroundColor Green
    Write-Host ""
    Write-Host "Checksums:" -ForegroundColor Yellow
    $checksums | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
}

Write-Host ""
Write-Host "Release $Version prepared successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  - $releaseDir\ (release directory)" -ForegroundColor White
if (Test-Path $zipPath) { Write-Host "  - $zipPath (Windows users)" -ForegroundColor White }
if (Test-Path $targzPath) { Write-Host "  - $targzPath (Linux/Mac users)" -ForegroundColor White }
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test the release package locally" -ForegroundColor White
Write-Host "2. Create a Git tag: git tag $Version" -ForegroundColor White
Write-Host "3. Push the tag: git push origin $Version" -ForegroundColor White
Write-Host "4. Create a GitHub release and upload the archives" -ForegroundColor White
Write-Host ""
Write-Host "Or use automated release:" -ForegroundColor Cyan
Write-Host "1. Push your code: git push" -ForegroundColor White
Write-Host "2. Go to GitHub Actions and run 'Build and Release Asset Manager'" -ForegroundColor White