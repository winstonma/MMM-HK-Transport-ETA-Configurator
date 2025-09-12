#!/bin/bash
set -e

# Create necessary directories if they don't exist
mkdir -p public/external/data

echo "Downloading data files..."


FILES=(
  "mtr-lines.json"
  "routes-mtr.json"
  "station-lrt.json"
)

for file in "${FILES[@]}"; do
  echo "  Downloading $file..."
  curl -o "public/external/data/$file" "https://raw.githubusercontent.com/winstonma/MMM-HK-Transport-ETA/refs/heads/main/data/$file"
done



echo "Data files downloaded successfully."