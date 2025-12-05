# How to Find Your Firebase Configuration Values

## Quick Guide to Finding Your Firebase API Key

### Step-by-Step Instructions:

1. **Go to Firebase Console**
   - Open https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select Your Project**
   - Click on your existing Firebase project from the list

3. **Open Project Settings**
   - Click the **gear icon** ⚙️ next to "Project Overview" (top left)
   - Select **"Project settings"** from the dropdown

4. **Find Your Web App Configuration**
   - Scroll down to the **"Your apps"** section
   - Look for a web app (it will have a `</>` icon)
   - If you don't have a web app yet:
     - Click the **`</>` (web)** icon to add one
     - Give it a nickname (e.g., "TaskApp")
     - Click "Register app"
     - You'll see the config values

5. **Copy the Configuration Values**
   You'll see a code block that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",           // ← This is your API Key
     authDomain: "project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

### Mapping to Environment Variables:

- **API Key** → `NEXT_PUBLIC_FIREBASE_API_KEY`
  - Found in: `apiKey: "AIzaSyC..."`
  
- **Project ID** → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - Found in: `projectId: "your-project-id"`
  - Also visible at the top of Project Settings page

- **Auth Domain** → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - Found in: `authDomain: "project.firebaseapp.com"`
  - Usually: `{projectId}.firebaseapp.com`

- **Storage Bucket** → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - Found in: `storageBucket: "project.appspot.com"`
  - Usually: `{projectId}.appspot.com`

- **Messaging Sender ID** → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - Found in: `messagingSenderId: "123456789"`

- **App ID** → `NEXT_PUBLIC_FIREBASE_APP_ID`
  - Found in: `appId: "1:123456789:web:abc123"`

## Visual Guide

```
Firebase Console
├── Select Project
├── ⚙️ Gear Icon (top left)
│   └── Project settings
│       └── Scroll to "Your apps"
│           └── Web app (</> icon)
│               └── Config values shown here
```

## Alternative: Using Firebase CLI

If you have Firebase CLI installed and are logged in:
```bash
firebase projects:list
# Then select your project and get config
```

## Still Can't Find It?

1. **Make sure you're in the correct project** - Check the project name at the top
2. **Create a web app if you don't have one** - Click the `</>` icon
3. **Check if you have access** - You need Editor or Owner permissions
4. **Try a different browser** - Sometimes cache issues can hide the config

## Security Note

The API key is safe to use in client-side code (that's why it starts with `NEXT_PUBLIC_`). Firebase security is handled through:
- Security Rules (Firestore Rules)
- API Key restrictions (in Firebase Console > Project Settings > General)

