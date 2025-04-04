param(
    [string]$InstallPath = "C:\AdminPortal"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting complete uninstallation..." -ForegroundColor Cyan

# Helper function to check if service exists
function Test-ServiceExists {
    param ([string]$ServiceName)
    
    $service = Get-WmiObject -Class Win32_Service -Filter "Name='$ServiceName'" -ErrorAction SilentlyContinue
    if ($service) {
        return $true
    }
    
    # Double check using sc.exe
    $result = sc.exe query $ServiceName 2>&1
    return -not ($result -like "*1060*")
}

# Helper function for forceful service removal
function Remove-ServiceForcefully {
    param ([string]$ServiceName)
    
    Write-Host "Attempting forceful service removal..." -ForegroundColor Yellow
    
    # Try multiple methods to remove the service
    try {
        # Method 1: Using sc.exe
        Start-Process "sc.exe" -ArgumentList "delete","$ServiceName" -Wait -NoNewWindow
        
        # Method 2: Using WMI
        $service = Get-WmiObject -Class Win32_Service -Filter "Name='$ServiceName'"
        if ($service) {
            $service.Delete()
        }
        
        # Method 3: Remove service registry keys
        $registryPaths = @(
            "HKLM:\SYSTEM\CurrentControlSet\Services\$ServiceName",
            "HKLM:\SYSTEM\CurrentControlSet\Services\EventLog\Application\$ServiceName"
        )
        
        foreach ($path in $registryPaths) {
            if (Test-Path $path) {
                Remove-Item -Path $path -Recurse -Force
                Write-Host "Removed registry key: $path" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "Warning during forceful removal: $_" -ForegroundColor Yellow
    }
}

# Add this function
function Remove-UrlAclAndPortReservation {
    param([string]$Port = "9000")
    
    $urlReservation = "http://+:$Port/"
    
    Write-Host "Removing URL ACL and port reservations..." -ForegroundColor Yellow
    
    # Remove URL ACL reservation
    try {
        $null = & netsh http delete urlacl url=$urlReservation 2>&1
        Write-Host "Removed URL ACL reservation for port $Port" -ForegroundColor Green
    } catch {
        Write-Host "Note: No URL ACL found for port $Port" -ForegroundColor Yellow
    }
    
    # Remove any port reservation
    try {
        $null = & netsh http delete iplisten ipaddress=0.0.0.0:$Port 2>&1
        Write-Host "Removed port reservation for $Port" -ForegroundColor Green
    } catch {
        Write-Host "Note: No port reservation found for $Port" -ForegroundColor Yellow
    }
}

# 1. Check and stop service
if (Test-ServiceExists -ServiceName "AdminPortal") {
    Write-Host "Stopping AdminPortal service..." -ForegroundColor Yellow
    Stop-Service -Name "AdminPortal" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 2. Clean up node-windows daemon
if (Test-Path "$InstallPath\uninstall-service.js") {
    Write-Host "Running node-windows uninstall script..." -ForegroundColor Yellow
    Set-Location $InstallPath
    node uninstall-service.js
    Start-Sleep -Seconds 5
}

# 3. Force remove service using multiple methods
Remove-ServiceForcefully -ServiceName "AdminPortal"

# 4. Clean up all related directories and files
$cleanupPaths = @(
    "$env:ProgramData\AdminPortal",
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\AdminPortal",
    "$env:LOCALAPPDATA\AdminPortal",
    "$InstallPath"
)

foreach ($path in $cleanupPaths) {
    if (Test-Path $path) {
        Write-Host "Removing directory: $path" -ForegroundColor Yellow
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 5. Remove event log source
if ([System.Diagnostics.EventLog]::SourceExists("AdminPortal")) {
    Write-Host "Removing event log source..." -ForegroundColor Yellow
    Remove-EventLog -Source "AdminPortal"
}

# 6. Remove firewall rules
Get-NetFirewallRule -DisplayName "Admin Portal*" -ErrorAction SilentlyContinue | Remove-NetFirewallRule

# 7. Clean up node-windows daemon files
$daemonPaths = @(
    "$env:ProgramData\AdminPortal",
    "$env:PROGRAMFILES\nodejs\node_modules\node-windows",
    "$env:USERPROFILE\AppData\Roaming\npm\node_modules\node-windows"
)

foreach ($path in $daemonPaths) {
    if (Test-Path $path) {
        Write-Host "Removing node-windows files: $path" -ForegroundColor Yellow
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Add this call before the final verification
Remove-UrlAclAndPortReservation

# 8. Final verification
if (-not (Test-ServiceExists -ServiceName "AdminPortal")) {
    Write-Host "Service is completely removed from the system" -ForegroundColor Green
    Write-Host "Uninstallation completed successfully" -ForegroundColor Green
} else {
    Write-Host "Warning: Service entries might still exist in the system." -ForegroundColor Red
    Write-Host "Please restart your computer and run this script again if needed." -ForegroundColor Yellow
}

Write-Host "`nAdditional cleanup steps if needed:" -ForegroundColor Cyan
Write-Host "1. Restart your computer" -ForegroundColor Yellow
Write-Host "2. Run 'sc.exe query AdminPortal' to verify service status" -ForegroundColor Yellow
Write-Host "3. Check registry editor for any remaining keys:" -ForegroundColor Yellow
Write-Host "   HKLM:\SYSTEM\CurrentControlSet\Services\AdminPortal" -ForegroundColor Yellow


