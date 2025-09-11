#!/bin/bash
set -e

# Create necessary directories if they don't exist
mkdir -p public/external

echo "Downloading data files..."

# Download mtr-lines.json
echo "  Downloading mtr-lines.json..."
curl -o public/external/mtr-lines.json https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/mtr-lines.json

# Download station-lrt.json
echo "  Downloading station-lrt.json..."
curl -o public/external/station-lrt.json https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/station-lrt.json

# Download routes-mtr.json
echo "  Downloading routes-mtr.json..."
curl -o public/external/routes-mtr.json https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/routes-mtr.json

echo "Data files downloaded successfully."