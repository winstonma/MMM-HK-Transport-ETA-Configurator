#!/bin/bash
set -e

# Create necessary directories if they don't exist
mkdir -p public/external/providers

# List of provider scripts to download
PROVIDERS=("ctb.js" "gmb.js" "kmb.js" "lrt.js" "mtr.js" "mtrbus.js" "nwfb.js")

# Download provider scripts directly to scripts directory
echo "Downloading provider scripts..."
for provider in "${PROVIDERS[@]}"; do
  echo "  Downloading $provider..."
  curl -o "public/external/providers/$provider" "https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/providers/$provider"
done

# Patch downloaded files with correct paths
echo "Patching downloaded files..."
# Patch definitions: target_file|old_string|new_string
PATCHES=(
  "mtr.js|"/modules/MMM-HK-Transport-ETA/data/mtr-lines.json"|"/external/data/mtr-lines.json""
  "lrt.js|"/modules/MMM-HK-Transport-ETA/telegram-hketa/data/station-lrt.json"|"/external/station-lrt.json""
  "mtrbus.js|"/modules/MMM-HK-Transport-ETA/telegram-hketa/data/routes-mtr.json"|"/external/routes-mtr.json""
)

echo "Patching downloaded files..."
for patch_def in "${PATCHES[@]}"; do
  IFS='|' read -r target_file old_str new_str <<< "$patch_def"
  echo "  Patching $target_file..."
  sed -i "s|$old_str|$new_str|" "public/external/providers/$target_file"
done

echo "Provider scripts downloaded and patched successfully."