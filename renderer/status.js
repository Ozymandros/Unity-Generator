/**
 * Status Banner Component
 * 
 * Displays status updates and errors to the user.
 */

// Status types
const STATUS_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Status element references
let statusElement = null;
let statusTimeout = null;

/**
 * Initialize status banner
 * 
 * @param {HTMLElement} element - Status banner element
 */
function initStatusBanner(element) {
  statusElement = element;
}

/**
 * Show status message
 * 
 * @param {string} message - Status message
 * @param {string} type - Status type (info, success, warning, error)
 * @param {number} duration - Duration in milliseconds (0 = no auto-hide)
 */
function showStatus(message, type = STATUS_TYPES.INFO, duration = 3000) {
  // Clear existing timeout
  if (statusTimeout) {
    clearTimeout(statusTimeout);
    statusTimeout = null;
  }

  // Update status element
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status-banner status-${type}`;
    statusElement.style.display = 'block';
  }

  // Auto-hide if duration specified
  if (duration > 0) {
    statusTimeout = setTimeout(() => {
      hideStatus();
    }, duration);
  }
}

/**
 * Show error message
 * 
 * @param {string} message - Error message
 * @param {string} details - Error details (optional)
 */
function showError(message, details = null) {
  showStatus(message, STATUS_TYPES.ERROR, 0); // Don't auto-hide errors

  // Log error to console
  console.error(`Error: ${message}`, details);
}

/**
 * Show success message
 * 
 * @param {string} message - Success message
 */
function showSuccess(message) {
  showStatus(message, STATUS_TYPES.SUCCESS);
}

/**
 * Show warning message
 * 
 * @param {string} message - Warning message
 */
function showWarning(message) {
  showStatus(message, STATUS_TYPES.WARNING);
}

/**
 * Show info message
 * 
 * @param {string} message - Info message
 */
function showInfo(message) {
  showStatus(message, STATUS_TYPES.INFO);
}

/**
 * Hide status message
 */
function hideStatus() {
  if (statusElement) {
    statusElement.style.display = 'none';
  }
}

/**
 * Clear all status messages
 */
function clearStatus() {
  hideStatus();
}

module.exports = {
  initStatusBanner,
  showStatus,
  showError,
  showSuccess,
  showWarning,
  showInfo,
  hideStatus,
  clearStatus,
  STATUS_TYPES
};
