# LoveSpace Development Startup Script
# This script starts Metro bundler in a separate window and builds the app

Write-Host "Starting LoveSpace Development Environment..." -ForegroundColor Green

# Start Metro bundler in a new PowerShell window
Write-Host "Opening Metro Bundler in a new window..." -ForegroundColor Yellow
$metroScript = @"
cd '$PWD'
npm start
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $metroScript

# Wait a few seconds for Metro to initialize
Write-Host "Waiting for Metro to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Build and install the app
Write-Host "Building and installing app on device..." -ForegroundColor Yellow
npm run android

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "- Metro bundler is running in the other window (keep it open!)" -ForegroundColor Cyan
Write-Host "- Make changes to your code and save to see hot reload" -ForegroundColor Cyan
Write-Host "- Press 'R' twice in Metro window to manually reload" -ForegroundColor Cyan
Write-Host "- Only rebuild (npm run android) when adding native dependencies" -ForegroundColor Cyan

