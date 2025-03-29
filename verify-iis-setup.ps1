# Run as administrator
Import-Module WebAdministration

$websitePath = "C:\inetpub\wwwroot\fxWms"
$port = 9000

# Check if port 9000 is already in use
$portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "ERROR: Port $port is already in use by process ID: $($portInUse.OwningProcess)" -ForegroundColor Red
    exit 1
}

# Check Node.js installation
$nodePath = "C:\Program Files\nodejs\node.exe"
if (!(Test-Path $nodePath)) {
    Write-Host "ERROR: Node.js not found at $nodePath" -ForegroundColor Red
    exit 1
}

# Verify Node.js version
$nodeVersion = & $nodePath -v
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check iisnode installation
$iisNodeModule = Get-WebConfiguration //globalModules/add[@name='iisnode']
if ($null -eq $iisNodeModule) {
    Write-Host "ERROR: iisnode module not found" -ForegroundColor Red
    exit 1
}
Write-Host "iisnode module found" -ForegroundColor Green

# Check permissions
$acl = Get-Acl $websitePath
$iisUserAccess = $acl.Access | Where-Object { $_.IdentityReference -like "*IIS_IUSRS*" }
if ($null -eq $iisUserAccess) {
    Write-Host "ERROR: IIS_IUSRS permissions not set correctly" -ForegroundColor Red
    exit 1
}
Write-Host "IIS_IUSRS permissions verified" -ForegroundColor Green

# Create test directories if they don't exist
$directories = @("logs", "iisnode")
foreach ($dir in $directories) {
    $path = Join-Path $websitePath $dir
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force
        Write-Host "Created directory: $path" -ForegroundColor Yellow
    }
}

# Set permissions for new directories
foreach ($dir in $directories) {
    $path = Join-Path $websitePath $dir
    $acl = Get-Acl $path
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.AddAccessRule($rule)
    Set-Acl $path $acl
    Write-Host "Set permissions for: $path" -ForegroundColor Yellow
}

Write-Host "`nVerification complete. Please:" -ForegroundColor Cyan
Write-Host "1. Restart the application pool in IIS Manager" -ForegroundColor White
Write-Host "2. Check these log locations:" -ForegroundColor White
Write-Host "   - $websitePath\logs\error.log" -ForegroundColor White
Write-Host "   - $websitePath\logs\access.log" -ForegroundColor White
Write-Host "   - $websitePath\iisnode\*.txt" -ForegroundColor White
Write-Host "3. Browse to http://localhost:9000/test" -ForegroundColor White