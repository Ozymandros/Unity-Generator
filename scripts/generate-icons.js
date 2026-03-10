/**
 * Icon Generation Script
 * 
 * Generates platform-specific icon files from app-icon.png:
 * - Windows: .ico file (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
 * - macOS: .icns file (1024x1024 down to 16x16)
 * - Linux: .png files (512x512, 256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
 * - Web: favicon.ico and various sizes for PWA
 * 
 * Requirements:
 * - Install sharp: pnpm add -D sharp
 * - Install png-to-ico: pnpm add -D png-to-ico
 * - For macOS .icns: Install png2icons (npm install -g png2icons)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const SOURCE_ICON = path.join(__dirname, '..', 'app-icon.png');
const OUTPUT_DIR = path.join(__dirname, '..');
const FRONTEND_PUBLIC = path.join(__dirname, '..', 'frontend', 'public');

// Icon sizes for different platforms
const WINDOWS_SIZES = [256, 128, 64, 48, 32, 16];
const MACOS_SIZES = [1024, 512, 256, 128, 64, 32, 16];
const LINUX_SIZES = [512, 256, 128, 64, 48, 32, 16];
const FAVICON_SIZES = [16, 32, 48];
const PWA_SIZES = [192, 512];

/**
 * Ensure directory exists
 * 
 * @param {string} dir - Directory path
 */
async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Generate PNG files at specified sizes
 * 
 * @param {string} source - Source image path
 * @param {number[]} sizes - Array of sizes to generate
 * @param {string} outputDir - Output directory
 * @param {string} prefix - Filename prefix
 */
async function generatePNGs(source, sizes, outputDir, prefix = 'icon') {
  await ensureDir(outputDir);
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `${prefix}-${size}x${size}.png`);
    await sharp(source)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${outputPath}`);
  }
}

/**
 * Generate Windows ICO file
 * 
 * @param {string} source - Source image path
 * @param {string} output - Output ICO path
 */
async function generateWindowsICO(source, output) {
  try {
    const pngToIco = require('png-to-ico');
    
    // Generate temporary PNGs at required sizes
    const tempDir = path.join(__dirname, '..', 'temp-icons');
    await ensureDir(tempDir);
    
    const pngPaths = [];
    for (const size of WINDOWS_SIZES) {
      const tempPath = path.join(tempDir, `temp-${size}.png`);
      await sharp(source)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(tempPath);
      pngPaths.push(tempPath);
    }
    
    // Convert to ICO - png-to-ico default export
    const buf = await (pngToIco.default || pngToIco)(pngPaths);
    await writeFile(output, buf);
    console.log(`✓ Generated ${output}`);
    
    // Cleanup temp files
    for (const pngPath of pngPaths) {
      fs.unlinkSync(pngPath);
    }
    fs.rmdirSync(tempDir);
  } catch (error) {
    console.error(`✗ Failed to generate Windows ICO: ${error.message}`);
    console.log('  Install png-to-ico: pnpm add -D png-to-ico');
  }
}

/**
 * Generate macOS ICNS file
 * 
 * @param {string} source - Source image path
 * @param {string} output - Output ICNS path
 */
async function generateMacOSICNS(source, output) {
  console.log('\n⚠ macOS .icns generation requires manual steps:');
  console.log('  1. Install png2icons: npm install -g png2icons');
  console.log(`  2. Run: png2icons ${source} ${output}`);
  console.log('  Or use iconutil on macOS:');
  console.log('    - Create an iconset directory');
  console.log('    - Add icon files at required sizes');
  console.log('    - Run: iconutil -c icns iconset.iconset');
}

/**
 * Generate favicon files
 * 
 * @param {string} source - Source image path
 * @param {string} outputDir - Output directory
 */
async function generateFavicons(source, outputDir) {
  await ensureDir(outputDir);
  
  // Generate favicon.ico
  try {
    const pngToIco = require('png-to-ico');
    
    const tempDir = path.join(__dirname, '..', 'temp-favicon');
    await ensureDir(tempDir);
    
    const pngPaths = [];
    for (const size of FAVICON_SIZES) {
      const tempPath = path.join(tempDir, `favicon-${size}.png`);
      await sharp(source)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(tempPath);
      pngPaths.push(tempPath);
    }
    
    // Convert to ICO - png-to-ico default export
    const buf = await (pngToIco.default || pngToIco)(pngPaths);
    await writeFile(path.join(outputDir, 'favicon.ico'), buf);
    console.log(`✓ Generated ${path.join(outputDir, 'favicon.ico')}`);
    
    // Cleanup
    for (const pngPath of pngPaths) {
      fs.unlinkSync(pngPath);
    }
    fs.rmdirSync(tempDir);
  } catch (error) {
    console.error(`✗ Failed to generate favicon.ico: ${error.message}`);
  }
  
  // Generate PNG favicons for web
  for (const size of [...FAVICON_SIZES, ...PWA_SIZES]) {
    const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
    await sharp(source)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${outputPath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generating icons from app-icon.png...\n');
  
  // Check if source exists
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`✗ Source icon not found: ${SOURCE_ICON}`);
    process.exit(1);
  }
  
  try {
    // Windows ICO
    console.log('📦 Windows Icons:');
    await generateWindowsICO(SOURCE_ICON, path.join(OUTPUT_DIR, 'app-icon.ico'));
    
    // Linux PNGs
    console.log('\n🐧 Linux Icons:');
    await generatePNGs(SOURCE_ICON, LINUX_SIZES, OUTPUT_DIR, 'app-icon');
    
    // Web favicons
    console.log('\n🌐 Web Favicons:');
    await generateFavicons(SOURCE_ICON, FRONTEND_PUBLIC);
    
    // macOS ICNS (manual)
    console.log('\n🍎 macOS Icons:');
    await generateMacOSICNS(SOURCE_ICON, path.join(OUTPUT_DIR, 'app-icon.icns'));
    
    console.log('\n✅ Icon generation complete!');
    console.log('\nGenerated files:');
    console.log('  - app-icon.ico (Windows)');
    console.log('  - app-icon-*.png (Linux, multiple sizes)');
    console.log('  - frontend/public/favicon.ico');
    console.log('  - frontend/public/favicon-*.png');
    console.log('\nManual step required:');
    console.log('  - Generate app-icon.icns for macOS (see instructions above)');
    
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
