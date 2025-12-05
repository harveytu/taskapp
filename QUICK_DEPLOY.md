# Quick Deploy to Firebase Hosting (/taskapp)

## Quick Steps

1. **Build the app:**
   ```bash
   npm run build:firebase
   ```
   This creates an `out/` directory with all static files.

2. **Copy to your main Firebase project:**
   ```bash
   # Replace /path/to/main/firebase/project with your actual path
   cp -r out/* /path/to/main/firebase/project/public/taskapp/
   ```

3. **Update your main firebase.json:**
   Add this to your main project's `firebase.json` hosting section:
   ```json
   {
     "hosting": {
       "rewrites": [
         {
           "source": "/taskapp/**",
           "destination": "/taskapp/index.html"
         }
       ]
     }
   }
   ```

4. **Deploy from your main project:**
   ```bash
   cd /path/to/main/firebase/project
   firebase deploy --only hosting
   ```

5. **Access your app:**
   Visit: https://myapps-80b63.web.app/taskapp/

## Using the Script

```bash
./deploy-firebase.sh
```

This will build the app. You still need to:
1. Copy `out/*` to your main project's `public/taskapp/` directory
2. Deploy from your main Firebase project

## Important Notes

- The app is configured with `basePath: '/taskapp'` so all paths include this prefix
- Static export means no server-side rendering
- PWA features work with the `/taskapp/` path
- Make sure your main `firebase.json` has the rewrite rule for `/taskapp/**`

