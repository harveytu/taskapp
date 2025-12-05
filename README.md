# TaskApp

A modern, simple task management PWA built with Next.js, optimized for mobile Chrome on Android devices.

## Features

- Create and manage multiple task lists
- Voice input using Chrome's Web Speech API (2-second pause detection)
- Text input for adding tasks
- Mark tasks as complete/incomplete
- Create subtasks
- Filter completed tasks
- Mark all tasks complete/incomplete
- Real-time sync with Firestore
- PWA support for home screen installation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase & Firestore:
   
   **Option A: Interactive Setup (Recommended)**
   ```bash
   npm run setup-firebase
   ```
   This will guide you through entering your Firebase configuration.
   
   **Option B: Manual Setup**
   - See `FIREBASE_SETUP.md` for detailed instructions
   - Create `.env.local` with your Firebase config values
   
   After setup, configure Firestore:
   - Deploy security rules: `npm run deploy-firestore` (requires Firebase CLI)
   - Or manually copy `firestore.rules` to Firebase Console
   - Create required indexes (see `FIREBASE_SETUP.md`)

3. Create PWA icons:
   - Create `public/icons/icon-192x192.png` (192x192 pixels)
   - Create `public/icons/icon-512x512.png` (512x512 pixels)
   - These icons are required for PWA installation

4. Run the development server (on port 5003):
```bash
npm run dev
```
The app will be available at http://localhost:5003

5. Build for production:
```bash
npm run build
npm start
```

6. Deploy the app:
```bash
# Deploy to Vercel (default, recommended for Next.js)
npm run deploy

# Deploy to Netlify
npm run deploy netlify

# Build only (no deployment)
npm run deploy build
```

## Firestore Structure

The app uses the following Firestore collections:

- `taskLists`: Stores task list metadata
- `tasks`: Stores individual tasks with references to task lists
- `settings`: Stores app settings (future use)

### Firestore Indexes

The app requires composite indexes for efficient queries. Firestore will automatically prompt you to create these indexes when you first run queries that need them. You can also create them manually in the Firebase Console:

1. Go to Firestore Database > Indexes
2. Create composite indexes for:
   - Collection: `taskLists`, Fields: `userId` (Ascending), `createdAt` (Ascending)
   - Collection: `tasks`, Fields: `taskListId` (Ascending), `createdAt` (Ascending)

## PWA Installation

On Android Chrome:
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"
4. The app will appear on your home screen

## Notes

- Speech recognition requires HTTPS (or localhost for development)
- The app is optimized for mobile Chrome on Pixel phones
- Mic initialization is prioritized for fast voice input

