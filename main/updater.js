/**
 * Auto-Update Manager
 * 
 * Handles application updates using Electron's autoUpdate module.
 * Checks for updates on startup and provides manual update checking.
 * 
 * @fileoverview This module provides:
 * - Update checking on application startup
 * - Manual update checking capability
 * - Download and installation of updates
 * - Error handling and user notifications
 * - Platform-specific update mechanisms
 */

const { autoUpdater } = require('electron');
const { logMainProcess } = require('./logger');
const { showNotification } = require('./notification');

// Update check interval in milliseconds (24 hours)
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

// Update server URL
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://updates.unitygenerator.com';

// Track last update check time
let lastUpdateCheck = 0;

/**
 * Configure auto-updater for the application
 * 
 * Sets up the update server URL and event handlers for
 * update checking, downloading, and installation.
 * 
 * @returns {void}
 */
function configureAutoUpdater() {
  logMainProcess('Configuring auto-updater...');
  
  // Set update server URL
  autoUpdater.setFeedURL({
    url: `${UPDATE_SERVER_URL}/update/${process.platform}-${process.arch}/${require('../package.json').version}`,
    provider: 'generic'
  });
  
  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    logMainProcess('Checking for updates...');
  });
  
  autoUpdater.on('update-available', (info) => {
    logMainProcess(`Update available: ${info.version}`);
    showNotification({
      title: 'Update Available',
      body: `Version ${info.version} is available. Downloading...`,
      type: 'info'
    });
  });
  
  autoUpdater.on('update-not-available', (info) => {
    logMainProcess(`No update available: ${info.version}`);
  });
  
  autoUpdater.on('download-progress', (progress) => {
    logMainProcess(`Download progress: ${progress.percent}%`);
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    logMainProcess(`Update downloaded: ${info.version}`);
    showNotification({
      title: 'Update Downloaded',
      body: `Version ${info.version} has been downloaded. Restart to install.`,
      type: 'success'
    });
    
    // Ask user to restart
    showNotification({
      title: 'Restart to Update',
      body: 'Click to restart and install the update',
      type: 'info',
      action: {
        label: 'Restart Now',
        callback: () => {
          setImmediate(() => {
            autoUpdater.quitAndInstall();
          });
        }
      }
    });
  });
  
  autoUpdater.on('error', (error) => {
    logMainProcess(`Update error: ${error.message}`);
    showNotification({
      title: 'Update Error',
      body: `Failed to check for updates: ${error.message}`,
      type: 'error'
    });
  });
  
  logMainProcess('Auto-updater configured');
}

/**
 * Check for updates
 * 
 * Initiates a check for available updates from the update server.
 * 
 * @returns {Promise<boolean>} True if update check was initiated, false otherwise
 */
async function checkForUpdates() {
  try {
    logMainProcess('Checking for updates...');
    await autoUpdater.checkForUpdates();
    return true;
  } catch (error) {
    logMainProcess(`Update check failed: ${error.message}`);
    return false;
  }
}

/**
 * Check for updates at configured intervals
 * 
 * Sets up automatic update checking at regular intervals.
 * 
 * @returns {void}
 */
function startAutoUpdateCheck() {
  logMainProcess('Starting automatic update checks...');
  
  // Check immediately
  checkForUpdates();
  
  // Then check at intervals
  setInterval(() => {
    const now = Date.now();
    if (now - lastUpdateCheck > UPDATE_CHECK_INTERVAL) {
      checkForUpdates();
      lastUpdateCheck = now;
    }
  }, UPDATE_CHECK_INTERVAL);
  
  logMainProcess('Automatic update checks started');
}

/**
 * Get current update status
 * 
 * @returns {object} Update status information
 */
function getUpdateStatus() {
  return {
    autoUpdateEnabled: true,
    lastCheck: lastUpdateCheck,
    updateServer: UPDATE_SERVER_URL
  };
}

/**
 * Enable auto-updates
 * 
 * @returns {void}
 */
function enableAutoUpdates() {
  logMainProcess('Enabling auto-updates...');
  configureAutoUpdater();
  startAutoUpdateCheck();
}

/**
 * Disable auto-updates
 * 
 * @returns {void}
 */
function disableAutoUpdates() {
  logMainProcess('Disabling auto-updates...');
  // Note: Electron's autoUpdater doesn't have a direct disable method
  // We just stop checking by not calling checkForUpdates
}

module.exports = {
  configureAutoUpdater,
  checkForUpdates,
  startAutoUpdateCheck,
  getUpdateStatus,
  enableAutoUpdates,
  disableAutoUpdates
};
