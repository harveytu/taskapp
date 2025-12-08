# Task Manager - Android App

A native Android app converted from a web-based task management application, featuring a fully interactive home screen widget.

## Features

- ✅ Task list management with multiple lists
- ✅ Voice input for adding tasks
- ✅ Firebase Firestore cloud sync (optional)
- ✅ Local storage caching for offline use
- ✅ Fully interactive Android widget:
  - View current task list
  - Toggle task completion
  - Delete tasks
  - Quick access to main app

## Project Structure

```
TaskApp/
├── www/                    # Web app files (HTML, CSS, JS)
│   ├── index.html
│   ├── css/
│   │   └── task-theme.css
│   └── js/
│       ├── firebase-config.js
│       ├── task-app.js
│       ├── task-data-manager.js
│       └── data-sync-bridge.js
├── android/                # Android native project
│   └── app/src/main/
│       ├── java/com/taskapp/
│       │   ├── MainActivity.java
│       │   └── TaskWidgetProvider.java
│       └── res/
│           ├── layout/
│           │   ├── widget_task_list.xml
│           │   └── widget_task_item.xml
│           └── xml/
│               └── task_widget_info.xml
├── capacitor.config.js     # Capacitor configuration
├── package.json            # Node dependencies
├── build-apk.sh            # Build script
├── ANDROID_SETUP.md        # Setup guide for Android tools
└── BUILD_INSTRUCTIONS.md   # Build and install instructions
```

## Quick Start

1. **Set up Android development tools** (if not already done)
   - See [ANDROID_SETUP.md](ANDROID_SETUP.md)

2. **Configure Firebase** (optional)
   - Edit `www/js/firebase-config.js` with your Firebase credentials
   - Or leave as-is to use local storage only

3. **Build and install**
   ```bash
   ./build-apk.sh
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Add the widget**
   - Long press home screen → Widgets → Task Manager
   - Drag to your home screen

## Development

### Making Changes

1. **Edit web app files** in `www/` directory
2. **Sync to Android**:
   ```bash
   npx cap sync
   ```
3. **Rebuild APK**:
   ```bash
   ./build-apk.sh
   ```
4. **Reinstall**:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Opening in Android Studio

```bash
npx cap open android
```

## Widget Data Sync

The widget syncs data with the main app using:
- **Capacitor Preferences API** for shared storage
- **Automatic sync** every 5 seconds
- **Manual sync** when tasks are modified in the app

## Requirements

- Android 5.1 (API 22) or higher
- Internet connection (for Firebase sync, if enabled)
- Microphone permission (for voice input)

## Notes

- The app works offline using local storage
- Widget updates may take a few seconds to appear
- For best widget experience, keep the main app in recent apps
- The debug APK can be installed without Play Store (sideloading)

## Troubleshooting

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed troubleshooting steps.

## License

Private use only - not for Play Store distribution.
