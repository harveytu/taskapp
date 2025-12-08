# Build and Install Instructions

This guide will help you build the Task App APK and install it on your Pixel phone.

## Prerequisites

- Complete the setup in [ANDROID_SETUP.md](ANDROID_SETUP.md)
- Your Pixel phone connected via USB with USB debugging enabled
- Android Studio or Android SDK command-line tools installed

## Step 1: Configure Firebase (Optional but Recommended)

If you want to use Firebase for cloud sync:

1. **Get your Firebase configuration**
   - Go to https://console.firebase.google.com
   - Create a new project or select an existing one
   - Go to **Project Settings → General**
   - Scroll down to "Your apps" and click the web icon (</>)
   - Copy the Firebase configuration object

2. **Update the Firebase config**
   - Open `www/js/firebase-config.js`
   - Replace the placeholder values with your Firebase config:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_ACTUAL_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       // ... etc
     };
     ```

3. **Sync the changes**
   ```bash
   cd /Users/swoosh/Desktop/TaskApp
   npx cap sync
   ```

## Step 2: Build the APK

### Option A: Using the Build Script (Recommended)

1. **Run the build script**
   ```bash
   cd /Users/swoosh/Desktop/TaskApp
   ./build-apk.sh
   ```

2. **Wait for the build to complete**
   - The script will clean previous builds
   - Build a debug APK
   - Show you the location of the APK file

### Option B: Using Gradle Directly

1. **Navigate to the Android directory**
   ```bash
   cd /Users/swoosh/Desktop/TaskApp/android
   ```

2. **Clean previous builds**
   ```bash
   ./gradlew clean
   ```

3. **Build the debug APK**
   ```bash
   ./gradlew assembleDebug
   ```

4. **Find your APK**
   - Location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option C: Using Android Studio

1. **Open the project**
   - Open Android Studio
   - Click **Open an Existing Project**
   - Navigate to `/Users/swoosh/Desktop/TaskApp/android`
   - Click **OK**

2. **Wait for Gradle sync** (may take a few minutes the first time)

3. **Build the APK**
   - Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Or use the terminal in Android Studio: `./gradlew assembleDebug`

## Step 3: Install on Your Pixel Phone

### Option A: Install via ADB (Recommended)

1. **Make sure your phone is connected**
   ```bash
   adb devices
   ```
   You should see your device listed.

2. **Install the APK**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

   If you get an error about the app already being installed:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
   (The `-r` flag replaces the existing app)

### Option B: Manual Installation

1. **Transfer the APK to your phone**
   - Copy `android/app/build/outputs/apk/debug/app-debug.apk` to your phone
   - You can use:
     - USB file transfer
     - Email it to yourself
     - Cloud storage (Google Drive, Dropbox, etc.)
     - AirDrop (if available)

2. **Enable installation from unknown sources**
   - On your Pixel phone, go to **Settings → Security**
   - Enable **Install unknown apps** (or **Unknown sources**)
   - Select the app you'll use to install (Files, Chrome, etc.)

3. **Install the APK**
   - Open the APK file on your phone
   - Tap **Install**
   - Tap **Open** when installation completes

## Step 4: Add the Widget

1. **Long press on your home screen**
   - This will enter widget selection mode

2. **Find "Task Manager" widget**
   - Scroll through available widgets
   - Or search for "Task"

3. **Add the widget**
   - Tap and hold the Task Manager widget
   - Drag it to your desired location on the home screen
   - Resize if needed (long press the widget after placing)

4. **Widget features**
   - View your current task list
   - Toggle task completion by tapping the checkbox
   - Delete tasks by tapping the Delete button
   - Add new tasks: Tap the "Add" button or the input field to open the main app (Android widgets have limitations with text input)
   - Tap the title to open the main app
   - Tap Refresh to update the widget

## Step 5: First Launch

1. **Open the Task Manager app**
   - Find it in your app drawer
   - Tap to open

2. **Grant permissions** (if prompted)
   - Allow internet access (for Firebase)
   - Allow microphone access (for voice input)

3. **Configure Firebase** (if using cloud sync)
   - Make sure you've updated `firebase-config.js` before building
   - The app will connect to Firebase automatically

4. **Create your first task list**
   - Use the dropdown at the top to create a new task list
   - Add tasks using the input field or voice input (mic button)

## Troubleshooting

### Build fails with "SDK not found"
- Make sure Android SDK is installed (see ANDROID_SETUP.md)
- Set ANDROID_HOME environment variable
- Check that `android/local.properties` exists (Capacitor should create it)

### Build fails with Gradle errors
- Make sure you have internet connection (Gradle downloads dependencies)
- Try: `cd android && ./gradlew clean`
- Check Android Studio's SDK Manager to ensure all required components are installed

### App crashes on launch
- Check logcat: `adb logcat | grep -i error`
- Make sure Firebase config is correct (if using Firebase)
- Try uninstalling and reinstalling: `adb uninstall com.taskapp && adb install ...`

### Widget not showing tasks
- Make sure you've created at least one task list in the main app
- Tap the Refresh button on the widget
- Open the main app and create a task, then check the widget again
- The widget syncs every 5 seconds, or when you make changes in the app

### Widget actions not working
- Make sure the app has been opened at least once
- Try removing and re-adding the widget
- Check that the app is not in battery optimization (Settings → Apps → Task Manager → Battery)

## Updating the App

When you make changes to the web app:

1. **Update the web files** in the `www/` directory

2. **Sync to Android**
   ```bash
   cd /Users/swoosh/Desktop/TaskApp
   npx cap sync
   ```

3. **Rebuild the APK**
   ```bash
   ./build-apk.sh
   ```

4. **Reinstall on your phone**
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Building a Release APK (Optional)

For a release build (smaller, optimized):

1. **Generate a keystore** (one-time setup)
   ```bash
   keytool -genkey -v -keystore task-app-release.keystore -alias taskapp -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in `android/app/build.gradle`**
   - Add signing configs (see Android documentation)

3. **Build release APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Notes

- The debug APK is signed with a debug certificate and can be installed without Play Store
- The app will work offline (using local storage) even without Firebase
- Widget updates may take a few seconds to sync
- For best widget experience, keep the main app in recent apps (don't force close it)

