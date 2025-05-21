set -e

echo "Creating folders ..."
mkdir -p cli/data cli/results cli/detected

echo "Installing dependencies ..."
npm ci --omit=dev

echo "Running full scan ..."
node cli/crawler/download.js 
node cli/extractor/extract.js
node cli/detector/detect.js      

echo "Full scan complete. Results are in cli/detected/"
