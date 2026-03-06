# Electron Migration Documentation

This document provides comprehensive documentation for the Electron migration from Tauri. It covers architecture, configuration, platform compatibility, and migration procedures.

## Overview

This application has migrated from a Rust-Tauri-Cargo architecture to an Electron-based architecture. The Python FastAPI backend remains as a separate service, and Electron acts as a desktop wrapper around the Vue frontend.

### Key Differences from Tauri

| Aspect | Tauri | Electron |
|--------|-------|----------|
| Runtime | Rust compiled to binary | Node.js + Chromium |
| System Access | Tauri Rust API | Node.js APIs + Electron APIs |
| Build System | Cargo + Tauri CLI | npm + Electron Forge |
| IPC | Tauri IPC | Electron IPC (main ↔ renderer) |
| Packaging | Tauri packager | Electron Forge packager |

## Architecture

### Electron Process Model

Electron applications use a multi-process architecture with two main types of processes:

#### Main Process

The main process is the entry point of the Electron application. It:

- Manages application lifecycle
- Creates and manages renderer processes (windows)
- Handles system-level operations
- Spawns and manages the Python FastAPI backend
- Handles IPC communication with renderer processes

**Key Files:**
- `main.js` - Main process entry point
- `main/lifecycle.js` - Application lifecycle management
- `main/window.js` - Window management
- `main/process.js` - Backend process management
- `main/logger.js` - Centralized logging
- `main/security.js` - Security configuration

#### Renderer Process

The renderer process runs the Vue frontend application. It:

- Renders the UI using Chromium
- Communicates with the main process via IPC
- Makes HTTP requests to the Python FastAPI backend
- Handles user interactions

**Key Files:**
- `renderer/api.ts` - API client for backend communication
- `renderer/status.js` - Status banner component

### IPC Communication Patterns

Electron uses Inter-Process Communication (IPC) for communication between main and renderer processes.

#### Synchronous IPC (`ipcMain.handle` / `ipcRenderer.invoke`)

Use for requests that need a response:

```javascript
// Main process
const { ipcMain } = require('electron');

ipcMain.handle('backend:status', async () => {
  return getBackendStatus();
});

// Renderer process
const status = await ipcRenderer.invoke('backend:status');
```

#### Asynchronous IPC (`ipcMain.on` / `ipcRenderer.send`)

Use for one-way messages:

```javascript
// Main process
const { ipcMain } = require('electron');

ipcMain.on('notification:show', (event, notification) => {
  showNotification(notification);
});

// Renderer process
ipcRenderer.send('notification:show', {
  title: 'Hello',
  body: 'World'
});
```

#### Bidirectional Communication

For complex interactions, use a combination:

```javascript
// Main process
ipcMain.handle('data:process', async (event, data) => {
  const result = await processData(data);
  event.sender.send('data:processed', result);
  return { status: 'processing' };
});

// Renderer process
const response = await ipcRenderer.invoke('data:process', myData);
ipcRenderer.on('data:processed', (event, result) => {
  console.log('Processing complete:', result);
});
```

## CSP Configuration

### Content Security Policy Headers

CSP prevents XSS attacks by restricting resource loading. The application uses strict CSP headers.

### Configuration

```javascript
// main/security.js
function configureCSP(webContents) {
  const cspHeaders = {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self' http://127.0.0.1:8000",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  };
  
  webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        ...cspHeaders
      }
    });
  });
}
```

### CSP Directives Explained

| Directive | Purpose | Application Value |
|-----------|---------|-------------------|
| `default-src` | Fallback for other directives | `'self'` - only load from same origin |
| `script-src` | JavaScript sources | `'self'` - only same origin scripts |
| `style-src` | CSS sources | `'self' 'unsafe-inline'` - inline styles for Vue |
| `img-src` | Image sources | `'self' data:` - allow data URIs |
| `font-src` | Font sources | `'self' data:` - allow data URIs |
| `connect-src` | AJAX requests | `'self' http://127.0.0.1:8000` - backend only |
| `frame-src` | Frame sources | `'self'` - same origin frames |
| `object-src` | Plugin resources | `'none'` - no plugins |
| `base-uri` | Base element | `'self'` - same origin |
| `form-action` | Form submissions | `'self'` - same origin |

### Troubleshooting CSP Violations

#### Common Issues

