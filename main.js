/**
 * Electron Main Process Entry Point
 * 
 * Initializes the Electron application, manages lifecycle, and coordinates
 * all components including the Python backend, window management, and IPC.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { configureAccessibility } = require('./main/window');

// Import main process modules
const { startPythonBackend, waitForBackendReady, gracefulShutdown } = require('./main/lifecycle');
const { createMainWindow, handleWindowClose, loadFrontend } = require('./main/window');
const { logMainProcess, formatError } = require('./main/logger');
const { showNotification, requestPermissions } = require('./main/notification');
const { validateInput, handleCSPViolation, configureCSP } = require('./main/security');
const { loadLanguageResources, translateText } = require('./main/i18n');
const { performMigration } = require('./main/migration');

const { enableAutoUpdates } = require('./main/updater');
const { registerURLScheme, processURL, forwardToBackend, forwardToFrontend } = require('./main/url');

// Application state
let mainWindow = null;
let backendProcess = null;
let isQuitting = false;

/**
 * Initialize the application
 * 
 * 1. Configure accessibility support
 * 2. Perform data migration from legacy application to Electron
 * 3. Register URL scheme
 * 4. Start Python backend
 * 5. Wait for backend to be ready
 * 6. Enable auto-updates
 * 7. Create main window
 * 8. Load Vue frontend
 */
async function initializeApp() {
  try {
    logMainProcess('Initializing application...');
    
    // Step 1: Configure accessibility support
    logMainProcess('Configuring accessibility support...');
    configureAccessibility();
    
    // Step 2: Perform data migration from legacy application to Electron
    logMainProcess('Checking for data migration...');
    const migrationResult = performMigration();
    
    if (migrationResult.migrated > 0) {
      logMainProcess(`Migrated ${migrationResult.migrated} files from legacy application to Electron`);
    }
    
    if (migrationResult.errors.length > 0) {
      logMainProcess(`Migration completed with ${migrationResult.errors.length} errors`);
    }
    
    // Step 3: Register URL scheme
    logMainProcess('Registering URL scheme...');
    const urlSchemeRegistered = registerURLScheme();
    
    if (urlSchemeRegistered) {
      logMainProcess('URL scheme registered successfully');
    } else {
      logMainProcess('URL scheme registration skipped or failed');
    }
    
    // Step 4: Start Python backend
    logMainProcess('Starting Python FastAPI backend...');
    backendProcess = await startPythonBackend();
    
    // Step 5: Wait for backend to be ready
    logMainProcess('Waiting for backend to be ready...');
    const backendReady = await waitForBackendReady(backendProcess);
    
    if (!backendReady) {
      logMainProcess('Backend failed to start, showing error...');
      await showNotification({
        title: 'Backend Error',
        body: 'Failed to start Python FastAPI backend. Please check logs.',
        type: 'error'
      });
      app.quit();
      return;
    }
    
    logMainProcess('Backend is ready');
    
    // Step 6: Enable auto-updates
    logMainProcess('Enabling auto-updates...');
    enableAutoUpdates();
    
    // Step 7: Create main window
    logMainProcess('Creating main window...');
    mainWindow = createMainWindow();
    
    // Step 8: Load Vue frontend
    logMainProcess('Loading Vue frontend...');
    loadFrontend(mainWindow);
    
    logMainProcess('Application initialized successfully');
    
  } catch (error) {
    logMainProcess(`Initialization error: ${formatError(error)}`);
    await showNotification({
      title: 'Initialization Error',
      body: 'Failed to initialize application. Please check logs.',
      type: 'error'
    });
    app.quit();
  }
}



/**
 * IPC Handlers for renderer process communication
 */

// Backend status
ipcMain.handle('backend:status', async () => {
  if (!backendProcess) {
    return { isRunning: false, health: 'stopped' };
  }
  
  return {
    isRunning: true,
    health: 'healthy',
    port: 8000
  };
});

// Backend restart
ipcMain.handle('backend:restart', async () => {
  try {
    if (backendProcess) {
      backendProcess.kill('SIGTERM');
    }
    
    backendProcess = await startPythonBackend();
    const ready = await waitForBackendReady(backendProcess);
    
    return {
      isRunning: ready,
      health: ready ? 'healthy' : 'unhealthy',
      port: 8000
    };
  } catch (error) {
    logMainProcess(`Backend restart error: ${formatError(error)}`);
    return { isRunning: false, health: 'unhealthy', error: error.message };
  }
});

// Notification show
ipcMain.handle('notification:show', async (event, notification) => {
  return showNotification(notification);
});

