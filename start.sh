#!/bin/bash

# TaskApp Production Server Script
# Runs the Next.js production server on port 5003

set -e  # Exit on error

echo "🚀 Starting TaskApp production server..."
echo ""

# Check if .next directory exists
if [ ! -d ".next" ]; then
    echo "🔨 Building project first..."
    npm run build
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "   Make sure environment variables are set"
    echo ""
fi

echo "🌐 Starting production server on http://localhost:5003"
echo "   Press Ctrl+C to stop"
echo ""

# Run the production server
npm start