1. **Inline scripts blocked**
   - **Error**: `Refused to execute inline script because it violates the 'unsafe-inline' Content Security Policy directive`
   - **Solution**: Move inline scripts to external files or add `'unsafe-inline'` to `script-src`

2. **External resources blocked**
   - **Error**: `Refused to connect to 'https://example.com' because it violates the connect-src directive`
   - **Solution**: Add the domain to `connect-src` directive

3. **Font loading issues**
   - **Error**: `Access to font at 'https://fonts.example.com' from origin 'null' has been blocked by CORS policy`
   - **Solution**: Add font domain to `font-src` directive

#### Debugging CSP

Enable CSP violation reporting:

```javascript
const cspHeaders = {
  'Content-Security-Policy': [
    // ... other directives
    "report-uri /csp-violation-report-endpoint",
    "report-to /csp-violation-report-endpoint"
  ].join('; ')
};
```

## Dependency Management

### Node.js Dependencies

#### Installation

```bash
pnpm install
```

#### Key Dependencies

| Package | Purpose |
|---------|---------|
| `electron` | Electron runtime |
| `electron-forge` | Packaging and distribution |
| `axios` | HTTP client for backend communication |
| `concurrently` | Running multiple processes during development |

#### Development Dependencies

| Package | Purpose |
|---------|---------|
| `electron` | Electron runtime (dev) |
| `electron-forge` | Packaging (dev) |

### Python Dependencies

#### Installation

```bash
cd backend
pip install -r requirements.txt
```

#### Key Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `sqlalchemy` | Database ORM |
| `pydantic` | Data validation |

### Tauri Dependency Cleanup

#### Removed Dependencies

The following Tauri-specific dependencies were removed from `package.json`:

```json
{
  "devDependencies": {
    "@tauri-apps/cli": null  // Removed
  },
  "dependencies": {
    "@tauri-apps/api": null  // Removed
  }
}
```

#### Verification Steps

1. Check `package.json` for any remaining `@tauri-apps/*` references
2. Run `pnpm install` to ensure clean dependency tree
3. Verify no Tauri-specific code remains in the codebase

#### Cleanup Script

```bash
# Remove Tauri dependencies
pnpm remove @tauri-apps/api @tauri-apps/cli

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Multi-Platform Compatibility

### Platform-Specific Considerations

#### Windows

- **File paths**: Use forward slashes or `path.join()` for compatibility
- **Backend path**: Python may be installed as `python.exe` or `python`
- **Installer**: Uses Squirrel for MSI installation
- **Permissions**: May require administrator privileges for certain operations

#### macOS

- **File paths**: Use forward slashes or `path.join()`
- **Backend path**: Python is typically available as `python3`
- **Installer**: Uses DMG with notarization
- **Permissions**: May require user permission for system access

#### Linux

- **File paths**: Use forward slashes
- **Backend path**: Python is typically available as `python3`
- **Installer**: Uses DEB/RPM with AppImage support
- **Permissions**: May require sudo for certain operations

### SQLite Database Configuration

#### Cross-Platform Path Handling

```javascript
const { app } = require('electron');
const path = require('path');

// Get platform-appropriate data directory
const userDataPath = app.getPath('userData');

// Database path
const dbPath = path.join(userDataPath, 'app.db');

// Ensure directory exists
const fs = require('fs');
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
```

#### Platform-Specific SQLite

SQLite is bundled with Node.js and works consistently across platforms. No additional configuration is needed.

### File Path Handling

#### Best Practices

1. **Always use `path.join()`** for path construction:

```javascript
const path = require('path');

// Correct
const filePath = path.join(userDataPath, 'config.json');

// Incorrect
const filePath = userDataPath + '/config.json';
```

2. **Use `app.getPath()`** for system directories:

```javascript
const { app } = require('electron');

const paths = {
  userData: app.getPath('userData'),
  desktop: app.getPath('desktop'),
  documents: app.getPath('documents'),
  downloads: app.getPath('downloads'),
  temp: app.getPath('temp')
};
```

3. **Normalize paths** for cross-platform compatibility:

```javascript
const path = require('path');

// Normalize path separators
const normalizedPath = path.normalize(userPath).replace(/\\/g, '/');
```

## SQLite Database

### Cross-Platform Configuration

The SQLite database is configured for cross-platform compatibility using Electron's `app.getPath('userData')` for the database location.

### Database Location

```javascript
const { app } = require('electron');
const path = require('path');

