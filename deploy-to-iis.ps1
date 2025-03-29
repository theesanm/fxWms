# Run as administrator
param(
    [Parameter(Mandatory=$false)]
    [string]$PackagePath = "C:\Install\fxWMS\admin-portal.zip",
    
    [string]$SiteName = "Default Web Site",
    [string]$AppName = "fxWms",
    [string]$AppPoolName = "React",
    [string]$PhysicalPath = "C:\inetpub\wwwroot\fxWms"
)

$ErrorActionPreference = "Stop"

# Import required module
Import-Module WebAdministration

# First, try to remove the application if it exists
Write-Host "Removing existing application..." -ForegroundColor Yellow
if (Test-Path "IIS:\Sites\$SiteName\$AppName") {
    Remove-WebApplication -Name $AppName -Site $SiteName
}

# Clean and recreate physical path
Write-Host "Preparing physical path..." -ForegroundColor Yellow
if (Test-Path $PhysicalPath) {
    Remove-Item -Path $PhysicalPath -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $PhysicalPath | Out-Null

# Create a temporary extraction directory
$tempPath = Join-Path $env:TEMP "fxwms_temp"
if (Test-Path $tempPath) {
    Remove-Item -Path $tempPath -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $tempPath | Out-Null

# Extract deployment package to temp directory first
Write-Host "Extracting deployment package from: $PackagePath" -ForegroundColor Yellow
Expand-Archive -Path $PackagePath -DestinationPath $tempPath -Force

# Move contents from potential subdirectory
$adminPortalDir = Join-Path $tempPath "admin-portal"
if (Test-Path $adminPortalDir) {
    Get-ChildItem -Path $adminPortalDir | Copy-Item -Destination $PhysicalPath -Recurse -Force
} else {
    Get-ChildItem -Path $tempPath | Copy-Item -Destination $PhysicalPath -Recurse -Force
}

# Clean up temp directory
Remove-Item -Path $tempPath -Recurse -Force

# Create server.js
$serverJsContent = @"
const path = require('path');
process.env.NODE_ENV = 'production';
process.chdir(__dirname);
const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || 'localhost';
require('./.next/standalone/server.js');
"@

$serverJsContent | Out-File -FilePath "$PhysicalPath\server.js" -Encoding UTF8 -Force

# Create web.config
Write-Host "Creating web.config..." -ForegroundColor Yellow
$webConfigContent = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^server.js\/debug[\/]?" />
        </rule>
        <rule name="StaticContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" />
          </conditions>
          <action type="None" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <iisnode
      nodeProcessCommandLine="&quot;C:\Program Files\nodejs\node.exe&quot;"
      debuggingEnabled="true"
      logDirectory="iisnode"
      watchedFiles="*.js;web.config"
      loggingEnabled="true"
    />
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="node_modules" />
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
"@

$webConfigContent | Out-File -FilePath "$PhysicalPath\web.config" -Encoding UTF8 -Force

# Create required directories
Write-Host "Creating required directories..." -ForegroundColor Yellow
@("logs", "iisnode") | ForEach-Object {
    $dirPath = Join-Path $PhysicalPath $_
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
    }
}

# Set directory permissions
Write-Host "Setting directory permissions..." -ForegroundColor Yellow
$acl = Get-Acl $PhysicalPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS AppPool\$AppPoolName", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl $PhysicalPath $acl

# Create/update application pool
if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    Write-Host "Creating application pool: $AppPoolName" -ForegroundColor Yellow
    New-WebAppPool -Name $AppPoolName
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "managedRuntimeVersion" -Value ""
    Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "startMode" -Value "AlwaysRunning"
}

# Create new application
Write-Host "Creating IIS application: $AppName" -ForegroundColor Yellow
New-WebApplication -Name $AppName -Site $SiteName -PhysicalPath $PhysicalPath -ApplicationPool $AppPoolName -Force

# Restart application pool
Write-Host "Restarting application pool..." -ForegroundColor Yellow
Stop-WebAppPool -Name $AppPoolName
Start-Sleep -Seconds 2
Start-WebAppPool -Name $AppPoolName

Write-Host "`nVerification Steps:" -ForegroundColor Cyan
Write-Host "1. Check these log locations if you encounter issues:" -ForegroundColor White
Write-Host "   - $PhysicalPath\logs" -ForegroundColor White
Write-Host "   - $PhysicalPath\iisnode" -ForegroundColor White
Write-Host "2. IISNode logs: $PhysicalPath\iisnode\COMPUTERNAME-stdout.log" -ForegroundColor White

# Final URL display
Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "Application URL: http://localhost/$AppName" -ForegroundColor Green