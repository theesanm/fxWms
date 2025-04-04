Stop-Service AdminPortal -ErrorAction SilentlyContinue
sc delete AdminPortal
Remove-Item C:\AdminPortal -Recurse -Force -ErrorAction SilentlyContinue