# Firebase & Firestore Setup Guide

This guide will help you connect your existing Firebase project to TaskApp.

## Quick Setup

Run the interactive setup script:
```bash
npm run setup-firebase
```

Or manually create a `.env.local` file with your Firebase configuration.

## Getting Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to the "Your apps" section
6. If you don't have a web app, click the `</>` icon to add one
7. Copy the config values from the `firebaseConfig` object

Your config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Firestore Security Rules

Set up security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Task Lists
    match /taskLists/{listId} {
      allow read, write: if true; // For development - restrict in production
      
      // Production rules (uncomment and customize):
      // allow read: if request.auth != null;
      // allow create: if request.auth != null;
      // allow update, delete: if request.auth != null && 
      //   resource.data.userId == request.auth.uid;
    }
    
    // Tasks
    match /tasks/{taskId} {
      allow read, write: if true; // For development - restrict in production
      
      // Production rules (uncomment and customize):
      // allow read: if request.auth != null;
      // allow create: if request.auth != null && 
      //   request.resource.data.taskListId is string;
      // allow update, delete: if request.auth != null;
    }
    
    // Settings
    match /settings/{settingId} {
      allow read, write: if true; // For development - restrict in production
      
      // Production rules (uncomment and customize):
      // allow read, write: if request.auth != null && 
      //   resource.data.userId == request.auth.uid;
    }
  }
}
```

**⚠️ Important**: The rules above allow public read/write for development. For production, you should:
- Add authentication (Firebase Auth)
- Restrict access based on user ownership
- Use proper validation

## Firestore Indexes

The app requires composite indexes for efficient queries. Firestore will prompt you to create them automatically when you first use the app, or you can create them manually:

### Required Indexes

1. **taskLists collection:**
   - Collection: `taskLists`
   - Fields:
     - `userId` (Ascending)
     - `createdAt` (Ascending)

2. **tasks collection:**
   - Collection: `tasks`
   - Fields:
     - `taskListId` (Ascending)
     - `createdAt` (Ascending)

### Creating Indexes Manually

1. Go to Firebase Console > Firestore Database > Indexes
2. Click "Create Index"
3. Select the collection
4. Add the fields in the order specified above
5. Click "Create"

Or use the Firebase CLI:
```bash
firebase deploy --only firestore:indexes
```

## Testing Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5003

3. Try creating a task list - if it works, your setup is correct!

4. Check the browser console for any Firebase errors

## Troubleshooting

### "Firestore not initialized" error
- Make sure `.env.local` exists and has all required variables
- Restart the development server after creating `.env.local`
- Check that all environment variables start with `NEXT_PUBLIC_`

### "Missing or insufficient permissions" error
- Check your Firestore security rules
- Make sure the rules allow read/write operations
- For production, ensure you have proper authentication set up

### "Index not found" error
- Create the required composite indexes (see above)
- Firestore will provide a link to create the index when this error occurs

### Connection issues
- Verify your Firebase project is active
- Check that Firestore is enabled in your Firebase project
- Ensure your API key is correct and not restricted

## Production Considerations

Before deploying to production:

1. **Security Rules**: Update Firestore rules to require authentication
2. **Authentication**: Implement Firebase Auth for user management
3. **API Key Restrictions**: Configure API key restrictions in Firebase Console
4. **Environment Variables**: Set environment variables in your hosting platform (Vercel/Netlify)
5. **Indexes**: Ensure all indexes are created in production

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

