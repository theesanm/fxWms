# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

# Configuration
$deployPackageName = "iis-deploy-package.zip"

Write-Host "Creating IIS deployment package..." -ForegroundColor Cyan

# 1. Build the Next.js application
Write-Host "Building Next.js application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# 2. Create and clean temporary deployment directory
$tempDir = ".\temp-deploy"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# 3. Copy required files
Write-Host "Copying deployment files..." -ForegroundColor Yellow

# Verify source directories exist
if (-not (Test-Path ".next\standalone")) {
    Write-Host "Error: .next\standalone directory not found. Build may have failed." -ForegroundColor Red
    exit 1
}

Copy-Item ".next\standalone\*" -Destination $tempDir -Recurse
Copy-Item ".next\static" -Destination "$tempDir\.next\static" -Recurse

# Create public directory and copy contents
$publicDir = Join-Path $tempDir "public"
New-Item -ItemType Directory -Path $publicDir -Force | Out-Null

if (Test-Path "public") {
    Copy-Item "public\*" -Destination $publicDir -Recurse -Force
}

# Verify IIS deploy files exist
if (-not (Test-Path "iis-deploy\server.js")) {
    Write-Host "Error: iis-deploy\server.js not found" -ForegroundColor Red
    exit 1
}

Copy-Item "iis-deploy\server.js" -Destination $tempDir
if (Test-Path "iis-deploy\.env") {
    Copy-Item "iis-deploy\.env" -Destination $tempDir
}

# 4. Create web.config
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
  </system.webServer>
</configuration>
"@

$webConfig | Out-File -FilePath "$tempDir\web.config" -Encoding UTF8

# 5. Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path $deployPackageName) {
    Remove-Item -Path $deployPackageName -Force
}
Compress-Archive -Path "$tempDir\*" -DestinationPath $deployPackageName -Force

# 6. Cleanup
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment package created successfully: $deployPackageName" -ForegroundColor Green
Write-Host ("Package location: " + (Join-Path (Get-Location) $deployPackageName))