#!/bin/bash

# Build script for Task App Android APK
# This script builds a debug APK that can be sideloaded to your device

echo "Building Task App Android APK..."

# Navigate to Android directory
cd android

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean

# Build debug APK
echo "Building debug APK..."
./gradlew assembleDebug

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build successful!"
    echo ""
    echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on your device:"
    echo "  1. Enable USB debugging on your Pixel phone"
    echo "  2. Connect your phone via USB"
    echo "  3. Run: adb install android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "Or transfer the APK to your phone and install it manually"
else
    echo ""
    echo "✗ Build failed. Check the error messages above."
    exit 1
fi

