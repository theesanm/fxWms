param(
    [Parameter(Mandatory=$true)]
    [string]$SiteName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppName,

    [Parameter(Mandatory=$false)]
    [string]$AllowedOrigins = "*",

    [Parameter(Mandatory=$false)]
    [string]$AllowedMethods = "GET, POST, PUT, DELETE, OPTIONS, PATCH",

    [Parameter(Mandatory=$false)]
    [string]$AllowedHeaders = "Content-Type, Authorization, X-Requested-With, Range",

    [Parameter(Mandatory=$false)]
    [string]$ExposedHeaders = "Content-Range, X-Content-Range"
)

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

# Import WebAdministration module
Import-Module WebAdministration

# Function to check if IIS is installed
function Test-IISInstallation {
    $iis = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
    if (-not $iis) {
        throw "IIS is not installed on this machine. Please install IIS first."
    }
}

# Function to check if site and application exist
function Test-SiteAndApp {
    param($siteName, $appName)
    
    $site = Get-Website -Name $siteName -ErrorAction SilentlyContinue
    if (-not $site) {
        throw "Site '$siteName' does not exist."
    }

    $app = Get-WebApplication -Site $siteName -Name $appName -ErrorAction SilentlyContinue
    if (-not $app) {
        throw "Application '$appName' does not exist under site '$siteName'."
    }
}

# Function to add or update CORS headers
function Set-CorsHeaders {
    param($siteName, $appName, $headers)
    
    $configPath = "IIS:\Sites\$siteName\$appName"
    
    foreach ($header in $headers.GetEnumerator()) {
        Write-Host "Setting header: $($header.Key)" -ForegroundColor Yellow
        
        # Remove existing header if it exists
        Clear-WebConfiguration -PSPath $configPath -Filter "system.webServer/httpProtocol/customHeaders/add[@name='$($header.Key)']"
        
        # Add new header
        Add-WebConfiguration -PSPath $configPath -Filter "system.webServer/httpProtocol/customHeaders" -Value @{
            name = $header.Key
            value = $header.Value
        }
    }
}

try {
    Write-Host "Starting IIS CORS configuration..." -ForegroundColor Cyan
    
    # Check IIS installation
    Test-IISInstallation
    
    # Check if site and application exist
    Test-SiteAndApp -siteName $SiteName -appName $AppName
    
    # Define CORS headers
    $corsHeaders = @{
        "Access-Control-Allow-Origin" = $AllowedOrigins
        "Access-Control-Allow-Methods" = $AllowedMethods
        "Access-Control-Allow-Headers" = $AllowedHeaders
        "Access-Control-Expose-Headers" = $ExposedHeaders
        "Access-Control-Allow-Credentials" = "true"
    }
    
    # Configure CORS headers
    Set-CorsHeaders -siteName $SiteName -appName $AppName -headers $corsHeaders
    
    # Add OPTIONS verb if not present
    $configPath = "IIS:\Sites\$SiteName\$AppName"
    $handlerMapping = Get-WebConfiguration -PSPath $configPath -Filter "system.webServer/handlers/add[@name='iisnode']"
    if ($handlerMapping -and -not $handlerMapping.verb.Contains("OPTIONS")) {
        $currentVerbs = $handlerMapping.verb
        $newVerbs = "$currentVerbs,OPTIONS"
        Set-WebConfiguration -PSPath $configPath -Filter "system.webServer/handlers/add[@name='iisnode']/@verb" -Value $newVerbs
    }
    
    Write-Host "`nCORS configuration completed successfully!" -ForegroundColor Green
    Write-Host "`nConfiguration Summary:" -ForegroundColor Cyan
    Write-Host "Site: $SiteName" -ForegroundColor White
    Write-Host "Application: $AppName" -ForegroundColor White
    Write-Host "Allowed Origins: $AllowedOrigins" -ForegroundColor White
    Write-Host "Allowed Methods: $AllowedMethods" -ForegroundColor White
    
    # Recommend IIS reset
    Write-Host "`nIt's recommended to restart IIS for changes to take effect." -ForegroundColor Yellow
    $restart = Read-Host "Would you like to restart IIS now? (y/n)"
    if ($restart -eq "y") {
        Write-Host "Restarting IIS..." -ForegroundColor Yellow
        iisreset /restart
        Write-Host "IIS has been restarted." -ForegroundColor Green
    }

} catch {
    Write-Host "Error configuring CORS:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}