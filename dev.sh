#!/bin/bash

# TaskApp Development Server Script
# Runs the Next.js development server on port 5003

set -e  # Exit on error

echo "🚀 Starting TaskApp development server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "   Run 'npm run setup-firebase' to configure Firebase"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🌐 Starting server on http://localhost:5003"
echo "   Press Ctrl+C to stop"
echo ""

# Run the development server
npm run dev

