# Set proper permissions for IIS
$folderPath = "C:\inetpub\wwwroot\fxWms"
$iisUser = "IIS_IUSRS"
$appPoolUser = "IIS AppPool\DefaultAppPool"  # Change this if using a different app pool

# Grant permissions to IIS_IUSRS
$acl = Get-Acl $folderPath
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule($iisUser, "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.AddAccessRule($rule)

# Grant permissions to App Pool user
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule($appPoolUser, "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.AddAccessRule($rule)

Set-Acl $folderPath $acl