// Logger error
ipcMain.handle('logger:error', async (event, error) => {
  logMainProcess(formatError(error));
  return true;
});

// Request notification permissions
ipcMain.handle('notification:request-permissions', async () => {
  return requestPermissions();
});

// Translate text
ipcMain.handle('i18n:translate', async (event, key, params) => {
  return translateText(key, params);
});

// Load language resources
ipcMain.handle('i18n:load', async (event, language) => {
  return loadLanguageResources(language);
});

// Get available languages
ipcMain.handle('i18n:available-languages', async () => {
  const { getAvailableLanguages } = require('./main/i18n');
  return getAvailableLanguages();
});

// Input validation
ipcMain.handle('security:validate', async (event, input) => {
  return validateInput(input);
});

// Handle CSP violation
ipcMain.handle('security:csp-violation', async (event, violation) => {
  return handleCSPViolation(violation);
});

// Migration functionality
/**
 * Get migration status including legacy and Electron data locations.
 * 
 * Returns information about legacy and Electron data directories including
 * their paths and whether they exist on the filesystem.
 * 
 * @returns {Object} Migration status object with:
 *   - legacyPath: Path to legacy data directory
 *   - electronPath: Path to Electron userData directory  
 *   - legacyExists: Boolean indicating if legacy data directory exists
 *   - electronExists: Boolean indicating if Electron data directory exists
 * 
 * @example
 * ```javascript
 * const status = await ipcRenderer.invoke('migration:status');
 * console.log(`Legacy path: ${status.legacyPath}, exists: ${status.legacyExists}`);
 * ```
 */
ipcMain.handle('migration:status', async () => {
  const { getLegacyDataLocation, getElectronDataLocation } = require('./main/migration');
  const legacyPath = getLegacyDataLocation();
  const electronPath = getElectronDataLocation();
  
  return {
    legacyPath,
    electronPath,
    legacyExists: require('fs').existsSync(legacyPath),
    electronExists: require('fs').existsSync(electronPath)
  };
});

/**
 * Perform complete data migration from legacy application to Electron.
 * 
 * Executes the full migration process including:
 * 1. Extracting data from legacy data location
 * 2. Migrating files to Electron userData directory
 * 3. Returning migration results with counts and any errors
 * 
 * @returns {Object} Migration result with:
 *   - success: Boolean indicating if migration completed without errors
 *   - migrated: Number of files successfully migrated
 *   - skipped: Number of files skipped
 *   - errors: Array of any errors encountered during migration
 *   - legacyPath: Path to legacy data directory
 *   - electronPath: Path to Electron userData directory
 * 
 * @example
 * ```javascript
 * const result = await ipcRenderer.invoke('migration:perform');
 * if (result.migrated > 0) {
 *   console.log(`Migrated ${result.migrated} files successfully`);
 * }
 * ```
 */
ipcMain.handle('migration:perform', async () => {
  const { performMigration } = require('./main/migration');
  return performMigration();
});

/**
 * Extract data from legacy data location without migrating.
 * 
 * Reads all files and directories from the legacy data location
 * and returns them as a structured object. Useful for previewing
 * what data would be migrated.
 * 
 * @returns {Object} Extracted legacy data with:
 *   - exists: Boolean indicating if legacy data location exists
 *   - files: Object mapping relative file paths to file contents
 *   - directories: Array of directory paths in legacy data location
 *   - legacyPath: Path to legacy data directory
 *   - count: Number of files found
 * 
 * @example
 * ```javascript
 * const data = await ipcRenderer.invoke('migration:extract-data');
 * console.log(`Found ${data.count} files in legacy data location`);
 * ```
 */
ipcMain.handle('migration:extract-data', async () => {
  const { extractLegacyData } = require('./main/migration');
  return extractLegacyData();
});

// File dialog for opening files
ipcMain.handle('dialog:open-file', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

// File dialog for saving files
ipcMain.handle('dialog:save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

// Show error dialog
ipcMain.handle('dialog:error', async (event, options) => {
  const result = await dialog.showMessageBox({
    type: 'error',
    title: options.title || 'Error',
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['OK']
  });
  return result;
});

// Show info dialog
ipcMain.handle('dialog:info', async (event, options) => {
  const result = await dialog.showMessageBox({
    type: 'info',
    title: options.title || 'Information',
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['OK']
  });
  return result;
});

// Show warning dialog
ipcMain.handle('dialog:warning', async (event, options) => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    title: options.title || 'Warning',
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['OK']
  });
  return result;
});

