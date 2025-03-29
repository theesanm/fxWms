# Download URLs for iisnode
$urlx64 = "https://github.com/azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi"
$installerPath = "$env:TEMP\iisnode-full-x64.msi"

# Download iisnode
Write-Host "Downloading iisnode..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $urlx64 -OutFile $installerPath

# Install iisnode
Write-Host "Installing iisnode..." -ForegroundColor Yellow
Start-Process msiexec.exe -ArgumentList "/i `"$installerPath`" /quiet" -Wait

# Clean up
Remove-Item $installerPath

Write-Host "iisnode installation completed" -ForegroundColor Green