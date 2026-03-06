/**
 * Data Migration Utility
 * 
 * Handles migration of user data from Tauri data location to Electron's
 * standard data location. This ensures user settings and data persist
 * during migration from the Tauri-wrapped application to the Electron version.
 */

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Get Tauri data location
 * 
 * Tauri stores data in platform-specific locations:
 * - Windows: %APPDATA%/{app_name}
 * - macOS: ~/Library/Application Support/{app_name}
 * - Linux: ~/.local/share/{app_name}
 * 
 * @returns {string} Path to Tauri data directory
 */
function getTauriDataLocation() {
  const appName = 'unity-generator';
  
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA || '', appName);
    case 'darwin':
      return path.join(require('os').homedir(), 'Library', 'Application Support', appName);
    case 'linux':
      return path.join(require('os').homedir(), '.local', 'share', appName);
    default:
      return path.join(require('os').homedir(), '.config', appName);
  }
}

/**
 * Get Electron data location
 * 
 * Electron uses app.getPath('userData') which provides:
 * - Windows: %APPDATA%/{electron_app_name}
 * - macOS: ~/Library/Application Support/{electron_app_name}
 * - Linux: ~/.config/{electron_app_name}
 * 
 * @returns {string} Path to Electron userData directory
 */
function getElectronDataLocation() {
  return app.getPath('userData');
}

/**
 * Extract data from Tauri data location
 * 
 * Reads all files and directories from the Tauri data location
 * and returns them as a structured object.
 * 
 * @param {string} tauriPath - Path to Tauri data directory
 * @returns {Object} Object containing file paths and their contents
 * @throws {Error} If Tauri data location doesn't exist or can't be read
 * 
 * @example
 * ```javascript
 * const tauriData = extractTauriData();
 * console.log(tauriData.files); // { 'settings.json': '{"theme":"dark"}', ... }
 * ```
 */
function extractTauriData(tauriPath = getTauriDataLocation()) {
  // Validate input
  if (!tauriPath || typeof tauriPath !== 'string') {
    throw new Error('tauriPath must be a non-empty string');
  }

  // Check if Tauri data location exists
  if (!fs.existsSync(tauriPath)) {
    return {
      exists: false,
      files: {},
      directories: [],
      message: 'Tauri data location does not exist'
    };
  }

  const files = {};
  const directories = [];

  /**
   * Recursively read directory contents
   * 
   * @param {string} dirPath - Path to directory to read
   * @param {string} basePath - Base path for relative file paths
   */
  function readDirectory(dirPath, basePath = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        directories.push(relativePath);
        readDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          files[relativePath] = content;
        } catch (error) {
          console.warn(`Failed to read file ${relativePath}: ${error.message}`);
        }
      }
    }
  }

  readDirectory(tauriPath);

  return {
    exists: true,
    files,
    directories,
    tauriPath,
    count: Object.keys(files).length
  };
}

/**
 * Migrate data to Electron data location
 * 
 * Copies data from the extracted Tauri data to Electron's userData directory.
 * Creates the Electron data directory if it doesn't exist.
 * 
 * @param {Object} tauriData - Object containing extracted Tauri data
 * @param {string} electronPath - Path to Electron userData directory
 * @returns {Object} Migration result with counts and any errors
 * @throws {Error} If migration fails due to permission or I/O errors
 * 
 * @example
 * ```javascript
 * const tauriData = extractTauriData();
 * const result = migrateToElectron(tauriData);
 * console.log(result.migrated); // Number of files migrated
 * console.log(result.errors);   // Array of any errors encountered
 * ```
 */
function migrateToElectron(tauriData, electronPath = getElectronDataLocation()) {
  // Validate inputs
  if (!tauriData || typeof tauriData !== 'object') {
    throw new Error('tauriData must be an object');
  }

  if (!electronPath || typeof electronPath !== 'string') {
    throw new Error('electronPath must be a non-empty string');
  }

  const result = {
    migrated: 0,
    skipped: 0,
    errors: [],
    electronPath
  };

  // Create Electron data directory if it doesn't exist
  try {
    if (!fs.existsSync(electronPath)) {
      fs.mkdirSync(electronPath, { recursive: true });
    }
  } catch (error) {
    result.errors.push({
      type: 'directory_creation',
      message: `Failed to create Electron data directory: ${error.message}`
    });
    return result;
  }

  // If Tauri data doesn't exist, nothing to migrate
  if (!tauriData.exists) {
    result.skipped = 0;
    result.message = 'No Tauri data to migrate';
    return result;
  }

  // Copy each file from Tauri data to Electron data
  for (const [relativePath, content] of Object.entries(tauriData.files)) {
    try {
      const targetPath = path.join(electronPath, relativePath);
      const targetDir = path.dirname(targetPath);

      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Write file content
      fs.writeFileSync(targetPath, content, 'utf8');
      result.migrated++;
    } catch (error) {
      result.errors.push({
        file: relativePath,
        type: 'file_write',
        message: `Failed to write file ${relativePath}: ${error.message}`
      });
    }
  }

  // Copy directories (create empty directories for structure)
  for (const dir of tauriData.directories) {
    try {
      const targetDir = path.join(electronPath, dir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    } catch (error) {
      result.errors.push({
        directory: dir,
        type: 'directory_creation',
        message: `Failed to create directory ${dir}: ${error.message}`
      });
    }
  }

  return result;
}

/**
 * Perform complete data migration from Tauri to Electron
 * 
 * Convenience function that combines extractTauriData() and migrateToElectron()
 * into a single operation.
 * 
 * @returns {Object} Migration result
 * 
 * @example
 * ```javascript
 * const result = performMigration();
 * if (result.migrated > 0) {
 *   console.log(`Migrated ${result.migrated} files successfully`);
 * }
 * ```
 */
function performMigration() {
  const tauriPath = getTauriDataLocation();
  const electronPath = getElectronDataLocation();

  console.log(`Tauri data location: ${tauriPath}`);
  console.log(`Electron data location: ${electronPath}`);

  // Extract data from Tauri
  const tauriData = extractTauriData(tauriPath);

  if (!tauriData.exists) {
    console.log('No Tauri data found to migrate');
    return {
      success: true,
      migrated: 0,
      skipped: 0,
      message: 'No Tauri data found',
      tauriPath,
      electronPath
    };
  }

  console.log(`Found ${tauriData.count} files in Tauri data location`);

  // Migrate to Electron
  const result = migrateToElectron(tauriData, electronPath);

  // Log results
  if (result.errors.length > 0) {
    console.warn(`Migration completed with ${result.errors.length} errors`);
    for (const error of result.errors) {
      console.warn(`  - ${error.type}: ${error.message}`);
    }
  }

  console.log(`Migrated ${result.migrated} files to Electron data location`);

  return {
    success: result.errors.length === 0,
    migrated: result.migrated,
    skipped: result.skipped,
    errors: result.errors,
    tauriPath,
    electronPath
  };
}

module.exports = {
  getTauriDataLocation,
  getElectronDataLocation,
  extractTauriData,
  migrateToElectron,
  performMigration
};
