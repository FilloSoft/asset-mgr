# PowerShell script for your friend to load and run the application

Write-Host "Loading Docker images..." -ForegroundColor Green

# Load the exported images
if (Test-Path "asset-mgr-app.tar") {
    docker load -i asset-mgr-app.tar
    Write-Host "App image loaded successfully!" -ForegroundColor Green
} else {
    Write-Host "Error: asset-mgr-app.tar not found!" -ForegroundColor Red
    exit 1
}

# Pull required images that aren't exported
Write-Host "Pulling required Docker images..." -ForegroundColor Green
docker pull postgres:16-alpine
docker pull dpage/pgadmin4:latest

# Start the application
Write-Host "Starting the application..." -ForegroundColor Green
docker-compose -f docker-compose.friend.yml up -d

Write-Host ""
Write-Host "Application is starting up!" -ForegroundColor Green
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  - App: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  - pgAdmin: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "It may take a minute for the database to initialize..." -ForegroundColor Cyan
Write-Host "To stop: docker-compose -f docker-compose.friend.yml down" -ForegroundColor Gray