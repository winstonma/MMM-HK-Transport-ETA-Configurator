#!/bin/bash
set -e

# Create necessary directories if they don't exist
mkdir -p public/external/data

echo "Downloading data files..."

# Download mtr-lines.json
echo "  Downloading mtr-lines.json..."
curl -o public/external/data/mtr-lines.json https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/mtr-lines.json



echo "Data files downloaded successfully."