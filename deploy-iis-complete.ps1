param(
    [Parameter(Mandatory=$false)]
    [string]$SiteName = "Default Web Site",
    [string]$AppName = "fxWms",
    [string]$AppPoolName = "React",
    [string]$PhysicalPath = "C:\inetpub\wwwroot\fxWms"
)

$ErrorActionPreference = "Stop"

# Verify running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Error: Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Check IIS Prerequisites
Write-Host "Checking IIS prerequisites..." -ForegroundColor Cyan
if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
    Write-Host "Error: WebAdministration module not found. Please install IIS and necessary components." -ForegroundColor Red
    exit 1
}
Import-Module WebAdministration

# Check IIS site
if (-not (Test-Path "IIS:\Sites\$SiteName")) {
    Write-Host "Error: IIS site '$SiteName' not found" -ForegroundColor Red
    exit 1
}

# Prepare destination directory
Write-Host "Preparing destination directory..." -ForegroundColor Yellow
if (Test-Path $PhysicalPath) {
    Stop-Website -Name $SiteName
    if (Test-Path "IIS:\AppPools\$AppPoolName") {
        Stop-WebAppPool -Name $AppPoolName
    }
    Remove-Item -Path $PhysicalPath -Recurse -Force
}
New-Item -ItemType Directory -Path $PhysicalPath -Force | Out-Null

# Create required directories
@(
    "$PhysicalPath\.next\static",
    "$PhysicalPath\public",
    "$PhysicalPath\logs",
    "$PhysicalPath\iisnode"
) | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
}

# Create server.js
$serverJsContent = @"
const path = require('path');
process.env.NODE_ENV = 'production';
process.chdir(__dirname);
const port = parseInt(process.env.PORT, 10) || 9000;
const hostname = process.env.HOSTNAME || 'localhost';
require('./.next/standalone/server.js');
"@
$serverJsContent | Out-File -FilePath "$PhysicalPath\server.js" -Encoding UTF8 -Force

# Create web.config
$webConfig = @"
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
          <action type="Rewrite" url="public{REQUEST_URI}"/>
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
    <environmentVariables>
      <environmentVariable name="PORT" value="9000" />
      <environmentVariable name="NODE_ENV" value="production" />
      <environmentVariable name="HOSTNAME" value="localhost" />
    </environmentVariables>
  </system.webServer>
</configuration>
"@
$webConfig | Out-File -FilePath "$PhysicalPath\web.config" -Encoding UTF8 -Force

# Set directory permissions
Write-Host "Setting directory permissions..." -ForegroundColor Yellow
$acl = Get-Acl $PhysicalPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS AppPool\$AppPoolName", 
    "FullControl", 
    "ContainerInherit,ObjectInherit", 
    "None", 
    "Allow"
)
$acl.SetAccessRule($accessRule)
Set-Acl $PhysicalPath $acl

# Configure IIS
Write-Host "Configuring IIS..." -ForegroundColor Yellow

# Create/update application pool
if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    New-WebAppPool -Name $AppPoolName
}
Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty -Path "IIS:\AppPools\$AppPoolName" -Name "startMode" -Value "AlwaysRunning"

# Remove existing application if it exists
if (Test-Path "IIS:\Sites\$SiteName\$AppName") {
    Remove-WebApplication -Name $AppName -Site $SiteName
}

# Create new application
New-WebApplication -Name $AppName -Site $SiteName -PhysicalPath $PhysicalPath -ApplicationPool $AppPoolName -Force

# Start services
Write-Host "Starting services..." -ForegroundColor Yellow
Start-WebAppPool -Name $AppPoolName
Start-Website -Name $SiteName

# Output deployment information
Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "`nDeployment Details:" -ForegroundColor Cyan
Write-Host "=================="
Write-Host "Site Name: $SiteName"
Write-Host "Application Name: $AppName"
Write-Host "Application Pool: $AppPoolName"
Write-Host "Physical Path: $PhysicalPath"
Write-Host "Application URL: http://localhost/$AppName"
Write-Host "`nLog Locations:" -ForegroundColor White
Write-Host "- IIS Logs: $PhysicalPath\logs"
Write-Host "- Node Logs: $PhysicalPath\iisnode"

# Verify key files
Write-Host "`nVerifying key files:" -ForegroundColor White
@(
    "$PhysicalPath\web.config",
    "$PhysicalPath\server.js",
    "$PhysicalPath\.next\standalone\server.js"
) | ForEach-Object {
    $fileName = Split-Path $_ -Leaf
    if (Test-Path $_) {
        Write-Host "✓ $fileName" -ForegroundColor Green
    } else {
        Write-Host "✗ $fileName" -ForegroundColor Red
    }
}

# Show application pool status
$appPoolState = Get-WebAppPoolState -Name $AppPoolName
Write-Host "`nApplication Pool Status: $($appPoolState.Value)" -ForegroundColor $(if ($appPoolState.Value -eq "Started") { "Green" } else { "Red" })