// Show question dialog
ipcMain.handle('dialog:question', async (event, options) => {
  const result = await dialog.showMessageBox({
    type: 'question',
    title: options.title || 'Question',
    message: options.message,
    detail: options.detail,
    buttons: options.buttons || ['Yes', 'No'],
    defaultId: options.defaultId || 1,
    cancelId: options.cancelId || 1
  });
  return result;
});

// Shell operations
/**
 * Open a file or folder in the system's default application.
 *
 * @param filePath - Path to file or folder to open
 * @returns Object with success status and optional error message
 *
 * @example
 * ```javascript
 * const result = await ipcRenderer.invoke('shell:open-path', '/path/to/folder');
 * if (result.success) {
 *   console.log('Folder opened successfully');
 * }
 * ```
 */
ipcMain.handle('shell:open-path', async (_event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    return {
      success: false,
      error: 'File path must be a non-empty string'
    };
  }

  try {
    const { shell } = require('electron');
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    logMainProcess(`Shell open-path error: ${formatError(error)}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open path'
    };
  }
});

// Process URL scheme
ipcMain.handle('url:process', async (event, url) => {
  const { processURL } = require('./main/url');
  return processURL(url);
});

// Check for updates
ipcMain.handle('updater:check', async () => {
  const { checkForUpdates } = require('./main/updater');
  return await checkForUpdates();
});

// Get update status
ipcMain.handle('updater:status', async () => {
  const { getUpdateStatus } = require('./main/updater');
  return getUpdateStatus();
});

// Application lifecycle events
app.on('ready', async () => {
  try {
    await initializeApp();
  } catch (error) {
    logMainProcess(`Ready error: ${formatError(error)}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  isQuitting = true;
  
  if (backendProcess) {
    logMainProcess('Stopping Python backend before quit...');
    try {
      backendProcess.kill('SIGTERM');
    } catch (error) {
      logMainProcess(`Backend stop error: ${formatError(error)}`);
    }
  }
});

app.on('quit', () => {
  logMainProcess('Application quit');
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeApp();
  }
});

// Handle Squirrel.Windows events (Windows installer)
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Handle URL scheme (Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    
    // Handle URL scheme if provided
    if (commandLine.length > 1) {
      const url = commandLine[commandLine.length - 1];
      if (url.startsWith('unitygen://')) {
        logMainProcess(`URL scheme received: ${url}`);
        
        // Process the URL
        const result = processURL(url);
        
        if (result.success) {
          logMainProcess(`URL processed: action=${result.parsed.host}`);
          
          // Forward to backend if needed
          if (result.actions.forwardToBackend) {
            const backendParams = forwardToBackend(result.parsed);
            if (backendParams) {
              logMainProcess(`Forwarding to backend: ${JSON.stringify(backendParams)}`);
              // Backend will handle the action via HTTP API
            }
          }
          
          // Forward to frontend if needed
          if (result.actions.forwardToFrontend) {
            const queryString = forwardToFrontend(result.parsed);
            if (queryString && mainWindow) {
              const currentURL = mainWindow.webContents.getURL();
              const newURL = currentURL.includes('?') 
                ? currentURL.split('?')[0] + queryString
                : currentURL + queryString;
              mainWindow.loadURL(newURL);
              logMainProcess(`Forwarded to frontend: ${newURL}`);
            }
          }
          
          // Show window if needed
          if (result.actions.showWindow && mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
          }
        } else {
          logMainProcess(`URL processing failed: ${result.error}`);
        }
      }
    }
  });
}

// Handle URL scheme (macOS)
app.on('open-url', (event, url) => {
  event.preventDefault();
  logMainProcess(`URL scheme received: ${url}`);
  
  // Process the URL
  const result = processURL(url);
  
  if (result.success) {
    logMainProcess(`URL processed: action=${result.parsed.host}`);
    
    // Forward to backend if needed
    if (result.actions.forwardToBackend) {
      const backendParams = forwardToBackend(result.parsed);
      if (backendParams) {
        logMainProcess(`Forwarding to backend: ${JSON.stringify(backendParams)}`);
        // Backend will handle the action via HTTP API
      }
    }
    
    // Forward to frontend if needed
    if (result.actions.forwardToFrontend) {
      const queryString = forwardToFrontend(result.parsed);
      if (queryString && mainWindow) {
        const currentURL = mainWindow.webContents.getURL();
        const newURL = currentURL.includes('?') 
          ? currentURL.split('?')[0] + queryString
          : currentURL + queryString;
        mainWindow.loadURL(newURL);
        logMainProcess(`Forwarded to frontend: ${newURL}`);
      }
    }
    
    // Show window if needed
    if (result.actions.showWindow && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  } else {
    logMainProcess(`URL processing failed: ${result.error}`);
  }
});

logMainProcess('Electron main process started');
