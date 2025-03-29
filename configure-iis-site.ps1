# Run as administrator
Import-Module WebAdministration

$siteName = "Default Web Site"
$appName = "fxWms"
$appPoolName = "React"
$physicalPath = "C:\inetpub\wwwroot\fxWms"

Write-Host "Configuring IIS site..." -ForegroundColor Cyan

# Ensure the application pool exists and is configured correctly
if (!(Test-Path "IIS:\AppPools\$appPoolName")) {
    Write-Host "Creating application pool $appPoolName..."
    New-WebAppPool -Name $appPoolName
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
    Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "startMode" -Value "AlwaysRunning"
}

# Stop the app pool if it's running
if ((Get-WebAppPoolState -Name $appPoolName).Value -eq 'Started') {
    try {
        Stop-WebAppPool -Name $appPoolName
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Warning: Could not stop app pool. Continuing..." -ForegroundColor Yellow
    }
}

# Remove existing application if it exists
if (Test-Path "IIS:\Sites\$siteName\$appName") {
    Remove-WebApplication -Name $appName -Site $siteName
}

# Create new application
New-WebApplication -Name $appName -Site $siteName -PhysicalPath $physicalPath -ApplicationPool $appPoolName -Force

# Create web.config with handlers configuration
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
    </system.webServer>
</configuration>
"@

# Write web.config to the physical path
$webConfigPath = Join-Path $physicalPath "web.config"
$webConfigContent | Out-File -FilePath $webConfigPath -Encoding UTF8 -Force

# Try to start the app pool
try {
    Start-Sleep -Seconds 2
    Start-WebAppPool -Name $appPoolName
} catch {
    Write-Host "Warning: Could not start app pool. You may need to start it manually in IIS Manager." -ForegroundColor Yellow
}

Write-Host "`nConfiguration complete. Please check the following URL:" -ForegroundColor Green
Write-Host "http://localhost/$appName" -ForegroundColor Yellow
Write-Host "`nIf you encounter any issues, check the logs at:" -ForegroundColor Cyan
Write-Host "$physicalPath\iisnode" -ForegroundColor Yellow

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Open IIS Manager" -ForegroundColor White
Write-Host "2. Verify the application pool 'React' is running" -ForegroundColor White
Write-Host "3. If not running, right-click the pool and select 'Start'" -ForegroundColor White
