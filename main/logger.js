/**
 * Logger
 * 
 * Centralized logging for all processes with standardized formatting.
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level
let currentLogLevel = process.env.NODE_ENV === 'development' 
  ? LOG_LEVELS.DEBUG 
  : LOG_LEVELS.INFO;

// Log file path
let logFilePath = null;

/**
 * Initialize logger
 * 
 * @param {string} logLevel - Log level (debug, info, warn, error)
 */
function initLogger(logLevel = 'info') {
  try {
    // Set log level
    const level = logLevel.toUpperCase();
    if (LOG_LEVELS[level] !== undefined) {
      currentLogLevel = LOG_LEVELS[level];
    }
    
    // Set log file path
    const userDataPath = app.getPath('userData');
    logFilePath = path.join(userDataPath, 'app.log');
    
    // Ensure log directory exists
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    console.log(`Logger initialized, log file: ${logFilePath}`);
    
  } catch (error) {
    console.error('Failed to initialize logger:', error);
  }
}

/**
 * Format log entry
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string} Formatted log entry
 */
function formatLogEntry(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const processName = process.type === 'browser' ? 'main' : 'renderer';
  
  const entry = {
    timestamp,
    level,
    process: processName,
    message,
    context
  };
  
  return JSON.stringify(entry);
}

/**
 * Write log entry to file
 * 
 * @param {string} entry - Formatted log entry
 */
function writeLogToFile(entry) {
  if (!logFilePath) {
    return;
  }
  
  try {
    fs.appendFileSync(logFilePath, entry + '\n');
  } catch (error) {
    console.error('Failed to write log entry:', error);
  }
}

/**
 * Log main process event
 * 
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logMainProcess(message, context = {}) {
  if (currentLogLevel > LOG_LEVELS.INFO) {
    return;
  }
  
  const entry = formatLogEntry('INFO', message, context);
  console.log(entry);
  writeLogToFile(entry);
}

/**
 * Log main process debug message
 * 
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logMainProcessDebug(message, context = {}) {
  if (currentLogLevel > LOG_LEVELS.DEBUG) {
    return;
  }
  
  const entry = formatLogEntry('DEBUG', message, context);
  console.debug(entry);
  writeLogToFile(entry);
}

/**
 * Log main process warning
 * 
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logMainProcessWarn(message, context = {}) {
  if (currentLogLevel > LOG_LEVELS.WARN) {
    return;
  }
  
  const entry = formatLogEntry('WARN', message, context);
  console.warn(entry);
  writeLogToFile(entry);
}

/**
 * Log main process error
 * 
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logMainProcessError(message, context = {}) {
  const entry = formatLogEntry('ERROR', message, context);
  console.error(entry);
  writeLogToFile(entry);
}

/**
 * Format error object
 * 
 * @param {Error|string} error - Error to format
 * @returns {string} Formatted error string
 */
function formatError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    };
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return JSON.stringify(error);
}

/**
 * Log renderer process error
 * 
 * @param {Object} error - Error object from renderer
 */
function logRendererProcessError(error) {
  if (currentLogLevel > LOG_LEVELS.ERROR) {
    return;
  }
  
  const formattedError = formatError(error);
  const entry = formatLogEntry('ERROR', formattedError.message || 'Renderer error', {
    error: formattedError,
    source: 'renderer'
  });
  
  console.error(entry);
  writeLogToFile(entry);
}

/**
 * Log backend process message
 * 
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logBackendProcess(message, context = {}) {
  if (currentLogLevel > LOG_LEVELS.INFO) {
    return;
  }
  
  const entry = formatLogEntry('INFO', message, {
    ...context,
    source: 'backend'
  });
  
  console.log(entry);
  writeLogToFile(entry);
}

/**
 * Log backend process error
 * 
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logBackendProcessError(message, context = {}) {
  const entry = formatLogEntry('ERROR', message, {
    ...context,
    source: 'backend'
  });
  
  console.error(entry);
  writeLogToFile(entry);
}

/**
 * Get log file path
 * 
 * @returns {string|null} Log file path
 */
function getLogFilePath() {
  return logFilePath;
}

/**
 * Read recent logs
 * 
 * @param {number} lines - Number of lines to read
 * @returns {string[]} Recent log lines
 */
function readRecentLogs(lines = 100) {
  if (!logFilePath || !fs.existsSync(logFilePath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(logFilePath, 'utf8');
    const allLines = content.split('\n').filter(line => line.trim());
    return allLines.slice(-lines);
  } catch (error) {
    console.error('Failed to read logs:', error);
    return [];
  }
}

module.exports = {
  initLogger,
  logMainProcess,
  logMainProcessDebug,
  logMainProcessWarn,
  logMainProcessError,
  logRendererProcessError,
  logBackendProcess,
  logBackendProcessError,
  formatError,
  getLogFilePath,
  readRecentLogs,
  LOG_LEVELS
};
