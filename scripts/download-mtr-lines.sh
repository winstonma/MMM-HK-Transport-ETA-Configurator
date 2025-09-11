#!/bin/bash
set -e

# Create necessary directories if they don't exist
mkdir -p public/external
mkdir -p public/external/providers

# Download mtr-lines.json
echo "Downloading mtr-lines.json..."
curl -o public/external/mtr-lines.json https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/mtr-lines.json

# Download station-lrt.json
echo "Downloading station-lrt.json..."
curl -o public/external/station-lrt.json https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/station-lrt.json

# Download routes-mtr.json
echo "Downloading routes-mtr.json..."
curl -o public/external/routes-mtr.json https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/routes-mtr.json

# List of provider scripts to download
PROVIDERS=("ctb.js" "gmb.js" "kmb.js" "lrt.js" "mtr.js" "mtrbus.js" "nwfb.js")

# Download provider scripts in a loop
echo "Downloading provider scripts..."
for provider in "${PROVIDERS[@]}"; do
  echo "  Downloading $provider..."
  curl -o "public/external/providers/$provider" "https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/providers/$provider"
done

# Patch downloaded files with correct paths
echo "Patching downloaded files..."
sed -i 's|/modules/MMM-HK-Transport-ETA/data/mtr-lines.json|"/external/mtr-lines.json"|' public/external/providers/mtr.js
sed -i 's|/modules/MMM-HK-Transport-ETA/telegram-hketa/data/station-lrt.json|"/external/station-lrt.json"|' public/external/providers/lrt.js
sed -i 's|/modules/MMM-HK-Transport-ETA/telegram-hketa/data/routes-mtr.json|"/external/routes-mtr.json"|' public/external/providers/mtrbus.js

echo "All remote files downloaded and patched successfully."