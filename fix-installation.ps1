# Fix missing standalone build
Write-Host "Fixing missing standalone build..." -ForegroundColor Yellow
$sourcePath = "C:\Projects\fxWMS\React\admin-portal"
$destinationPath = "C:\AdminPortal"

# Rebuild the standalone version
Set-Location $sourcePath
npm run build
if (-not $?) {
    Write-Host "Error: Build failed" -ForegroundColor Red
    exit 1
}

# Copy the standalone build
Copy-Item -Path "$sourcePath\.next\standalone\*" -Destination "$destinationPath" -Recurse -Force
Copy-Item -Path "$sourcePath\.next\static" -Destination "$destinationPath\.next\" -Recurse -Force

# Fix service configuration
Write-Host "Fixing service configuration..." -ForegroundColor Yellow
$service = Get-Service -Name "AdminPortal" -ErrorAction SilentlyContinue
if ($service) {
    Stop-Service "AdminPortal"
    # Reinstall service with correct account
    node "$destinationPath\install-service.js"
}

# Verify port availability
Write-Host "Checking port 9000..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "Port 9000 is in use by process ID: $($portCheck.OwningProcess)" -ForegroundColor Red
    $process = Get-Process -Id $portCheck.OwningProcess
    Write-Host "Process name: $($process.ProcessName)" -ForegroundColor Red
    Write-Host "Please stop this process before continuing" -ForegroundColor Yellow
}

# Run verification again
Write-Host "`nRunning verification..." -ForegroundColor Cyan
& "$sourcePath\verify-installation.ps1"