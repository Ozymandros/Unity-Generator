/**
 * Data Migration Utility
 * 
 * Handles migration of user data from legacy application data location to Electron's
 * standard data location. This ensures user settings and data persist
 * during migration from the previous application version to the Electron version.
 */

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Get legacy data location
 * 
 * Legacy application stores data in platform-specific locations:
 * - Windows: %APPDATA%/{app_name}
 * - macOS: ~/Library/Application Support/{app_name}
 * - Linux: ~/.local/share/{app_name}
 * 
 * @returns {string} Path to legacy data directory
 */
function getLegacyDataLocation() {
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
 * Extract data from legacy data location
 * 
 * Reads all files and directories from the legacy data location
 * and returns them as a structured object.
 * 
 * @param {string} legacyPath - Path to legacy data directory
 * @returns {Object} Object containing file paths and their contents
 * @throws {Error} If legacy data location doesn't exist or can't be read
 * 
 * @example
 * ```javascript
 * const legacyData = extractLegacyData();
 * console.log(legacyData.files); // { 'settings.json': '{"theme":"dark"}', ... }
 * ```
 */
function extractLegacyData(legacyPath = getLegacyDataLocation()) {
  // Validate input
  if (!legacyPath || typeof legacyPath !== 'string') {
    throw new Error('legacyPath must be a non-empty string');
  }

  // Check if legacy data location exists
  if (!fs.existsSync(legacyPath)) {
    return {
      exists: false,
      files: {},
      directories: [],
      message: 'Legacy data location does not exist'
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

  readDirectory(legacyPath);

  return {
    exists: true,
    files,
    directories,
    legacyPath,
    count: Object.keys(files).length
  };
}

/**
 * Migrate data to Electron data location
 * 
 * Copies data from the extracted legacy data to Electron's userData directory.
 * Creates the Electron data directory if it doesn't exist.
 * 
 * @param {Object} legacyData - Object containing extracted legacy data
 * @param {string} electronPath - Path to Electron userData directory
 * @returns {Object} Migration result with counts and any errors
 * @throws {Error} If migration fails due to permission or I/O errors
 * 
 * @example
 * ```javascript
 * const legacyData = extractLegacyData();
 * const result = migrateToElectron(legacyData);
 * console.log(result.migrated); // Number of files migrated
 * console.log(result.errors);   // Array of any errors encountered
 * ```
 */
function migrateToElectron(legacyData, electronPath = getElectronDataLocation()) {
  // Validate inputs
  if (!legacyData || typeof legacyData !== 'object') {
    throw new Error('legacyData must be an object');
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

  // If legacy data doesn't exist, nothing to migrate
  if (!legacyData.exists) {
    result.skipped = 0;
    result.message = 'No legacy data to migrate';
    return result;
  }

  // Copy each file from legacy data to Electron data
  for (const [relativePath, content] of Object.entries(legacyData.files)) {
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
  for (const dir of legacyData.directories) {
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
 * Perform complete data migration from legacy application to Electron
 * 
 * Convenience function that combines extractLegacyData() and migrateToElectron()
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
  const legacyPath = getLegacyDataLocation();
  const electronPath = getElectronDataLocation();

  console.log(`Legacy data location: ${legacyPath}`);
  console.log(`Electron data location: ${electronPath}`);

  // Extract data from legacy application
  const legacyData = extractLegacyData(legacyPath);

  if (!legacyData.exists) {
    console.log('No legacy data found to migrate');
    return {
      success: true,
      migrated: 0,
      skipped: 0,
      message: 'No legacy data found',
      legacyPath,
      electronPath
    };
  }

  console.log(`Found ${legacyData.count} files in legacy data location`);

  // Migrate to Electron
  const result = migrateToElectron(legacyData, electronPath);

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
    legacyPath,
    electronPath
  };
}

module.exports = {
  getLegacyDataLocation,
  getElectronDataLocation,
  extractLegacyData,
  migrateToElectron,
  performMigration
};