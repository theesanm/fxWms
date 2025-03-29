# Install IIS and necessary features
dism /online /enable-feature /featurename:IIS-WebServerRole
dism /online /enable-feature /featurename:IIS-WebServer
dism /online /enable-feature /featurename:IIS-CommonHttpFeatures
dism /online /enable-feature /featurename:IIS-ManagementConsole
dism /online /enable-feature /featurename:IIS-ManagementScriptingTools
dism /online /enable-feature /featurename:IIS-ManagementService

# Install Windows PowerShell components
Install-WindowsFeature -Name Web-Scripting-Tools

# Import the WebAdministration module
Import-Module WebAdministration

Write-Host "IIS components installed successfully" -ForegroundColor Green