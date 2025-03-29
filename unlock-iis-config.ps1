# Run as administrator
Import-Module WebAdministration

Write-Host "Unlocking IIS configuration sections..." -ForegroundColor Cyan

# Unlock handlers section
%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/handlers

# Unlock modules section
%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/modules

# Unlock other necessary sections
%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/security/authentication/anonymousAuthentication
%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/security/authentication/windowsAuthentication

Write-Host "Configuration sections unlocked" -ForegroundColor Green