param(
    [string]$Port = "9000",
    [string]$SourcePath = "C:\Projects\fxWMS\React\admin-portal",
    [string]$InstallPath = "C:\AdminPortal"
)

# Run as administrator
$ErrorActionPreference = "Stop"

# Verify running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Error: Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Admin Portal client installation..." -ForegroundColor Cyan

# 1. Verify source files exist
if (-not (Test-Path $SourcePath)) {
    Write-Host "Error: Source path $SourcePath not found" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$SourcePath\.next\standalone")) {
    Write-Host "Error: Required build files not found in source path" -ForegroundColor Red
    exit 1
}

# 2. Install Node.js if not present
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Node.js..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 3. Create installation directory
if (Test-Path $InstallPath) {
    Write-Host "Removing existing installation..." -ForegroundColor Yellow
    Remove-Item -Path $InstallPath -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

# 4. Copy application files
Write-Host "Copying application files..." -ForegroundColor Yellow
Copy-Item -Path "$SourcePath\.next\standalone\*" -Destination $InstallPath -Recurse -Force
Copy-Item -Path "$SourcePath\public" -Destination $InstallPath -Recurse -Force
Copy-Item -Path "$SourcePath\.next\static" -Destination "$InstallPath\.next\" -Recurse -Force

# 5. Copy .env file if it exists
if (Test-Path "$SourcePath\.env") {
    Copy-Item -Path "$SourcePath\.env" -Destination $InstallPath -Force
}

# 6. Check and Install node-windows if not present
Write-Host "Checking for node-windows..." -ForegroundColor Yellow
Set-Location $InstallPath

$nodeWindowsInstalled = $false
if (Test-Path "$InstallPath\node_modules\node-windows") {
    try {
        # Try to require node-windows to verify it's properly installed
        $null = & node -e "require('node-windows')" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $nodeWindowsInstalled = $true
            Write-Host "node-windows is already installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "Existing node-windows installation appears corrupted" -ForegroundColor Yellow
    }
}

if (-not $nodeWindowsInstalled) {
    Write-Host "Installing node-windows..." -ForegroundColor Yellow
    try {
        # Redirect npm output to null and only show errors
        $null = & npm install node-windows --save --no-audit --no-fund 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Host "Error installing node-windows: $_" -ForegroundColor Red
        exit 1
    }
}

# Check if port is available
Write-Host "Checking port $Port availability..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Error: Port $Port is already in use by process ID: $($portInUse.OwningProcess)" -ForegroundColor Red
    $processName = (Get-Process -Id $portInUse.OwningProcess).ProcessName
    Write-Host "Process using the port: $processName" -ForegroundColor Red
    
    $response = Read-Host "Do you want to kill the process using port $Port? (Y/N)"
    if ($response -eq 'Y') {
        Stop-Process -Id $portInUse.OwningProcess -Force
        Start-Sleep -Seconds 2
    } else {
        exit 1
    }
}

# Reserve URL ACL for non-admin access
Write-Host "Configuring URL ACL..." -ForegroundColor Yellow
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$urlReservation = "http://+:$Port/"
try {
    # Remove existing URL reservation if any
    $null = & netsh http delete urlacl url=$urlReservation 2>&1
    
    # Add new URL reservation
    $null = & netsh http add urlacl url=$urlReservation user="$currentUser" listen=yes 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add URL ACL"
    }
    Write-Host "URL ACL configured successfully" -ForegroundColor Green
} catch {
    Write-Host "Error configuring URL ACL: $_" -ForegroundColor Red
    exit 1
}

# 7. Create service installation script
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
    ],
    maxRestarts: 3,
    maxRetries: 3,
    stopparentfirst: true,
    wait: 2,
    grow: .5,
    logging: 'all',
    // Add these options for running as system
    allowServiceLogon: true
});

svc.on('install', () => {
    svc.start();
    console.log('Service installed successfully');
});

svc.on('error', (error) => {
    console.error('Service error:', error);
});

svc.on('start', () => {
    console.log('Service started');
});

svc.on('stop', () => {
    console.log('Service stopped');
});

svc.on('exit', (code) => {
    console.log('Service exit with code:', code);
});

svc.install();
"@

$serviceScript | Out-File -FilePath "$InstallPath\install-service.js" -Encoding UTF8 -Force

# 8. Create uninstall service script
$uninstallScript = @"
const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
    name: 'AdminPortal',
    script: path.join(__dirname, 'server.js')
});

svc.on('uninstall', () => {
    console.log('Service uninstalled successfully');
});

svc.uninstall();
"@

$uninstallScript | Out-File -FilePath "$InstallPath\uninstall-service.js" -Encoding UTF8 -Force

# 9. Configure Windows Firewall
$ruleName = "AdminPortal_$Port"
if (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue) {
    Remove-NetFirewallRule -Name $ruleName
}
New-NetFirewallRule -Name $ruleName -DisplayName "Admin Portal" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow

# 10. Install and start the service
Write-Host "Installing Windows Service..." -ForegroundColor Yellow
try {
    $null = & node install-service.js 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Service installation failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "Error installing service: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "The application should be available at: http://localhost:$Port" -ForegroundColor Yellow

Write-Host "`nTo uninstall:" -ForegroundColor Cyan
Write-Host "1. Run 'node $InstallPath\uninstall-service.js'" -ForegroundColor Yellow
Write-Host "2. Delete the $InstallPath directory" -ForegroundColor Yellow
Write-Host "3. Remove firewall rule: Remove-NetFirewallRule -Name `"$ruleName`"" -ForegroundColor Yellow

# Add logging directory creation
New-Item -ItemType Directory -Path "$InstallPath\logs" -Force | Out-Null

Write-Host "`nService Logs Location:" -ForegroundColor Cyan
Write-Host "Check these locations for troubleshooting:" -ForegroundColor Yellow
Write-Host "1. $InstallPath\logs" -ForegroundColor Yellow
Write-Host "2. $env:SystemRoot\System32\winevt\Logs\Application.evtx" -ForegroundColor Yellow

# Add cleanup instructions
Write-Host "`nTo remove URL ACL reservation when uninstalling:" -ForegroundColor Cyan
Write-Host "Run: netsh http delete urlacl url=http://+:$Port/" -ForegroundColor Yellow



