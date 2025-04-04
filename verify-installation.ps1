param(
    [string]$Port = "9000",
    [string]$InstallPath = "C:\AdminPortal"
)

$ErrorActionPreference = "Stop"

function Write-StatusMessage {
    param(
        [string]$Message,
        [string]$Status,
        [string]$Details = ""
    )
    
    $color = switch ($Status) {
        "OK" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    
    Write-Host "[$Status] $Message" -ForegroundColor $color
    if ($Details) {
        Write-Host "       $Details" -ForegroundColor Gray
    }
}

function Test-NodeVersion {
    try {
        $nodeVersion = node -v
        $npmVersion = npm -v
        Write-StatusMessage "Node.js Version" "OK" "Version: $nodeVersion (npm: $npmVersion)"
        return $true
    }
    catch {
        Write-StatusMessage "Node.js Installation" "ERROR" "Node.js not found or not in PATH"
        return $false
    }
}

function Test-InstallationFiles {
    $requiredFiles = @(
        "server.js",
        ".next\standalone\server.js",
        ".next\server\pages-manifest.json",
        "install-service.js",
        "package.json"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $InstallPath $file
        if (-not (Test-Path $fullPath)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        Write-StatusMessage "Required Files" "OK" "All required files present"
        return $true
    } else {
        Write-StatusMessage "Required Files" "ERROR" "Missing files: $($missingFiles -join ', ')"
        return $false
    }
}

function Test-ServiceConfiguration {
    $service = Get-Service -Name "AdminPortal" -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-StatusMessage "Windows Service" "ERROR" "AdminPortal service not found"
        return $false
    }
    
    Write-StatusMessage "Service Status" "$($service.Status)" "StartType: $($service.StartType)"
    
    # Check service account
    $wmiService = Get-WmiObject -Class Win32_Service -Filter "Name='AdminPortal'"
    Write-StatusMessage "Service Account" "INFO" "Running as: $($wmiService.StartName)"
    
    return $true
}

function Test-PortAvailability {
    $portCheck = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    if ($portCheck.TcpTestSucceeded) {
        Write-StatusMessage "Port $Port" "OK" "Port is responding"
        
        # Get process using the port
        $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                  Select-Object -First 1 | 
                  ForEach-Object { Get-Process -Id $_.OwningProcess }
        if ($process) {
            Write-StatusMessage "Port Process" "INFO" "Used by: $($process.ProcessName) (PID: $($process.Id))"
        }
    } else {
        Write-StatusMessage "Port $Port" "ERROR" "Port is not responding"
    }
}

function Test-Permissions {
    $paths = @(
        $InstallPath,
        "$InstallPath\logs",
        "$InstallPath\.next"
    )
    
    foreach ($path in $paths) {
        try {
            $acl = Get-Acl $path
            $networkService = $acl.Access | Where-Object { $_.IdentityReference -like "*NT AUTHORITY\NETWORK SERVICE*" }
            $localSystem = $acl.Access | Where-Object { $_.IdentityReference -like "*NT AUTHORITY\SYSTEM*" }
            
            if (-not ($networkService -or $localSystem)) {
                Write-StatusMessage "Permissions" "WARNING" "Missing required permissions on $path"
            }
        }
        catch {
            Write-StatusMessage "Permissions" "ERROR" "Cannot check permissions on $path"
        }
    }
}

function Test-Logs {
    $logPaths = @(
        "$InstallPath\logs\server.log",
        "$InstallPath\logs\service-install.log",
        "$InstallPath\daemon\*.log"
    )
    
    foreach ($logPath in $logPaths) {
        $logs = Get-Item $logPath -ErrorAction SilentlyContinue
        if ($logs) {
            $lastLines = Get-Content $logs.FullName -Tail 10 -ErrorAction SilentlyContinue
            if ($lastLines) {
                Write-StatusMessage "Log File" "INFO" "Last entries from $($logs.Name):"
                $lastLines | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
            }
        }
    }
}

function Test-FirewallRules {
    $ruleName = "AdminPortal_$Port"
    $rule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
    
    if ($rule) {
        Write-StatusMessage "Firewall Rule" "OK" "Rule exists: $($rule.DisplayName)"
    } else {
        Write-StatusMessage "Firewall Rule" "ERROR" "Rule '$ruleName' not found"
    }
}

function Test-UrlAcl {
    $urlAcl = & netsh http show urlacl | Select-String "http://+:$Port/"
    if ($urlAcl) {
        Write-StatusMessage "URL ACL" "OK" $urlAcl
    } else {
        Write-StatusMessage "URL ACL" "ERROR" "No URL ACL found for port $Port"
    }
}

Write-Host "`nAdmin Portal Installation Diagnostics" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Installation Path: $InstallPath"
Write-Host "Port: $Port`n"

# Run all diagnostic checks
Test-NodeVersion
Test-InstallationFiles
Test-ServiceConfiguration
Test-PortAvailability
Test-Permissions
Test-FirewallRules
Test-UrlAcl

Write-Host "`nChecking Logs..." -ForegroundColor Cyan
Test-Logs

Write-Host "`nDiagnostics Complete" -ForegroundColor Cyan
Write-Host "To access the application, try:" -ForegroundColor White
Write-Host "  http://localhost:$Port" -ForegroundColor Yellow
Write-Host "  http://$env:COMPUTERNAME:$Port" -ForegroundColor Yellow
