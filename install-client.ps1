param(
    [string]$Port = "9000",
    [string]$SourcePath = "C:\Projects\fxWMS\React\admin-portal",
    [string]$InstallPath = "C:\AdminPortal"
)

# Run as administrator
$ErrorActionPreference = "Stop"

function Test-PortInUse {
    param([int]$Port)
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        $processName = (Get-Process -Id $portInUse.OwningProcess -ErrorAction SilentlyContinue).ProcessName
        return @{
            InUse = $true
            ProcessId = $portInUse.OwningProcess
            ProcessName = $processName
        }
    }
    return @{
        InUse = $false
    }
}

function Test-AdminRights {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-RequiredModules {
    # Check if node-windows is installed
    Write-Host "Checking for node-windows..." -ForegroundColor Yellow
    $nodeWindowsPath = "$SourcePath\node_modules\node-windows"
    
    if (-not (Test-Path $nodeWindowsPath)) {
        Write-Host "Installing node-windows..." -ForegroundColor Yellow
        Push-Location $SourcePath
        npm install node-windows --save
        Pop-Location
    } else {
        Write-Host "node-windows is already installed." -ForegroundColor Green
    }
}

function Configure-UrlAcl {
    param([string]$Port)
    
    $url = "http://+:$Port/"
    $User = "NT AUTHORITY\NETWORK SERVICE"
    
    # Check if URL ACL already exists
    $existingAcls = & netsh http show urlacl url=$url 2>&1
    
    if ($existingAcls -match "URL reservation successfully") {
        Write-Host "URL ACL already exists for $url" -ForegroundColor Green
    } else {
        # Remove existing reservation if it exists but with different user
        if ($existingAcls -match "Reserved URL") {
            Write-Host "Removing existing URL ACL for $url" -ForegroundColor Yellow
            $null = & netsh http delete urlacl url=$url 2>&1
        }
        
        # Add new reservation
        $null = & netsh http add urlacl url=$url user="$User" listen=yes 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "URL ACL configured successfully for $url" -ForegroundColor Green
        } else {
            Write-Host "Warning: Failed to configure URL ACL for $url" -ForegroundColor Yellow
        }
    }
}

function Set-FirewallRule {
    param([string]$Port)
    
    $ruleName = "AdminPortal_$Port"
    
    # Remove existing rule if it exists
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Host "Removing existing firewall rule: $ruleName" -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName $ruleName
    }
    
    # Create new rule
    Write-Host "Creating firewall rule: $ruleName for port $Port" -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Any | Out-Null
    Write-Host "Firewall rule created successfully" -ForegroundColor Green
}

# Check if running as administrator
if (-not (Test-AdminRights)) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Check if port is in use
$portCheck = Test-PortInUse -Port $Port
if ($portCheck.InUse) {
    Write-Host "Port $Port is already in use by process $($portCheck.ProcessId) ($($portCheck.ProcessName))." -ForegroundColor Red
    Write-Host "Please choose a different port or stop the process using this port." -ForegroundColor Red
    exit 1
}

# Ensure source path exists
if (-not (Test-Path $SourcePath)) {
    Write-Host "Source path does not exist: $SourcePath" -ForegroundColor Red
    exit 1
}

# Ensure .next directory exists in source
if (-not (Test-Path "$SourcePath\.next")) {
    Write-Host "No .next directory found in source path. Please build the application first." -ForegroundColor Red
    exit 1
}

# Ensure standalone directory exists in .next
if (-not (Test-Path "$SourcePath\.next\standalone")) {
    Write-Host "No standalone directory found in .next. Please build with 'output: standalone' in next.config.js." -ForegroundColor Red
    exit 1
}

# Create install directory if it doesn't exist
if (-not (Test-Path $InstallPath)) {
    Write-Host "Creating installation directory: $InstallPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
} else {
    Write-Host "Installation directory already exists: $InstallPath" -ForegroundColor Yellow
    
    # Check if service is already installed
    $serviceExists = Get-Service -Name "AdminPortal" -ErrorAction SilentlyContinue
    if ($serviceExists) {
        Write-Host "AdminPortal service is already installed. Stopping and removing..." -ForegroundColor Yellow
        
        # Stop the service if it's running
        if ($serviceExists.Status -eq "Running") {
            Stop-Service -Name "AdminPortal" -Force
            Write-Host "Service stopped." -ForegroundColor Green
        }
        
        # Run the uninstall script if it exists
        $uninstallScript = "$InstallPath\uninstall-service.js"
        if (Test-Path $uninstallScript) {
            Write-Host "Running service uninstall script..." -ForegroundColor Yellow
            Push-Location $InstallPath
            node $uninstallScript
            Pop-Location
            
            # Wait for service to be fully uninstalled
            $timeout = 30
            $elapsed = 0
            while (Get-Service -Name "AdminPortal" -ErrorAction SilentlyContinue) {
                Start-Sleep -Seconds 1
                $elapsed++
                if ($elapsed -ge $timeout) {
                    Write-Host "Timeout waiting for service to uninstall." -ForegroundColor Red
                    exit 1
                }
            }
            
            Write-Host "Service uninstalled." -ForegroundColor Green
        } else {
            Write-Host "Uninstall script not found. Service may need to be removed manually." -ForegroundColor Red
            exit 1
        }
    }
    
    # Clean the directory
    Write-Host "Cleaning installation directory..." -ForegroundColor Yellow
    Get-ChildItem -Path $InstallPath -Recurse | Remove-Item -Recurse -Force
}

