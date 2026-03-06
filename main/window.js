/**
 * Window Manager
 * 
 * Manages application windows including creation, cleanup, and frontend loading.
 */

const { BrowserWindow, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { logMainProcess, formatError } = require('./logger');

// Window configuration
const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;
const WINDOW_MIN_WIDTH = 800;
const WINDOW_MIN_HEIGHT = 600;

/**
 * Configure accessibility for the application
 * 
 * Enables accessibility features and ensures screen reader support.
 * This function should be called during application initialization.
 */
function configureAccessibility() {
  try {
    logMainProcess('Configuring accessibility support...');
    
    // Enable accessibility support in Electron
    // This is required for screen readers to work properly
    app.commandLine.appendSwitch('force-renderer-accessibility', 'true');
    
    // Enable platform accessibility APIs
    // On macOS: VoiceOver support
    // On Windows: MSAA/IUIAutomation support
    // On Linux: AT-SPI support
    app.accessibilitySupport = true;
    
    // Listen for theme changes to update accessibility
    nativeTheme.on('updated', () => {
      if (nativeTheme.shouldUseDarkColors) {
        logMainProcess('Accessibility: Dark theme detected');
      } else {
        logMainProcess('Accessibility: Light theme detected');
      }
    });
    
    logMainProcess('Accessibility support configured successfully');
    
  } catch (error) {
    logMainProcess(`Failed to configure accessibility: ${formatError(error)}`);
    // Don't throw - accessibility is optional but recommended
  }
}

/**
 * Create the main application window
 * 
 * @returns {BrowserWindow} The created window
 */
function createMainWindow() {
  try {
    logMainProcess('Creating main window...');
    
    const window = new BrowserWindow({
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      minWidth: WINDOW_MIN_WIDTH,
      minHeight: WINDOW_MIN_HEIGHT,
      title: 'Unity Generator',
      icon: path.join(__dirname, '..', 'app-icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: true,
        // Enable accessibility support for screen readers
        accessibilitySupport: true,
        // Enable accessibility features in renderer
        plugins: true,
        // Enable web security but allow accessibility
        webSecurity: true,
        // Enable accessibility in webview
        webviewTag: true
      },
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 16, y: 16 }
    });
    
    // Set accessibility name for screen readers
    window.setAccessibilityTitle('Unity Generator Application');
    
    // Ensure window is accessible
    window.accessibleName = 'Unity Generator';
    window.accessibleDescription = 'Main application window for Unity Generator';
    
    logMainProcess('Main window created with accessibility support');
    
    return window;
    
  } catch (error) {
    logMainProcess(`Failed to create window: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Handle window close event
 * 
 * @param {BrowserWindow} window - The window being closed
 */
function handleWindowClose(window) {
  try {
    logMainProcess('Window close event');
    
    // Clean up window reference
    if (window === global.mainWindow) {
      global.mainWindow = null;
      logMainProcess('Main window reference cleared');
    }
    
  } catch (error) {
    logMainProcess(`Window close error: ${formatError(error)}`);
  }
}

/**
 * Load Vue frontend into window
 * 
 * @param {BrowserWindow} window - The window to load frontend into
 */
function loadFrontend(window) {
  try {
    logMainProcess('Loading Vue frontend...');
    
    // Check if we're in development or production
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // In development, load from Vite dev server
      window.loadURL('http://localhost:5173');
      logMainProcess('Loaded Vue frontend from dev server');
    } else {
      // In production, load from built files
      const frontendPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
      
      if (fs.existsSync(frontendPath)) {
        window.loadFile(frontendPath);
        logMainProcess('Loaded Vue frontend from built files');
      } else {
        throw new Error(`Frontend not found: ${frontendPath}`);
      }
    }
    
  } catch (error) {
    logMainProcess(`Failed to load frontend: ${formatError(error)}`);
    throw error;
  }
}

/**
 * Update window title
 * 
 * @param {BrowserWindow} window - The window to update
 * @param {string} title - The new title
 */
function updateWindowTitle(window, title) {
  try {
    window.setTitle(title);
    logMainProcess(`Window title updated: ${title}`);
  } catch (error) {
    logMainProcess(`Failed to update window title: ${formatError(error)}`);
  }
}

/**
 * Show window
 * 
 * @param {BrowserWindow} window - The window to show
 */
function showWindow(window) {
  try {
    window.show();
    window.focus();
    logMainProcess('Window shown');
  } catch (error) {
    logMainProcess(`Failed to show window: ${formatError(error)}`);
  }
}

/**
 * Hide window
 * 
 * @param {BrowserWindow} window - The window to hide
 */
function hideWindow(window) {
  try {
    window.hide();
    logMainProcess('Window hidden');
  } catch (error) {
    logMainProcess(`Failed to hide window: ${formatError(error)}`);
  }
}

/**
 * Minimize window
 * 
 * @param {BrowserWindow} window - The window to minimize
 */
function minimizeWindow(window) {
  try {
    window.minimize();
    logMainProcess('Window minimized');
  } catch (error) {
    logMainProcess(`Failed to minimize window: ${formatError(error)}`);
  }
}

/**
 * Maximize window
 * 
 * @param {BrowserWindow} window - The window to maximize
 */
function maximizeWindow(window) {
  try {
    window.maximize();
    logMainProcess('Window maximized');
  } catch (error) {
    logMainProcess(`Failed to maximize window: ${formatError(error)}`);
  }
}

/**
 * Restore window
 * 
 * @param {BrowserWindow} window - The window to restore
 */
function restoreWindow(window) {
  try {
    window.restore();
    logMainProcess('Window restored');
  } catch (error) {
    logMainProcess(`Failed to restore window: ${formatError(error)}`);
  }
}

/**
 * Set window bounds
 * 
 * @param {BrowserWindow} window - The window to resize
 * @param {Object} bounds - New bounds {x, y, width, height}
 */
function setWindowBounds(window, bounds) {
  try {
    window.setBounds(bounds);
    logMainProcess(`Window bounds updated: ${JSON.stringify(bounds)}`);
  } catch (error) {
    logMainProcess(`Failed to set window bounds: ${formatError(error)}`);
  }
}

/**
 * Get window bounds
 * 
 * @param {BrowserWindow} window - The window to get bounds from
 * @returns {Object} Window bounds
 */
function getWindowBounds(window) {
  try {
    const bounds = window.getBounds();
    logMainProcess(`Window bounds: ${JSON.stringify(bounds)}`);
    return bounds;
  } catch (error) {
    logMainProcess(`Failed to get window bounds: ${formatError(error)}`);
    return null;
  }
}

module.exports = {
  createMainWindow,
  handleWindowClose,
  loadFrontend,
  updateWindowTitle,
  showWindow,
  hideWindow,
  minimizeWindow,
  maximizeWindow,
  restoreWindow,
  setWindowBounds,
  getWindowBounds
};
