# Icon Generation Guide

This guide explains how to generate all required icon files for the Unity Generator application across all platforms.

## Source Icon

The source icon is located at: `app-icon.png`

This should be a high-resolution PNG (recommended: 1024x1024 or larger) with a transparent background.

## Required Icon Files

### Windows
- `app-icon.ico` - Multi-resolution ICO file (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)

### macOS
- `app-icon.icns` - Apple Icon Image format (1024x1024 down to 16x16)

### Linux
- `app-icon-512x512.png`
- `app-icon-256x256.png`
- `app-icon-128x128.png`
- `app-icon-64x64.png`
- `app-icon-48x48.png`
- `app-icon-32x32.png`
- `app-icon-16x16.png`

### Web/Frontend
- `frontend/public/favicon.ico` - Browser favicon
- `frontend/public/favicon-16x16.png`
- `frontend/public/favicon-32x32.png`
- `frontend/public/favicon-48x48.png`
- `frontend/public/favicon-192x192.png` - PWA icon
- `frontend/public/favicon-512x512.png` - PWA icon

## Automated Generation

### Prerequisites

Install required dependencies:

```bash
pnpm add -D -w sharp png-to-ico
```

### Run Generation Script

```bash
pnpm run generate:icons
```

This will generate:
- Windows ICO file
- Linux PNG files at all required sizes
- Web favicons and PWA icons

### macOS ICNS (Manual Step)

The macOS `.icns` file requires additional tools. Choose one of these methods:

#### Method 1: Using png2icons (Cross-platform)

```bash
# Install globally
npm install -g png2icons

# Generate ICNS
png2icons app-icon.png app-icon.icns
```

#### Method 2: Using iconutil (macOS only)

```bash
# Create iconset directory
mkdir app-icon.iconset

# Generate required sizes
sips -z 16 16     app-icon.png --out app-icon.iconset/icon_16x16.png
sips -z 32 32     app-icon.png --out app-icon.iconset/icon_16x16@2x.png
sips -z 32 32     app-icon.png --out app-icon.iconset/icon_32x32.png
sips -z 64 64     app-icon.png --out app-icon.iconset/icon_32x32@2x.png
sips -z 128 128   app-icon.png --out app-icon.iconset/icon_128x128.png
sips -z 256 256   app-icon.png --out app-icon.iconset/icon_128x128@2x.png
sips -z 256 256   app-icon.png --out app-icon.iconset/icon_256x256.png
sips -z 512 512   app-icon.png --out app-icon.iconset/icon_256x256@2x.png
sips -z 512 512   app-icon.png --out app-icon.iconset/icon_512x512.png
sips -z 1024 1024 app-icon.png --out app-icon.iconset/icon_512x512@2x.png

# Convert to ICNS
iconutil -c icns app-icon.iconset

# Cleanup
rm -rf app-icon.iconset
```

#### Method 3: Online Tools

Use online converters like:
- https://cloudconvert.com/png-to-icns
- https://iconverticons.com/online/

## Manual Generation (Alternative)

If you prefer manual generation or the automated script doesn't work:

### Windows ICO

Use tools like:
- **IcoFX** (Windows) - https://icofx.ro/
- **GIMP** (Cross-platform) - Export as ICO with multiple sizes
- **ImageMagick** (Command-line):
  ```bash
  convert app-icon.png -define icon:auto-resize=256,128,64,48,32,16 app-icon.ico
  ```

### Linux PNG Files

Use ImageMagick or any image editor:

```bash
convert app-icon.png -resize 512x512 app-icon-512x512.png
convert app-icon.png -resize 256x256 app-icon-256x256.png
convert app-icon.png -resize 128x128 app-icon-128x128.png
convert app-icon.png -resize 64x64 app-icon-64x64.png
convert app-icon.png -resize 48x48 app-icon-48x48.png
convert app-icon.png -resize 32x32 app-icon-32x32.png
convert app-icon.png -resize 16x16 app-icon-16x16.png
```

### Web Favicons

```bash
# Favicon ICO
convert app-icon.png -define icon:auto-resize=48,32,16 frontend/public/favicon.ico

# PNG favicons
convert app-icon.png -resize 16x16 frontend/public/favicon-16x16.png
convert app-icon.png -resize 32x32 frontend/public/favicon-32x32.png
convert app-icon.png -resize 48x48 frontend/public/favicon-48x48.png
convert app-icon.png -resize 192x192 frontend/public/favicon-192x192.png
convert app-icon.png -resize 512x512 frontend/public/favicon-512x512.png
```

## Verification

After generation, verify all files exist:

```bash
# Windows
ls app-icon.ico

# macOS
ls app-icon.icns

# Linux
ls app-icon-*.png

# Web
ls frontend/public/favicon*
```

## Icon Design Guidelines

For best results, your source `app-icon.png` should:

1. **Size**: 1024x1024 pixels or larger
2. **Format**: PNG with transparency
3. **Content**: 
   - Keep important elements centered
   - Avoid fine details that won't be visible at small sizes
   - Use high contrast colors
   - Test how it looks at 16x16 pixels
4. **Padding**: Leave some padding around edges (safe area)
5. **Background**: Transparent or solid color (avoid gradients at edges)

## Troubleshooting

### "sharp" installation fails

Try installing with:
```bash
pnpm add -D -w sharp --ignore-scripts
pnpm rebuild sharp
```

### "png-to-ico" not working

Alternative: Use online converters or ImageMagick as shown above.

### Icons not showing in Electron app

1. Verify file paths in `forge.config.js`
2. Rebuild the application: `pnpm run electron:build`
3. Check console for errors
4. Ensure icon files are not in `.gitignore`

## CI/CD Integration

The GitHub Actions workflows automatically use the generated icons during the build process. Ensure all icon files are committed to the repository before pushing.

## References

- [Electron Forge Icons](https://www.electronforge.io/guides/create-and-add-icons)
- [Apple Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Windows Icon Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design)
- [Linux Icon Theme Specification](https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html)
