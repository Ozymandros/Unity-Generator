# Electron Builder Migration

This document describes the migration from Electron Forge to electron-builder.

## Why electron-builder?

electron-builder is the industry standard for packaging Electron applications. It offers:

- **Faster builds**: More efficient packaging process
- **Better Vite integration**: No conflicts with Vite's build process
- **More flexible**: Extensive configuration options
- **Professional**: Used by most production Electron apps
- **Simpler**: Clean separation between Vite build and Electron packaging

## Migration Changes

### 1. Package Configuration

**Removed:**
- `forge.config.js` (Electron Forge configuration)
- All Vite config files for Forge (`vite.main.config.mjs`, `vite.preload.config.mjs`, `vite.renderer.config.mjs`)
- `@electron-forge/*` packages

**Added:**
- `build` section in `package.json` with electron-builder configuration
- Moved `electron` from `dependencies` to `devDependencies`

### 2. Build Scripts

**Old (Forge):**
```json
"electron:build": "electron-forge make"
```

**New (electron-builder):**
```json
"dist": "pnpm run build:backend && pnpm run build:frontend && electron-builder",
"dist:win": "pnpm run build:backend && pnpm run build:frontend && electron-builder --win",
"dist:mac": "pnpm run build:backend && pnpm run build:frontend && electron-builder --mac",
"dist:linux": "pnpm run build:backend && pnpm run build:frontend && electron-builder --linux"
```

### 3. File Structure

**Development:**
- Frontend: `frontend/src/` → Vite dev server at `http://localhost:5173`
- Backend: `backend/` → Python dev server at `http://127.0.0.1:8000`
- Main process: `main.js` (runs directly with `electron .`)
- Preload: `preload.js`

**Production Build:**
- Frontend: `frontend/dist/` (built by Vite)
- Backend: `backend/dist/` (built by PyInstaller)
- Main process: `main.js` (packaged by electron-builder)
- Preload: `preload.js` (packaged by electron-builder)
- Output: `dist-electron/` (final installers)

### 4. Path Updates in main.js

**Frontend loading:**
```javascript
// Development
window.loadURL('http://localhost:5173');

// Production
const frontendPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
window.loadFile(frontendPath);
```

**Backend path:**
```javascript
const isDev = process.env.NODE_ENV === 'development';
const backendPath = isDev 
  ? path.join(__dirname, '..', 'backend')
  : path.join(process.resourcesPath, 'backend');
```

**Icon paths:**
```javascript
// Simplified to work with electron-builder's file structure
icon: path.join(__dirname, 'app-icon.png')
```

### 5. electron-builder Configuration

Located in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.unitygenerator.app",
    "productName": "Unity Generator",
    "files": [
      "main.js",
      "preload.js",
      "main/**/*",
      "frontend/dist/**/*",
      "app-icon.*"
    ],
    "extraResources": [
      {
        "from": "backend/dist",
        "to": "backend",
        "filter": ["**/*"]
      }
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "app-icon.ico"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "app-icon.icns",
      "category": "public.app-category.developer-tools"
    },
    "linux": {
      "target": ["deb", "AppImage"],
      "icon": "app-icon.png",
      "category": "Development"
    },
    "directories": {
      "output": "dist-electron"
    }
  }
}
```

### 6. GitHub Workflows

Updated both `build.yml` and `release.yml`:

**Build commands:**
- Windows: `pnpm run dist:win`
- macOS: `pnpm run dist:mac`
- Linux: `pnpm run dist:linux`

**Artifact paths:**
- Old: `out/make/squirrel.windows/**/*.exe`
- New: `dist-electron/*.exe`

## Build Process

### Two-Step Build

electron-builder works best with a clean two-step process:

1. **Step 1 - Vite Build:**
   ```bash
   pnpm run build:frontend
   ```
   This builds the Vue app to `frontend/dist/`

2. **Step 2 - Electron Package:**
   ```bash
   electron-builder
   ```
   This packages everything into installers in `dist-electron/`

### Full Build Command

```bash
pnpm run dist        # All platforms
pnpm run dist:win    # Windows only
pnpm run dist:mac    # macOS only
pnpm run dist:linux  # Linux only
```

## Development Workflow

No changes to development workflow:

```bash
# Terminal 1: Backend
pnpm run dev:backend

# Terminal 2: Frontend
pnpm run dev:frontend

# Terminal 3: Electron
pnpm run dev:electron
```

Or use the combined command:
```bash
pnpm run dev
```

## Troubleshooting

### Issue: "Cannot find module 'frontend/dist/index.html'"

**Solution:** Run `pnpm run build:frontend` before packaging.

### Issue: Backend not found in production

**Solution:** Verify `backend/dist/` exists and contains the PyInstaller executable.

### Issue: Icons not showing

**Solution:** 
1. Ensure all icon files exist: `app-icon.png`, `app-icon.ico`, `app-icon.icns`
2. Run `pnpm run generate:icons` to regenerate them

### Issue: Build fails with "DEP0187"

**Solution:** This was a Forge issue. electron-builder doesn't have this problem.

## Benefits of electron-builder

1. **No Vite conflicts**: Vite builds first, then electron-builder packages
2. **Faster builds**: More efficient packaging process
3. **Better control**: Explicit file inclusion via `files` array
4. **Industry standard**: Used by VS Code, Slack, Discord, etc.
5. **Better documentation**: More examples and community support
6. **Simpler debugging**: Clear separation of concerns

## Migration Checklist

- [x] Remove `forge.config.js`
- [x] Remove Vite config files for Forge
- [x] Add `build` configuration to `package.json`
- [x] Move `electron` to `devDependencies`
- [x] Update build scripts
- [x] Update `main.js` paths for production
- [x] Update GitHub workflows
- [x] Update `.gitignore` (already had `dist-electron/`)
- [x] Remove Forge-specific scripts
- [x] Test local build
- [ ] Test CI/CD builds
- [ ] Update documentation

## References

- [electron-builder Documentation](https://www.electron.build/)
- [electron-builder Configuration](https://www.electron.build/configuration/configuration)
- [Vite + Electron Guide](https://www.electron.build/tutorials/vite)