# Install required modules
Install-RequiredModules

# Configure URL ACL
Configure-UrlAcl -Port $Port

# Set firewall rule
Set-FirewallRule -Port $Port

# Copy files to installation directory
Write-Host "Copying standalone contents to root..." -ForegroundColor Yellow
Copy-Item -Path "$SourcePath\.next\standalone\*" -Destination "$InstallPath" -Recurse -Force

# Copy complete .next directory structure
Write-Host "Copying .next directory..." -ForegroundColor Yellow
Copy-Item -Path "$SourcePath\.next\*" -Destination "$InstallPath\.next\" -Recurse -Force

# Ensure static files are in place
Write-Host "Verifying static files..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\.next\static") {
    Copy-Item -Path "$SourcePath\.next\static" -Destination "$InstallPath\.next\" -Recurse -Force
}

# Copy public files
Write-Host "Copying public assets..." -ForegroundColor Yellow
if (Test-Path "$SourcePath\public") {
    New-Item -ItemType Directory -Path "$InstallPath\public" -Force | Out-Null
    Copy-Item -Path "$SourcePath\public\*" -Destination "$InstallPath\public\" -Recurse -Force
}

# Verify the directory structure
Write-Host "Verifying directory structure..." -ForegroundColor Yellow
$requiredPaths = @(
    "$InstallPath\server.js",
    "$InstallPath\standalone",
    "$InstallPath\standalone\server.js",
    "$InstallPath\.next",
    "$InstallPath\.next\server",
    "$InstallPath\.next\static",
    "$InstallPath\.next\build-manifest.json",
    "$InstallPath\.next\server\pages-manifest.json",
    "$InstallPath\public",
    "$InstallPath\public\images"
)

foreach ($path in $requiredPaths) {
    if (-not (Test-Path $path)) {
        Write-Host "Error: Required path not found: $path" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Verified path exists: $path" -ForegroundColor Green
    }
}

# Display directory structure for verification
Write-Host "`nDirectory structure:" -ForegroundColor Cyan
Get-ChildItem $InstallPath -Recurse -Directory | Select-Object FullName

# Create service installation script
Write-Host "Creating service installation script..." -ForegroundColor Yellow
$serviceScript = @"
const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
    name: 'AdminPortal',
    description: 'Admin Portal Service',
    script: path.join(__dirname, 'server.js'),
    workingDirectory: '${InstallPath.Replace("\","/")}',
    nodeOptions: [],
    env: [
        {
            name: "PORT",
            value: $Port
        },
        {
            name: "NODE_ENV",
            value: "production"
        },
        {
            name: "IMAGE_UPLOAD_PATH",
            value: path.join('${InstallPath.Replace("\","/")}', 'public', 'images')
        },
        {
            name: "POSTGREST_URL",
            value: "http://localhost:3000"
        }
    ]
});

svc.on('install', () => {
    svc.start();
    console.log('Service installed successfully');
});

svc.install();
"@

Set-Content -Path "$InstallPath\install-service.js" -Value $serviceScript -Encoding UTF8

# Create uninstall service script
Write-Host "Creating service uninstall script..." -ForegroundColor Yellow
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

Set-Content -Path "$InstallPath\uninstall-service.js" -Value $uninstallScript -Encoding UTF8

# Create batch files for easy service management
Write-Host "Creating service management batch files..." -ForegroundColor Yellow

# Install service batch file
$installBatch = @"
@echo off
echo Installing AdminPortal service...
node install-service.js
pause
"@
Set-Content -Path "$InstallPath\install-service.bat" -Value $installBatch -Encoding ASCII

# Uninstall service batch file
$uninstallBatch = @"
@echo off
echo Uninstalling AdminPortal service...
node uninstall-service.js
pause
"@
Set-Content -Path "$InstallPath\uninstall-service.bat" -Value $uninstallBatch -Encoding ASCII

# Create images directory if it doesn't exist
if (-not (Test-Path "$InstallPath\public\images")) {
    New-Item -ItemType Directory -Path "$InstallPath\public\images" -Force | Out-Null
}

# Install the service
Write-Host "Installing the service..." -ForegroundColor Yellow
Push-Location $InstallPath
node install-service.js
Pop-Location

# Wait for service to be installed and started
$timeout = 30
$elapsed = 0
$serviceStarted = $false

while (-not $serviceStarted -and $elapsed -lt $timeout) {
    $service = Get-Service -Name "AdminPortal" -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq "Running") {
        $serviceStarted = $true
    } else {
        Start-Sleep -Seconds 1
        $elapsed++
    }
}

if ($serviceStarted) {
    Write-Host "Service installed and started successfully!" -ForegroundColor Green
    Write-Host "The AdminPortal is now running at http://localhost:$Port" -ForegroundColor Cyan
} else {
    Write-Host "Service installation may have failed or service did not start within the timeout period." -ForegroundColor Red
    Write-Host "Please check the Windows Event Viewer for more details." -ForegroundColor Yellow
}

Write-Host "`nInstallation completed. Service management files are in $InstallPath" -ForegroundColor Green
Write-Host "To manually manage the service, use the following batch files:" -ForegroundColor Cyan
Write-Host "  - $InstallPath\install-service.bat" -ForegroundColor Cyan
Write-Host "  - $InstallPath\uninstall-service.bat" -ForegroundColor Cyan
