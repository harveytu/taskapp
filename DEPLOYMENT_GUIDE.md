# Deployment Guide - Which Script to Use?

## Quick Reference

| Deployment Target | Script to Use | Command |
|------------------|---------------|---------|
| **Firebase Hosting** (`/taskapp/` subdirectory) | `deploy-firebase.sh` | `./deploy-firebase.sh` |
| **Vercel** (standalone) | `deploy.sh` | `./deploy.sh vercel` |
| **Netlify** (standalone) | `deploy.sh` | `./deploy.sh netlify` |
| **Build only** (no deploy) | `deploy.sh` | `./deploy.sh build` |

## Detailed Explanation

### ✅ Use `./deploy-firebase.sh` for:
- **Firebase Hosting** at `https://myapps-80b63.web.app/taskapp/`
- This is the **recommended** script for your current setup
- Builds static files optimized for Firebase hosting
- Creates `out/` directory ready to copy to your main Firebase project

### ⚠️ Use `./deploy.sh` for:
- **Vercel** or **Netlify** deployments
- **Warning**: The app is configured with `basePath='/taskapp'`
  - If deploying to root domain, you may need to temporarily remove `basePath` from `next.config.js`
  - Or configure the platform to serve from `/taskapp` subdirectory
- The script will warn you about this before deploying

### 📦 Use `./deploy.sh build` for:
- Building the app without deploying
- Creates static files in `out/` directory
- Useful for testing the build or manual deployment

## Current Configuration

Your app is currently configured for:
- ✅ **Firebase Hosting** at `/taskapp/` subdirectory
- ✅ Static export (`output: 'export'`)
- ✅ Base path: `/taskapp`

## Changing Deployment Target

If you want to deploy to Vercel/Netlify at the root domain:

1. **Temporarily modify `next.config.js`:**
   ```javascript
   const nextConfig = {
     reactStrictMode: true,
     // Comment out or remove these lines:
     // basePath: '/taskapp',
     // assetPrefix: '/taskapp',
     output: 'export',
     // ... rest of config
   };
   ```

2. **Deploy:**
   ```bash
   ./deploy.sh vercel  # or netlify
   ```

3. **Restore `next.config.js`** for Firebase hosting

## Recommendation

Since you're using Firebase hosting at `/taskapp/`, stick with:
```bash
./deploy-firebase.sh
```

This is the simplest and most reliable option for your setup.

