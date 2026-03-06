/**
 * Data Migration Utility
 * 
 * Migrates user data from Tauri data location to Electron data location.
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { logMainProcess, formatError } = require('../main/logger');

// Tauri data paths (platform-specific)
const TAURI_DATA_PATHS = {
  win32: path.join(process.env.APPDATA, 'Unity Generator'),
  darwin: path.join(process.env.HOME, 'Library', 'Application Support', 'Unity Generator'),
  linux: path.join(process.env.HOME, '.config', 'unity-generator')
};

// Electron data path
const ELECTRON_DATA_PATH = app.getPath('userData');

/**
 * Extract data from Tauri location
 * 
 * @returns {Object|null} Tauri data or null if not found
 */
function extractTauriData() {
  try {
    logMainProcess('Extracting data from Tauri location...');

    // Determine Tauri data path
    const tauriPath = TAURI_DATA_PATHS[process.platform];

    if (!tauriPath || !fs.existsSync(tauriPath)) {
      logMainProcess('Tauri data location not found');
      return null;
    }

    // Read Tauri data
    const tauriData = {
      path: tauriPath,
      files: [],
      settings: {}
    };

    // Read settings file if exists
    const settingsPath = path.join(tauriPath, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        const content = fs.readFileSync(settingsPath, 'utf8');
        tauriData.settings = JSON.parse(content);
        tauriData.files.push('settings.json');
      } catch (error) {
        logMainProcess(`Failed to read settings: ${formatError(error)}`);
      }
    }

    // Read database if exists
    const dbPath = path.join(tauriPath, 'database.db');
    if (fs.existsSync(dbPath)) {
      tauriData.files.push('database.db');
    }

    logMainProcess(`Extracted ${tauriData.files.length} files from Tauri location`);
    return tauriData;

  } catch (error) {
    logMainProcess(`Failed to extract Tauri data: ${formatError(error)}`);
    return null;
  }
}

/**
 * Migrate data to Electron location
 * 
 * @param {Object} tauriData - Tauri data to migrate
 * @returns {boolean} True if migration successful
 */
function migrateToElectron(tauriData) {
  try {
    logMainProcess('Migrating data to Electron location...');

    // Ensure Electron data directory exists
    if (!fs.existsSync(ELECTRON_DATA_PATH)) {
      fs.mkdirSync(ELECTRON_DATA_PATH, { recursive: true });
    }

    // Migrate settings
    if (tauriData.settings && Object.keys(tauriData.settings).length > 0) {
      const settingsPath = path.join(ELECTRON_DATA_PATH, 'settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(tauriData.settings, null, 2));
      logMainProcess('Settings migrated');
    }

    // Migrate database
    if (tauriData.files.includes('database.db')) {
      const tauriDbPath = path.join(tauriData.path, 'database.db');
      const electronDbPath = path.join(ELECTRON_DATA_PATH, 'database.db');

      if (fs.existsSync(tauriDbPath)) {
        fs.copyFileSync(tauriDbPath, electronDbPath);
        logMainProcess('Database migrated');
      }
    }

    logMainProcess('Data migration completed');
    return true;

  } catch (error) {
    logMainProcess(`Failed to migrate data: ${formatError(error)}`);
    return false;
  }
}

/**
 * Perform data migration
 * 
 * @returns {Object} Migration result
 */
function performDataMigration() {
  try {
    logMainProcess('Starting data migration...');

    // Extract Tauri data
    const tauriData = extractTauriData();

    if (!tauriData) {
      logMainProcess('No Tauri data to migrate');
      return {
        success: true,
        migrated: false,
        reason: 'No Tauri data found'
      };
    }

    // Migrate to Electron
    const migrated = migrateToElectron(tauriData);

    return {
      success: migrated,
      migrated,
      tauriFiles: tauriData.files,
      electronPath: ELECTRON_DATA_PATH
    };

  } catch (error) {
    logMainProcess(`Migration error: ${formatError(error)}`);
    return {
      success: false,
      migrated: false,
      error: error.message
    };
  }
}

/**
 * Check if migration is needed
 * 
 * @returns {boolean} True if migration needed
 */
function isMigrationNeeded() {
  try {
    // Check if Electron data directory exists
    if (fs.existsSync(ELECTRON_DATA_PATH)) {
      // Check if settings exist
      const settingsPath = path.join(ELECTRON_DATA_PATH, 'settings.json');
      if (fs.existsSync(settingsPath)) {
        return false;
      }
    }

    // Check if Tauri data exists
    const tauriPath = TAURI_DATA_PATHS[process.platform];
    if (tauriPath && fs.existsSync(tauriPath)) {
      return true;
    }

    return false;

  } catch (error) {
    logMainProcess(`Migration check error: ${formatError(error)}`);
    return false;
  }
}

module.exports = {
  extractTauriData,
  migrateToElectron,
  performDataMigration,
  isMigrationNeeded,
  ELECTRON_DATA_PATH
};
