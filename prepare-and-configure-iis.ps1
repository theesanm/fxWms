# Configuration
$siteName = "Default Web Site"
$appName = "fxWms"
$appPoolName = "React"
$physicalPath = "C:\inetpub\wwwroot\fxWms"

Write-Host "Starting deployment process..." -ForegroundColor Cyan

# Step 1: Build the Next.js application in standalone mode
Write-Host "Building Next.js application..." -ForegroundColor Yellow
try {
    # Ensure next.config.js has output: 'standalone'
    npm run build
    
    # Create deployment directory if it doesn't exist
    if (!(Test-Path $physicalPath)) {
        New-Item -ItemType Directory -Path $physicalPath -Force
    } else {
        Get-ChildItem -Path $physicalPath -Recurse | Remove-Item -Force -Recurse
    }

    # Copy the standalone build and required files
    Copy-Item ".next/standalone/*" -Destination $physicalPath -Recurse -Force
    Copy-Item ".next/static" -Destination "$physicalPath/.next/static" -Recurse -Force
    Copy-Item "public" -Destination $physicalPath -Recurse -Force
    
    # Important: Copy node_modules that are required for webpack
    Copy-Item "node_modules" -Destination $physicalPath -Recurse -Force
}
catch {
    Write-Host "Error during build and copy process: $_" -ForegroundColor Red
    exit 1
}

# Rest of your script...