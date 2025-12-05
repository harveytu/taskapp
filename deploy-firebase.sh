#!/bin/bash

# TaskApp Firebase Hosting Deployment Script
# Deploys to https://myapps-80b63.web.app/taskapp/

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔥 Firebase Hosting Deployment${NC}"
echo "Deploying to: https://myapps-80b63.web.app/taskapp/"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}📥 Installing Firebase CLI...${NC}"
    npm install -g firebase-tools
    echo ""
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Firebase...${NC}"
    firebase login
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local file not found!${NC}"
    echo "   Please run 'npm run setup-firebase' first"
    exit 1
fi

# Check required environment variables
echo "🔍 Checking environment variables..."
REQUIRED_VARS=(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.local; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Error: Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "   ${RED}- $var${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Check if icons exist
if [ ! -f "public/icons/icon-192x192.png" ] || [ ! -f "public/icons/icon-512x512.png" ]; then
    echo -e "${YELLOW}⚠️  PWA icons not found. Generating them...${NC}"
    npm run generate-icons
    echo ""
fi

# Build the project
echo -e "${GREEN}🔨 Building project for Firebase hosting...${NC}"
echo ""
npm run build:firebase

# Check if out directory exists
if [ ! -d "out" ]; then
    echo -e "${RED}❌ Error: Build output directory 'out' not found!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Deploying to Firebase Hosting...${NC}"
echo ""

# Deploy to Firebase
firebase deploy --only hosting

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Your app is available at:"
echo -e "   ${GREEN}https://myapps-80b63.web.app/taskapp/${NC}"
echo ""
echo "📝 Note: Make sure your main firebase.json includes the hosting configuration"
echo "   for the /taskapp subdirectory (see firebase.json in this project)"

