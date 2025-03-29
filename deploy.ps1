# Check if Docker is running
$dockerService = Get-Service docker -ErrorAction SilentlyContinue
if ($dockerService.Status -ne 'Running') {
    Write-Host "Docker is not running. Starting Docker..."
    Start-Service docker
    Start-Sleep -Seconds 10
}

# Check if port 9000 is available
$portCheck = Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "Warning: Port 9000 is already in use!"
    Write-Host "Process using port: $($portCheck.OwningProcess)"
    exit 1
}

# Start the application
Write-Host "Starting Admin Portal..."
docker-compose up -d

# Show initial status
docker-compose ps

Write-Host "`nAdmin Portal is starting at http://localhost:9000"
Write-Host "Use 'docker-compose logs -f' to view logs"