const dbPath = path.join(app.getPath('userData'), 'app.db');
```

### Database Management

#### Connection Pooling

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

#### Graceful Shutdown

```python
def shutdown_database():
    """Close all database connections gracefully."""
    SessionLocal.close_all()
    engine.dispose()
```

### Schema Migration Handling

#### Using Alembic

```bash
# Initialize Alembic
alembic init migrations

# Create migration
alembic revision -m "Add new table"

# Apply migration
alembic upgrade head
```

#### Migration Script Example

```python
# migrations/versions/001_add_users_table.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('email', sa.String(100), nullable=False, unique=True)
    )

def downgrade():
    op.drop_table('users')
```

## Discoverability Features

### File Associations

#### Windows

Configure in `forge.config.js`:

```javascript
module.exports = {
  packagerConfig: {
    fileAssociations: [
      {
        ext: 'myapp',
        name: 'MyApp Document',
        icon: 'assets/icon.ico'
      }
    ]
  }
};
```

#### macOS

Configure in `forge.config.js`:

```javascript
module.exports = {
  packagerConfig: {
    fileAssociations: [
      {
        ext: 'myapp',
        name: 'MyApp Document',
        icon: 'assets/icon.icns'
      }
    ]
  }
};
```

#### Linux

Configure in `forge.config.js`:

```javascript
module.exports = {
  packagerConfig: {
    fileAssociations: [
      {
        ext: 'myapp',
        name: 'MyApp Document',
        icon: 'assets/icon.png'
      }
    ]
  }
};
```

### URL Scheme Registration

#### Windows

```javascript
const { app } = require('electron');

app.setAsDefaultProtocolClient('myapp');
```

#### macOS

```javascript
const { app } = require('electron');

app.setAsDefaultProtocolClient('myapp');
```

#### Linux

```javascript
const { app } = require('electron');

app.setAsDefaultProtocolClient('myapp');
```

### Application Icon Configuration

#### Windows

```javascript
module.exports = {
  packagerConfig: {
    icon: 'assets/icon.ico'
  }
};
```

#### macOS

```javascript
module.exports = {
  packagerConfig: {
    icon: 'assets/icon.icns'
  }
};
```

#### Linux

```javascript
module.exports = {
  packagerConfig: {
    icon: 'assets/icon.png'
  }
};
```

## Migration Checklist

### Steps for Removing Tauri Code

1. **Remove Tauri Dependencies**
   ```bash
   pnpm remove @tauri-apps/api @tauri-apps/cli
   ```

2. **Remove Tauri Configuration Files**
   - Delete `src-tauri/` directory
   - Delete `tauri.conf.json` or `tauri.config.json`
   - Delete `src-tauri/tauri.conf.json` (if exists)

3. **Remove Tauri-Specific Code**
   - Remove all `@tauri-apps/api` imports
   - Replace Tauri file system API with Node.js `fs` module
   - Replace Tauri shell API with Node.js `child_process` module
   - Replace Tauri window API with Electron `BrowserWindow` API

4. **Update Build Scripts**
   - Remove Tauri build scripts from `package.json`
   - Add Electron build scripts

5. **Clean Install**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Verification Steps

1. **Dependency Check**
   ```bash
   pnpm list @tauri-apps/*
   # Should return no results
   ```

2. **Code Search**
   ```bash
   grep -r "@tauri-apps" .
   # Should return no results
   ```

3. **Build Test**
   ```bash
   pnpm electron:build
   # Should complete successfully
   ```

4. **Runtime Test**
   ```bash
   pnpm electron:dev
   # Application should start without Tauri errors
   ```

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Forge Documentation](https://www.electronforge.io/)
- [Python FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vue 3 Documentation](https://vuejs.org/)
## CSP Configuration

### Content Security Policy Headers

CSP prevents XSS attacks by restricting resource loading. The application uses strict CSP headers configured in the main process.

### Configuration

```javascript
// main/security.js
const { session } = require('electron');

/**
 * Configure Content Security Policy headers for the application.
 * 
 * @param {BrowserWindow} window - The Electron browser window to configure
 * 
 * @example
 * ```javascript
 * const window = createMainWindow();
 * configureCSP(window);
 * ```
 */
function configureCSP(window) {
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self' http://127.0.0.1:8000",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspPolicy]
      }
    });
  });
}

