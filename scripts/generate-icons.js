const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconSizes = [192, 512];
const themeColor = '#3b82f6'; // Blue color matching the app theme

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
      <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size * 0.6 / 100})">
        <!-- Checkmark icon -->
        <path d="M 20 50 L 45 75 L 80 20" 
              stroke="white" 
              stroke-width="8" 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              fill="none"/>
        <!-- Task list lines -->
        <line x1="20" y1="30" x2="80" y2="30" 
              stroke="white" 
              stroke-width="6" 
              stroke-linecap="round" 
              opacity="0.7"/>
        <line x1="20" y1="50" x2="60" y2="50" 
              stroke="white" 
              stroke-width="6" 
              stroke-linecap="round" 
              opacity="0.7"/>
        <line x1="20" y1="70" x2="70" y2="70" 
              stroke="white" 
              stroke-width="6" 
              stroke-linecap="round" 
              opacity="0.7"/>
      </g>
    </svg>
  `;

  const outputPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .resize(size, size)
    .toFile(outputPath);
  
  console.log(`✓ Generated icon-${size}x${size}.png`);
}

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating PWA icons...\n');
  
  for (const size of iconSizes) {
    await generateIcon(size);
  }
  
  console.log('\n✓ All icons generated successfully!');
}

generateIcons().catch(console.error);

