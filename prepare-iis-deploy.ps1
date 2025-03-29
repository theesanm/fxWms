# Create deployment directory
$deployDir = "iis-deploy"
New-Item -ItemType Directory -Force -Path $deployDir

# Remove existing directories if they exist
if (Test-Path "$deployDir/.next") {
    Remove-Item "$deployDir/.next" -Recurse -Force
}
if (Test-Path "$deployDir/public") {
    # Force remove the public directory and its contents
    Remove-Item "$deployDir/public" -Recurse -Force -ErrorAction SilentlyContinue
}

# Copy standalone files
Copy-Item -Path ".next/standalone/*" -Destination $deployDir -Recurse -ErrorAction Stop

# Create .next directory and copy static files
New-Item -ItemType Directory -Force -Path "$deployDir/.next"
Copy-Item -Path ".next/static" -Destination "$deployDir/.next/" -Recurse

# Copy public files
Copy-Item -Path "public" -Destination $deployDir -Recurse -Force

Write-Host "IIS deployment files prepared in '$deployDir' directory" -ForegroundColor Green