module.exports = { configureCSP };
```

### CSP Directives Explained

| Directive | Purpose | Application Value |
|-----------|---------|-------------------|
| `default-src` | Fallback for other directives | `'self'` - only load from same origin |
| `script-src` | JavaScript sources | `'self'` - only same origin scripts |
| `style-src` | CSS sources | `'self' 'unsafe-inline'` - inline styles for Vue |
| `img-src` | Image sources | `'self' data:` - allow data URIs |
| `font-src` | Font sources | `'self' data:` - allow data URIs |
| `connect-src` | AJAX requests | `'self' http://127.0.0.1:8000` - backend only |
| `frame-src` | Frame sources | `'self'` - same origin frames |
| `object-src` | Plugin resources | `'none'` - no plugins |
| `base-uri` | Base element | `'self'` - same origin |
| `form-action` | Form submissions | `'self'` - same origin |

### Troubleshooting CSP Violations

#### Common Issues

1. **Inline scripts blocked**
   - **Error**: `Refused to execute inline script because it violates the 'unsafe-inline' Content Security Policy directive`
   - **Solution**: Move inline scripts to external files or add `'unsafe-inline'` to `script-src`

2. **External resources blocked**
   - **Error**: `Refused to connect to 'https://example.com' because it violates the connect-src directive`
   - **Solution**: Add the domain to `connect-src` directive

3. **Font loading issues**
   - **Error**: `Access to font at 'https://fonts.example.com' from origin 'null' has been blocked by CORS policy`
   - **Solution**: Add font domain to `font-src` directive

#### Debugging CSP

Enable CSP violation reporting:

```javascript
const cspPolicy = [
  // ... other directives
  "report-uri /csp-violation-report-endpoint",
  "report-to /csp-violation-report-endpoint"
].join('; ');
```

## Dependency Management

### Node.js Dependencies

#### Installation

```bash
pnpm install
```

#### Key Dependencies

| Package | Purpose |
|---------|---------|
| `electron` | Electron runtime |
| `electron-forge` | Packaging and distribution |
| `axios` | HTTP client for backend communication |
| `concurrently` | Running multiple processes during development |

#### Development Dependencies

| Package | Purpose |
|---------|---------|
| `electron` | Electron runtime (dev) |
| `electron-forge` | Packaging (dev) |

### Python Dependencies

#### Installation

```bash
cd backend
pip install -r requirements.txt
```

#### Key Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `sqlalchemy` | Database ORM |
| `pydantic` | Data validation |

### Tauri Dependency Cleanup

#### Removed Dependencies

The following Tauri-specific dependencies were removed from `package.json`:

```json
{
  "devDependencies": {
    "@tauri-apps/cli": null  // Removed
  },
  "dependencies": {
    "@tauri-apps/api": null  // Removed
  }
}
```

#### Verification Steps

1. Check `package.json` for any remaining `@tauri-apps/*` references
2. Run `pnpm install` to ensure clean dependency tree
3. Verify no Tauri-specific code remains in the codebase

#### Cleanup Script

```bash
# Remove Tauri dependencies
pnpm remove @tauri-apps/api @tauri-apps/cli

# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Multi-Platform Compatibility

### Platform-Specific Considerations

#### Windows

- **File paths**: Use forward slashes or `path.join()` for compatibility
- **Backend path**: Python may be installed as `python.exe` or `python`
- **Installer**: Uses Squirrel for MSI installation
- **Permissions**: May require administrator privileges for certain operations

#### macOS

- **File paths**: Use forward slashes or `path.join()`
- **Backend path**: Python is typically available as `python3`
- **Installer**: Uses DMG with notarization
- **Permissions**: May require user permission for system access

#### Linux

- **File paths**: Use forward slashes
- **Backend path**: Python is typically available as `python3`
- **Installer**: Uses DEB/RPM with AppImage support
- **Permissions**: May require sudo for certain operations

### SQLite Database Configuration

#### Cross-Platform Path Handling

```javascript
const { app } = require('electron');
const path = require('path');

// Get platform-appropriate data directory
const userDataPath = app.getPath('userData');

// Database path
const dbPath = path.join(userDataPath, 'app.db');

// Ensure directory exists
const fs = require('fs');
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
```

#### Platform-Specific SQLite

SQLite is bundled with Node.js and works consistently across platforms. No additional configuration is needed.

### File Path Handling

#### Best Practices

1. **Always use `path.join()`** for path construction:

```javascript
const path = require('path');

// Correct
const filePath = path.join(userDataPath, 'config.json');

// Incorrect
const filePath = userDataPath + '/config.json';
```

2. **Use `app.getPath()`** for system directories:

```javascript
const { app } = require('electron');

