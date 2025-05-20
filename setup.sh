#!/usr/bin/env bash
set -e

echo "Creating folders ..."
mkdir -p cli/data cli/results cli/detected

echo "Installing dependencies ..."
# honours package-lock.json but skips any dev-only tools you removed
npm ci --omit=dev

echo "Running full scan ..."
node cli/crawler/download.js     # grabs the five framework tarballs
node cli/extractor/extract.js    # walks the source trees and pulls regexes
node cli/detector/detect.js      # scores & writes nested / dot-star / overlap

echo "Full scan complete. Results are in cli/detected/"
