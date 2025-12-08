# Android Development Setup Guide

This guide will help you set up Android development tools on your Mac to build and install the Task App on your Pixel phone.

## Prerequisites

- macOS (you're already on this)
- A Pixel phone running Android 5.1 (API 22) or higher
- USB cable to connect your phone to your Mac

## Step 1: Install Android Studio

1. **Download Android Studio**
   - Go to https://developer.android.com/studio
   - Click "Download Android Studio"
   - Download the Mac version (.dmg file)

2. **Install Android Studio**
   - Open the downloaded .dmg file
   - Drag Android Studio to your Applications folder
   - Open Android Studio from Applications
   - Follow the setup wizard:
     - Choose "Standard" installation
     - Accept the license agreements
     - Let it download the Android SDK components (this may take a while)

3. **Install Android SDK Components**
   - In Android Studio, go to **Tools → SDK Manager**
   - Under **SDK Platforms**, check:
     - Android 13.0 (Tiramisu) - API 33
     - Android 12.0 (S) - API 31
   - Under **SDK Tools**, ensure these are checked:
     - Android SDK Build-Tools
     - Android SDK Platform-Tools
     - Android SDK Command-line Tools
   - Click **Apply** and let it install

## Step 2: Install Command Line Tools (Alternative)

If you prefer not to use Android Studio's GUI, you can install the command-line tools:

1. **Download Command Line Tools**
   ```bash
   cd ~/Library/Android/sdk
   # Or create the directory if it doesn't exist
   mkdir -p ~/Library/Android/sdk
   ```

2. **Set up Environment Variables**
   Add these lines to your `~/.zshrc` file (since you're using zsh):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

3. **Reload your shell**
   ```bash
   source ~/.zshrc
   ```

## Step 3: Install ADB (Android Debug Bridge)

ADB is usually installed with Android Studio, but you can verify:

1. **Check if ADB is installed**
   ```bash
   adb version
   ```

2. **If not found**, ADB is part of Android SDK Platform-Tools:
   - It should be at: `~/Library/Android/sdk/platform-tools/adb`
   - Make sure it's in your PATH (see Step 2)

## Step 4: Enable USB Debugging on Your Pixel Phone

1. **Enable Developer Options**
   - Go to **Settings → About Phone**
   - Tap **Build Number** 7 times
   - You'll see a message saying "You are now a developer!"

2. **Enable USB Debugging**
   - Go back to **Settings**
   - Go to **System → Developer Options** (or **Developer Options** if directly visible)
   - Toggle on **USB Debugging**
   - You may also want to enable **Stay Awake** (keeps screen on while charging)

3. **Authorize Your Computer**
   - Connect your Pixel phone to your Mac via USB
   - On your phone, you'll see a popup asking to "Allow USB debugging?"
   - Check "Always allow from this computer"
   - Tap **OK**

## Step 5: Verify Connection

1. **Check if your device is connected**
   ```bash
   adb devices
   ```

2. **You should see your device listed**, for example:
   ```
   List of devices attached
   ABC123XYZ    device
   ```

   If you see "unauthorized", check your phone for the USB debugging authorization popup.

## Step 6: Install Java Development Kit (JDK)

Android Studio includes a JDK, but if you need it separately:

1. **Check if Java is installed**
   ```bash
   java -version
   ```

2. **If not installed**, Android Studio includes a JDK, or you can:
   - Install via Homebrew: `brew install openjdk@17`
   - Or download from: https://adoptium.net/

## Troubleshooting

### ADB not found
- Make sure Android SDK Platform-Tools is installed
- Add platform-tools to your PATH (see Step 2)
- Restart your terminal

### Device not showing in `adb devices`
- Make sure USB debugging is enabled on your phone
- Try a different USB cable
- Try a different USB port
- On your phone, revoke USB debugging authorizations and reconnect
- Restart ADB: `adb kill-server && adb start-server`

### Permission denied errors
- Make sure you authorized USB debugging on your phone
- Try running `adb` with `sudo` (not recommended, but can help diagnose)

## Next Steps

Once setup is complete, proceed to [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) to build and install the app.

