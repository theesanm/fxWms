# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "Starting build process..." -ForegroundColor Cyan

# 1. Update next.config.js to ensure standalone output
$nextConfigPath = "next.config.js"
$nextConfigContent = @'
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // preserve existing config...
}

module.exports = nextConfig
'@

if (-not (Test-Path $nextConfigPath) -or -not (Get-Content $nextConfigPath -Raw).Contains("output: 'standalone'")) {
    Write-Host "Updating next.config.js to enable standalone output..." -ForegroundColor Yellow
    $nextConfigContent | Out-File -FilePath $nextConfigPath -Encoding UTF8
}

# 2. Run npm build
Write-Host "Running npm build..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully." -ForegroundColor Green

# 3. Run IIS deployment preparation
Write-Host "Preparing IIS deployment..." -ForegroundColor Cyan

# Create and clean deployment directory
$deployDir = "iis-deploy"
if (Test-Path $deployDir) {
    Write-Host "Cleaning existing deployment directory..." -ForegroundColor Yellow
    Remove-Item -Path $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null

# Copy standalone files with force flag
Write-Host "Copying standalone files..." -ForegroundColor Yellow
Copy-Item -Path ".next/standalone/*" -Destination $deployDir -Recurse -Force

# Create .next directory and copy static files
Write-Host "Copying static files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$deployDir/.next" | Out-Null
Copy-Item -Path ".next/static" -Destination "$deployDir/.next/" -Recurse -Force

# Copy public files
Write-Host "Copying public files..." -ForegroundColor Yellow
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination $deployDir -Recurse -Force
}

# Create deployment package
$deployPackageName = "iis-deploy-package.zip"
Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path $deployPackageName) {
    Remove-Item $deployPackageName -Force
}
Compress-Archive -Path "$deployDir\*" -DestinationPath $deployPackageName -Force

Write-Host "Deployment package created successfully!" -ForegroundColor Green
Write-Host "Package location: $(Get-Location)\$deployPackageName"
Write-Host "Deployment files location: $(Get-Location)\$deployDir"