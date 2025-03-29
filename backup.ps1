# Create a temporary directory
New-Item -ItemType Directory -Force -Path .\temp_backup

# Copy necessary files for both containers
Copy-Item docker-compose.yml -Destination .\temp_backup\
Copy-Item -Recurse public -Destination .\temp_backup\
Copy-Item .env -Destination .\temp_backup\
Copy-Item deploy.ps1 -Destination .\temp_backup\
Copy-Item Dockerfile -Destination .\temp_backup\

# Create Docker container backup
docker save postgrest_default > .\temp_backup\postgrest_default.tar
docker save admin-portal > .\temp_backup\admin-portal.tar

# Create zip file
Compress-Archive -Path .\temp_backup\* -DestinationPath .\containers_backup.zip -Force

# Clean up
Remove-Item -Recurse -Force .\temp_backup

Write-Host "Backup created as containers_backup.zip"
