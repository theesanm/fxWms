#!/bin/bash

# Create a temporary directory
mkdir -p ./temp_backup

# Copy necessary files for both containers
cp docker-compose.yml ./temp_backup/
cp -r public ./temp_backup/
cp .env ./temp_backup/
cp deploy.sh ./temp_backup/
cp -r Dockerfile ./temp_backup/

# Create Docker container backup
docker save postgrest_default > ./temp_backup/postgrest_default.tar
docker save admin-portal > ./temp_backup/admin-portal.tar

# Create tar file
tar -czf containers_backup.tar.gz -C temp_backup .

# Clean up
rm -rf ./temp_backup

echo "Backup created as containers_backup.tar.gz"
