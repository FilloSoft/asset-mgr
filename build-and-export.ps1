# PowerShell script to build and export Docker images for sharing

Write-Host "Building Docker images..." -ForegroundColor Green

# Build the images using docker-compose
docker-compose build

# Export the Next.js app image
Write-Host "Exporting asset-mgr app image..." -ForegroundColor Green
docker save -o asset-mgr-app.tar asset-mgr-nextjs-app

# We don't need to export postgres since it's a standard image
Write-Host "Images exported successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "  - asset-mgr-app.tar (your application)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Send these files to your friend along with the docker-compose.friend.yml file" -ForegroundColor Cyan