const paths = {
  userData: app.getPath('userData'),
  desktop: app.getPath('desktop'),
  documents: app.getPath('documents'),
  downloads: app.getPath('downloads'),
  temp: app.getPath('temp')
};
```

3. **Normalize paths** for cross-platform compatibility:

```javascript
const path = require('path');

// Normalize path separators
const normalizedPath = path.normalize(userPath).replace(/\\/g, '/');
```

## SQLite Database

### Cross-Platform Configuration

The SQLite database is configured for cross-platform compatibility using Electron's `app.getPath('userData')` for the database location.

### Database Location

```javascript
const { app } = require('electron');
const path = require('path');

const dbPath = path.join(app.getPath('userData'), 'app.db');
```

### Database Management

#### Connection Pooling

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

#### Graceful Shutdown

```python
def shutdown_database():
    """Close all database connections gracefully."""
    SessionLocal.close_all()
    engine.dispose()
```

### Schema Migration Handling

#### Using Alembic

```bash
# Initialize Alembic
alembic init migrations

# Create migration
alembic revision -m "Add new table"

# Apply migration
alembic upgrade head
```

#### Migration Script Example

```python
# migrations/versions/001_add_users_table.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('email', sa.String(100), nullable=False, unique=True)
    )

def downgrade():
    op.drop_table('users')
```

## Discoverability Features

### File Associations

#### Windows

Configure in `forge.config.js`:

```javascript
module.exports = {
  packagerConfig: {
    fileAssociations: [
      {
        ext: 'myapp',
        name: 'MyApp Document',
        icon: 'assets/icon.ico'
      }
    ]
  }
};
```

#### macOS

Configure in `forge.config.js`:

```javascript
module.exports = {
  packagerConfig: {
    fileAssociations: [
      {
        ext: 'myapp',
        name: 'MyApp Document',
        icon: 'assets/icon.icns'
      }
    ]
  }
};
```

#### Linux

Configure in `forge.config.js`:

```javascript
module.exports = {
  packagerConfig: {
    fileAssociations: [
      {
        ext: 'myapp',
        name: 'MyApp Document',
        icon: 'assets/icon.png'
      }
    ]
  }
};
```

### URL Scheme Registration

#### Windows

```javascript
const { app } = require('electron');

app.setAsDefaultProtocolClient('myapp');
```

#### macOS

```javascript
const { app } = require('electron');

app.setAsDefaultProtocolClient('myapp');
```

#### Linux

```javascript
const { app } = require('electron');

app.setAsDefaultProtocolClient('myapp');
```

### Application Icon Configuration

#### Windows

```javascript
module.exports = {
  packagerConfig: {
    icon: 'assets/icon.ico'
  }
};
```

#### macOS

```javascript
module.exports = {
  packagerConfig: {
    icon: 'assets/icon.icns'
  }
};
```

#### Linux

```javascript
module.exports = {
  packagerConfig: {
    icon: 'assets/icon.png'
  }
};
```

## Migration Checklist

### Steps for Removing Tauri Code

1. **Remove Tauri Dependencies**
   ```bash
   pnpm remove @tauri-apps/api @tauri-apps/cli
   ```

2. **Remove Tauri Configuration Files**
   - Delete `src-tauri/` directory
   - Delete `tauri.conf.json` or `tauri.config.json`
   - Delete `src-tauri/tauri.conf.json` (if exists)

3. **Remove Tauri-Specific Code**
   - Remove all `@tauri-apps/api` imports
   - Replace Tauri file system API with Node.js `fs` module
   - Replace Tauri shell API with Node.js `child_process` module
   - Replace Tauri window API with Electron `BrowserWindow` API

4. **Update Build Scripts**
   - Remove Tauri build scripts from `package.json`
   - Add Electron build scripts

5. **Clean Install**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Verification Steps

1. **Dependency Check**
   ```bash
   pnpm list @tauri-apps/*
   # Should return no results
   ```

2. **Code Search**
   ```bash
   grep -r "@tauri-apps" .
   # Should return no results
   ```

3. **Build Test**
   ```bash
   pnpm electron:build
   # Should complete successfully
   ```

4. **Runtime Test**
   ```bash
   pnpm electron:dev
   # Application should start without Tauri errors
   ```

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Forge Documentation](https://www.electronforge.io/)
- [Python FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vue 3 Documentation](https://vuejs.org/)
