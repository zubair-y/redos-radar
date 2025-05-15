#!/bin/bash

echo "📁 Creating output folders..."
mkdir -p cli/data
mkdir -p cli/results

echo "📦 Installing dependencies..."
npm install

echo "🚀 Running full scan..."
npx ts-node cli/scan.ts

echo "✅ Setup complete! Regexes are extracted into cli/results/"
