# PWA Icons

This directory contains the following icon files for PWA installation:

- `icon-192x192.png` - 192x192 pixels ✓ Generated
- `icon-512x512.png` - 512x512 pixels ✓ Generated

## Regenerating Icons

To regenerate the icons, run:
```bash
npm run generate-icons
```

This will create generic task app icons with a blue gradient background and checkmark/list design.

## Creating Custom Icons

You can create these icons using:

1. **Online tools**: Use a PWA icon generator like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

2. **Design tools**: Create icons in Figma, Adobe Illustrator, or similar, then export as PNG

3. **Simple approach**: Create a simple colored square with the app name/logo

The icons should be:
- Square (1:1 aspect ratio)
- PNG format
- At least the specified sizes (192x192 and 512x512)
- Preferably with a transparent or solid background
- Optimized for mobile display

## Quick Test Icons

For testing, you can create simple placeholder icons using any image editor or online tool. The app will work without icons, but PWA installation may not be available until icons are added.

