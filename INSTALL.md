# Admin Portal Installation Guide for Windows Server

## Prerequisites
- Windows Server 2019 or later
- Docker Desktop for Windows or Docker Engine installed
- PowerShell 5.1 or later

## Installation Steps

1. Extract the zip file:
   ```powershell
   Expand-Archive -Path admin-portal.zip -DestinationPath admin-portal
   cd admin-portal
   ```

2. Create a deploy script (deploy.ps1):
   ```powershell
   # Start the application
   docker-compose up -d

   # Show logs
   docker-compose logs -f
   ```

3. Start the application:
   ```powershell
   .\deploy.ps1
   ```

4. The application will be available at:
   http://localhost:9000

## Docker Commands Reference

Common Docker commands in PowerShell:
```powershell
# View running containers
docker ps

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Restart the application
docker-compose restart

# Remove unused Docker resources
docker system prune -f
```

## Troubleshooting

If you encounter any issues:

1. Check Docker is running:
   ```powershell
   docker info
   ```

2. Check container status:
   ```powershell
   docker-compose ps
   ```

3. View detailed logs:
   ```powershell
   docker-compose logs -f admin-portal
   ```

4. Common issues:
   - Port 9000 already in use
     ```powershell
     # Find what's using the port
     netstat -ano | findstr :9000
     ```
   - Docker service not running
     ```powershell
     # Start Docker service
     Start-Service docker
     ```
   - Network issues
     ```powershell
     # Verify network
     docker network ls
     ```

## Maintenance

To update the application:

1. Stop the current instance:
   ```powershell
   docker-compose down
   ```

2. Extract the new version:
   ```powershell
   Expand-Archive -Path admin-portal-new.zip -DestinationPath admin-portal -Force
   ```

3. Restart the application:
   ```powershell
   docker-compose up -d
   ```

## Backup and Restore

### Creating a Backup
```powershell
# Create a complete backup of both containers and configurations
.\backup.ps1
```

### Restoring from Backup
```powershell
# Stop running containers
docker-compose down

# Extract the backup
Expand-Archive -Path containers_backup.zip -DestinationPath temp_restore

# Load the Docker images
docker load < temp_restore\postgrest_default.tar
docker load < temp_restore\admin-portal.tar

# Copy configuration files
Copy-Item temp_restore\* . -Recurse -Force

# Clean up
Remove-Item -Recurse -Force temp_restore

# Start the containers
docker-compose up -d
```

## Security Notes

1. Ensure Windows Firewall allows port 9000
2. Use Windows authentication when possible
3. Keep Docker and Windows Server updated
4. Monitor Docker security with:
   ```powershell
   docker scan admin-portal
   ```
