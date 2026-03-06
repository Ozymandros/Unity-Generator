/**
 * Error Handling Utilities
 * 
 * Provides functions to format and handle errors from different sources
 * including Python FastAPI backend and process errors.
 */

/**
 * Format Python FastAPI backend error
 * 
 * @param {Object} backendError - Error object from Python backend
 * @param {number} backendError.status - HTTP status code
 * @param {string} backendError.message - Error message
 * @param {Object} [backendError.details] - Additional error details
 * @param {string} [backendError.traceback] - Python traceback
 * @param {string} [endpoint] - API endpoint that caused the error
 * @param {string} [method] - HTTP method used
 * @returns {Object} Formatted error object
 * 
 * @example
 * const backendError = {
 *   status: 500,
 *   message: "Internal server error",
 *   traceback: "Traceback (most recent call last):..."
 * };
 * const formatted = formatBackendError(backendError, '/tasks', 'POST');
 * // Returns: { message: "...", code: "BACKEND_ERROR", source: "backend", ... }
 */
function formatBackendError(backendError, endpoint = null, method = null) {
  // Validate input
  if (!backendError || typeof backendError !== 'object') {
    throw new TypeError('backendError must be an object');
  }

  if (backendError.status === undefined || backendError.status === null) {
    throw new Error('backendError must have a status property');
  }

  if (!backendError.message || typeof backendError.message !== 'string') {
    throw new Error('backendError must have a valid message string');
  }

  // Extract error details
  const status = backendError.status;
  const message = backendError.message;
  const details = backendError.details || {};
  const traceback = backendError.traceback || null;

  // Build formatted error object
  const formattedError = {
    message: message,
    code: 'BACKEND_ERROR',
    source: 'backend',
    status: status,
    details: {
      ...details,
      endpoint: endpoint,
      method: method,
      traceback: traceback
    },
    timestamp: Date.now()
  };

  // Add traceback to message if available
  if (traceback) {
    formattedError.message = `${message}\n\nTraceback:\n${traceback}`;
  }

  return formattedError;
}

/**
 * Format process error
 * 
 * @param {Object} processError - Process error object
 * @param {number} [processError.code] - Exit code
 * @param {string} [processError.signal] - Signal that terminated the process
 * @param {string} [processError.message] - Error message
 * @param {string} processName - Name of the process
 * @param {number} [processId] - Process ID
 * @returns {Object} Formatted error object
 * 
 * @example
 * const processError = {
 *   code: 1,
 *   signal: null,
 *   message: "Process exited with code 1"
 * };
 * const formatted = formatProcessError(processError, 'Python Backend', 12345);
 * // Returns: { message: "...", code: "PROCESS_ERROR", source: "process", ... }
 */
function formatProcessError(processError, processName, processId = null) {
  // Validate input
  if (!processError || typeof processError !== 'object') {
    throw new TypeError('processError must be an object');
  }

  if (!processName || typeof processName !== 'string') {
    throw new TypeError('processName must be a non-empty string');
  }

  // Extract error details
  const code = processError.code !== undefined ? processError.code : null;
  const signal = processError.signal || null;
  const message = processError.message || 'Process error occurred';

  // Build formatted error object
  const formattedError = {
    message: message,
    code: 'PROCESS_ERROR',
    source: 'process',
    processName: processName,
    processId: processId,
    details: {
      exitCode: code,
      signal: signal
    },
    timestamp: Date.now()
  };

  // Add process-specific details to message
  const processInfo = processId 
    ? ` (PID: ${processId})` 
    : ` (${processName})`;
  
  if (code !== null) {
    formattedError.message = `${message}${processInfo}, exit code: ${code}`;
  } else if (signal) {
    formattedError.message = `${message}${processInfo}, signal: ${signal}`;
  }

  return formattedError;
}

/**
 * Create a user-friendly error message for display
 * 
 * @param {Object} error - Formatted error object
 * @returns {string} User-friendly error message
 */
function getUserFriendlyErrorMessage(error) {
  // Validate input
  if (!error || typeof error !== 'object') {
    return 'An unknown error occurred';
  }

  const { source, code, message, details } = error;

  // Source-specific messages
  switch (source) {
    case 'backend':
      if (code === 'BACKEND_ERROR') {
        if (details?.exitCode === 111 || details?.message?.includes('Connection refused')) {
          return 'Unable to connect to the Python backend. Please ensure the backend is running.';
        }
        if (details?.status >= 500) {
          return 'The Python backend encountered an internal error. Please try again later.';
        }
        if (details?.status >= 400) {
          return 'The request to the Python backend failed. Please check your input.';
        }
        return `Backend error: ${message}`;
      }
      break;

    case 'process':
      if (code === 'PROCESS_ERROR') {
        if (details?.exitCode === 1) {
          return `${details?.processName || 'Process'} failed to start. Please check the logs for details.`;
        }
        if (details?.exitCode === 127) {
          return `${details?.processName || 'Process'} not found. Please ensure it is installed correctly.`;
        }
        if (details?.signal === 'SIGTERM') {
          return `${details?.processName || 'Process'} was terminated. Please try again.`;
        }
        return `${details?.processName || 'Process'} error: ${message}`;
      }
      break;

    case 'renderer':
      return `Application error: ${message}`;
  }

  // Default message
  return message || 'An error occurred';
}

module.exports = {
  formatBackendError,
  formatProcessError,
  getUserFriendlyErrorMessage
};
