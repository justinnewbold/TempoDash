#!/usr/bin/env node
/**
 * TempoDash Icon Generator
 *
 * This script generates app icons and splash screen images from an SVG source.
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Usage:
 *   node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Icon SVG - A stylized cube player with glow effect
const ICON_SVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#0a0a1a"/>
    </linearGradient>
    <linearGradient id="player" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffaa"/>
      <stop offset="100%" style="stop-color:#00cc88"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="30" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="innerGlow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  <!-- Decorative platforms -->
  <rect x="100" y="700" width="200" height="30" rx="4" fill="#2a2a4e" opacity="0.5"/>
  <rect x="350" y="550" width="150" height="30" rx="4" fill="#2a2a4e" opacity="0.5"/>
  <rect x="550" y="400" width="180" height="30" rx="4" fill="#2a2a4e" opacity="0.5"/>
  <rect x="750" y="650" width="160" height="30" rx="4" fill="#2a2a4e" opacity="0.5"/>

  <!-- Player cube with glow -->
  <g filter="url(#glow)">
    <rect x="362" y="312" width="300" height="300" rx="30" fill="url(#player)"/>
  </g>

  <!-- Player cube main body -->
  <rect x="362" y="312" width="300" height="300" rx="30" fill="url(#player)"/>

  <!-- Highlight -->
  <rect x="380" y="330" width="264" height="60" rx="8" fill="rgba(255,255,255,0.3)"/>

  <!-- Eye -->
  <circle cx="580" cy="400" r="50" fill="#ffffff"/>
  <circle cx="595" cy="400" r="25" fill="#000000"/>
  <circle cx="605" cy="388" r="10" fill="#ffffff"/>

  <!-- Motion trail effect -->
  <rect x="362" y="620" width="200" height="200" rx="20" fill="#00ffaa" opacity="0.15"/>
  <rect x="362" y="720" width="150" height="150" rx="15" fill="#00ffaa" opacity="0.1"/>

  <!-- Coins decoration -->
  <circle cx="200" cy="300" r="40" fill="#ffd700"/>
  <circle cx="188" cy="288" r="12" fill="rgba(255,255,255,0.5)"/>

  <circle cx="850" cy="250" r="35" fill="#ffd700"/>
  <circle cx="840" cy="240" r="10" fill="rgba(255,255,255,0.5)"/>
</svg>
`;

// Splash screen SVG - Centered logo with title
const SPLASH_SVG = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/>
      <stop offset="50%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#0a0a1a"/>
    </linearGradient>
    <linearGradient id="splashPlayer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffaa"/>
      <stop offset="100%" style="stop-color:#00cc88"/>
    </linearGradient>
    <filter id="splashGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1284" height="2778" fill="url(#splashBg)"/>

  <!-- Player cube with glow (centered) -->
  <g transform="translate(542, 1189)" filter="url(#splashGlow)">
    <rect x="0" y="0" width="200" height="200" rx="20" fill="url(#splashPlayer)"/>
  </g>
  <g transform="translate(542, 1189)">
    <rect x="0" y="0" width="200" height="200" rx="20" fill="url(#splashPlayer)"/>
    <!-- Highlight -->
    <rect x="12" y="12" width="176" height="40" rx="6" fill="rgba(255,255,255,0.3)"/>
    <!-- Eye -->
    <circle cx="145" cy="60" r="33" fill="#ffffff"/>
    <circle cx="155" cy="60" r="17" fill="#000000"/>
    <circle cx="162" cy="52" r="7" fill="#ffffff"/>
  </g>

  <!-- Title text: TEMPO -->
  <text x="642" y="1500" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" fill="#ffffff" letter-spacing="20">TEMPO</text>

  <!-- Title text: DASH -->
  <text x="642" y="1620" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" fill="#00ffaa" letter-spacing="20">DASH</text>

  <!-- Loading indicator dots -->
  <circle cx="582" cy="1750" r="8" fill="rgba(255,255,255,0.3)"/>
  <circle cx="622" cy="1750" r="8" fill="rgba(255,255,255,0.5)"/>
  <circle cx="662" cy="1750" r="8" fill="rgba(255,255,255,0.7)"/>
  <circle cx="702" cy="1750" r="8" fill="rgba(255,255,255,0.3)"/>
</svg>
`;

// Adaptive icon foreground (Android)
const ADAPTIVE_ICON_SVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="adaptivePlayer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00ffaa"/>
      <stop offset="100%" style="stop-color:#00cc88"/>
    </linearGradient>
    <filter id="adaptiveGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Transparent background for adaptive icon -->
  <rect width="1024" height="1024" fill="transparent"/>

  <!-- Player cube with glow (centered in safe zone) -->
  <g transform="translate(312, 312)" filter="url(#adaptiveGlow)">
    <rect x="0" y="0" width="400" height="400" rx="40" fill="url(#adaptivePlayer)"/>
  </g>
  <g transform="translate(312, 312)">
    <rect x="0" y="0" width="400" height="400" rx="40" fill="url(#adaptivePlayer)"/>
    <!-- Highlight -->
    <rect x="24" y="24" width="352" height="80" rx="12" fill="rgba(255,255,255,0.3)"/>
    <!-- Eye -->
    <circle cx="290" cy="120" r="66" fill="#ffffff"/>
    <circle cx="310" cy="120" r="34" fill="#000000"/>
    <circle cx="324" cy="104" r="14" fill="#ffffff"/>
  </g>
</svg>
`;

async function generateIcons() {
  console.log('Generating TempoDash icons...\n');

  try {
    // Generate main app icon (1024x1024)
    console.log('Creating icon.png (1024x1024)...');
    await sharp(Buffer.from(ICON_SVG))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(ASSETS_DIR, 'icon.png'));
    console.log('  ✓ icon.png');

    // Generate adaptive icon foreground (1024x1024)
    console.log('Creating adaptive-icon.png (1024x1024)...');
    await sharp(Buffer.from(ADAPTIVE_ICON_SVG))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
    console.log('  ✓ adaptive-icon.png');

    // Generate favicon (48x48)
    console.log('Creating favicon.png (48x48)...');
    await sharp(Buffer.from(ICON_SVG))
      .resize(48, 48)
      .png()
      .toFile(path.join(ASSETS_DIR, 'favicon.png'));
    console.log('  ✓ favicon.png');

    // Generate splash icon (200x200 for splash screen)
    console.log('Creating splash-icon.png (200x200)...');
    await sharp(Buffer.from(ADAPTIVE_ICON_SVG))
      .resize(200, 200)
      .png()
      .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
    console.log('  ✓ splash-icon.png');

    console.log('\n✅ All icons generated successfully!');
    console.log('\nNote: For production, consider using professional icon design tools');
    console.log('like Figma or Adobe Illustrator for higher quality results.');

  } catch (error) {
    if (error.message.includes('Cannot find module')) {
      console.log('\n⚠️  Sharp is not installed. Install it first:');
      console.log('   npm install sharp\n');

      // Fallback: just write the SVG files so user can convert manually
      console.log('Writing SVG files instead...');
      fs.writeFileSync(path.join(ASSETS_DIR, 'icon.svg'), ICON_SVG);
      fs.writeFileSync(path.join(ASSETS_DIR, 'adaptive-icon.svg'), ADAPTIVE_ICON_SVG);
      fs.writeFileSync(path.join(ASSETS_DIR, 'splash.svg'), SPLASH_SVG);
      console.log('\n✓ SVG files written to assets folder.');
      console.log('Convert these to PNG using an online tool or image editor.');
    } else {
      console.error('Error generating icons:', error);
    }
  }
}

// Export SVG strings for reference
module.exports = { ICON_SVG, SPLASH_SVG, ADAPTIVE_ICON_SVG };

// Run if called directly
if (require.main === module) {
  generateIcons();
}
