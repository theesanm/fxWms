param(
    [string]$Port = "9000",
    [string]$InstallPath = "C:\AdminPortal"
)

# Run as administrator
$ErrorActionPreference = "Stop"

Write-Host "Starting Admin Portal installation..." -ForegroundColor Cyan

# 1. Install Node.js if not present
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 2. Create installation directory
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force
}

# 3. Copy application files
Write-Host "Copying application files..." -ForegroundColor Yellow
Copy-Item -Path ".\.next\standalone\*" -Destination $InstallPath -Recurse -Force
Copy-Item -Path ".\public" -Destination $InstallPath -Recurse -Force
Copy-Item -Path ".\.next\static" -Destination "$InstallPath\.next\" -Recurse -Force

# 4. Copy existing .env file (preserves PostgREST configuration)
if (Test-Path ".env") {
    Copy-Item -Path ".env" -Destination $InstallPath -Force
}

# 5. Install node-windows
Write-Host "Installing node-windows..." -ForegroundColor Yellow
Set-Location $InstallPath
npm install node-windows --save

# 6. Create service installation script
$serviceScript = @"
const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
    name: 'AdminPortal',
    description: 'Admin Portal Service',
    script: path.join(__dirname, 'server.js'),
    nodeOptions: [],
    env: [
        {
            name: "PORT",
            value: $Port
        },
        {
            name: "NODE_ENV",
            value: "production"
        }
    ]
});

svc.on('install', () => {
    svc.start();
    console.log('Service installed successfully');
});

svc.install();
"@ 
$serviceScript | Out-File -FilePath "$InstallPath\install-service.js" -Encoding UTF8 -Force

# 7. Configure firewall
Write-Host "Configuring firewall..." -ForegroundColor Yellow
$ruleName = "AdminPortal"
if (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue) {
    Remove-NetFirewallRule -Name $ruleName
}
New-NetFirewallRule -Name $ruleName -DisplayName "Admin Portal" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow

# 8. Install and start the service
Write-Host "Installing Windows Service..." -ForegroundColor Yellow
node install-service.js

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "The application should be available at: http://localhost:$Port" -ForegroundColor Yellow

Write-Host "`nTo uninstall:" -ForegroundColor Cyan
Write-Host "1. Run 'node $InstallPath\uninstall-service.js'" -ForegroundColor Yellow
Write-Host "2. Delete the $InstallPath directory" -ForegroundColor Yellow

