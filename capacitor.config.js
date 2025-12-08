const { CapacitorConfig } = require('@capacitor/cli');

const config = {
  appId: 'com.taskapp',
  appName: 'Task Manager',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://cdn.tailwindcss.com',
      'https://cdnjs.cloudflare.com',
      'https://fonts.googleapis.com',
      'https://www.gstatic.com',
      'https://firestore.googleapis.com',
      'https://*.firebaseio.com',
      'https://*.googleapis.com'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  plugins: {
    Preferences: {
      androidPackage: 'com.taskapp'
    }
  }
};

module.exports = config;

