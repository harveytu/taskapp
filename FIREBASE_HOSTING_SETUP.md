# Firebase Hosting Setup for /taskapp Subdirectory

This guide explains how to deploy TaskApp to your existing Firebase hosting at `https://myapps-80b63.web.app/taskapp/`.

## Overview

Your app is configured to:
- Build as a static export
- Deploy to `/taskapp/` subdirectory
- Work alongside your existing Firebase hosting setup

## Important: Main Firebase Configuration

Since you already have Firebase hosting configured, you need to **merge** the hosting configuration from this project's `firebase.json` into your **main Firebase project's `firebase.json`**.

### Option 1: Merge into Main firebase.json (Recommended)

1. Go to your main Firebase project directory
2. Open or create `firebase.json`
3. Add the hosting configuration for `/taskapp/`:

```json
{
  "hosting": {
    "public": "public",  // or whatever your main public directory is
    "rewrites": [
      {
        "source": "/taskapp/**",
        "destination": "/taskapp/index.html"
      },
      {
        "source": "**",
        "destination": "/index.html"  // Your existing main app
      }
    ],
    "headers": [
      {
        "source": "/taskapp/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600, must-revalidate"
          }
        ]
      },
      {
        "source": "/taskapp/manifest.json",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### Option 2: Use Separate Firebase Project (Not Recommended)

If you want to keep them completely separate, you'd need a different Firebase project, which defeats the purpose.

## Deployment Steps

### 1. Build the TaskApp

```bash
npm run build:firebase
```

This creates an `out` directory with the static files.

### 2. Copy to Main Project

You have two options:

#### Option A: Manual Copy (Simple)
```bash
# From TaskApp directory
npm run build:firebase

# Copy the out directory contents to your main Firebase project
cp -r out/* /path/to/main/firebase/project/public/taskapp/
```

#### Option B: Automated Script
Create a script in your main project that:
1. Builds TaskApp
2. Copies output to the correct location
3. Deploys everything together

### 3. Deploy

From your **main Firebase project directory**:
```bash
firebase deploy --only hosting
```

## Using the Deployment Script

The `deploy-firebase.sh` script in this project will:
- Build the app
- Create the `out` directory
- **You then need to copy `out/*` to your main project's public directory under `/taskapp/`**

## Directory Structure

After deployment, your main Firebase project should have:

```
main-firebase-project/
├── public/                    # Your main hosting public directory
│   ├── index.html            # Your main app
│   └── taskapp/              # TaskApp subdirectory
│       ├── index.html
│       ├── _next/
│       ├── icons/
│       └── ...
└── firebase.json             # With merged hosting config
```

## Development

For local development, the app still runs on `http://localhost:5003`:

```bash
./dev.sh
# or
npm run dev
```

The `basePath` configuration only affects the production build.

## Troubleshooting

### 404 Errors on Routes
- Make sure your main `firebase.json` has the rewrite rule for `/taskapp/**`
- Check that files are in `public/taskapp/` directory

### Assets Not Loading
- Verify `assetPrefix: '/taskapp'` in `next.config.js`
- Check browser console for 404 errors
- Ensure paths include `/taskapp/` prefix

### PWA Not Working
- Check that `manifest.json` has correct `start_url: '/taskapp/'`
- Verify icon paths include `/taskapp/` prefix
- Service worker should be at `/taskapp/sw.js`

## Quick Deploy Command

If you set up a script in your main project:

```bash
# In TaskApp directory
npm run build:firebase && \
cp -r out/* /path/to/main/project/public/taskapp/ && \
cd /path/to/main/project && \
firebase deploy --only hosting
```

## Notes

- The app uses static export, so no server-side features
- All routes are client-side only
- PWA features work with the subdirectory path
- Make sure your main Firebase project's `firebase.json` includes the `/taskapp/` rewrite rules

