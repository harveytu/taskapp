#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const platform = args[0] || 'vercel';

console.log('🚀 Starting deployment process...\n');

// Check if .env.local exists and has required variables
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found!');
  console.error('   Please create .env.local with your Firebase configuration.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
];

const missingVars = requiredVars.filter(
  (varName) => !envContent.includes(`${varName}=`)
);

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  process.exit(1);
}

// Check if icons exist
const icon192 = path.join(__dirname, '..', 'public', 'icons', 'icon-192x192.png');
const icon512 = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png');

if (!fs.existsSync(icon192) || !fs.existsSync(icon512)) {
  console.warn('⚠️  Warning: PWA icons not found. Generating them now...');
  try {
    execSync('npm run generate-icons', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  } catch (error) {
    console.error('❌ Failed to generate icons');
    process.exit(1);
  }
}

async function deploy() {
  try {
    switch (platform.toLowerCase()) {
      case 'vercel':
        await deployToVercel();
        break;
      case 'netlify':
        await deployToNetlify();
        break;
      case 'build':
        await buildOnly();
        break;
      default:
        console.error(`❌ Unknown platform: ${platform}`);
        console.log('\nAvailable platforms:');
        console.log('  - vercel (default)');
        console.log('  - netlify');
        console.log('  - build (build only, no deploy)');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function deployToVercel() {
  console.log('📦 Deploying to Vercel...\n');

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('📥 Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }

  console.log('🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n🚀 Deploying to Vercel...');
  execSync('vercel --prod', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      // Vercel will use .env.local automatically
    },
  });

  console.log('\n✅ Deployment complete!');
  console.log('\n📝 Note: Make sure to set environment variables in Vercel dashboard:');
  console.log('   Project Settings > Environment Variables');
  requiredVars.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
}

async function deployToNetlify() {
  console.log('📦 Deploying to Netlify...\n');

  // Check if Netlify CLI is installed
  try {
    execSync('netlify --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('📥 Installing Netlify CLI...');
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
  }

  // Create netlify.toml if it doesn't exist
  const netlifyConfigPath = path.join(__dirname, '..', 'netlify.toml');
  if (!fs.existsSync(netlifyConfigPath)) {
    const netlifyConfig = `[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
`;
    fs.writeFileSync(netlifyConfigPath, netlifyConfig);
    console.log('✅ Created netlify.toml');
  }

  console.log('🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n🚀 Deploying to Netlify...');
  execSync('netlify deploy --prod', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('\n✅ Deployment complete!');
  console.log('\n📝 Note: Make sure to set environment variables in Netlify dashboard:');
  console.log('   Site Settings > Build & Deploy > Environment');
  requiredVars.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
}

async function buildOnly() {
  console.log('🔨 Building project for production...\n');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build complete!');
  console.log('📦 Output is in the .next directory');
  console.log('🚀 Run "npm start" to start the production server');
}

deploy();

