/**
 * Notification Manager
 * 
 * Manages native system notifications and notification permissions.
 * 
 * @module notification
 */

const { Notification } = require('electron');
const { logMainProcess, formatError } = require('./logger');

// Notification permissions state
let permissionsGranted = false;

/**
 * Request notification permissions from the operating system.
 * 
 * On macOS, this registers the application with the Notification Center.
 * On Windows and Linux, permissions are typically granted by default.
 * 
 * @returns {boolean} True if notification permissions are granted, false otherwise
 * 
 * @throws {Error} If there's an unexpected error during permission request
 * 
 * @example
 * ```javascript
 * const { requestPermissions } = require('./notification');
 * 
 * if (requestPermissions()) {
 *   console.log('Permissions granted');
 * } else {
 *   console.log('Permissions not granted');
 * }
 * ```
 */
function requestPermissions() {
  try {
    // Validate that we're running in an Electron environment
    if (typeof Notification === 'undefined') {
      logMainProcess('Notification API not available');
      permissionsGranted = false;
      return false;
    }
    
    // On macOS, we need to register with the Notification Center
    if (process.platform === 'darwin') {
      // Register the application with the Notification Center
      // This will prompt the user for permission if not already granted
      const { shell } = require('electron');
      
      // Attempt to show a test notification to trigger permission prompt
      const testNotification = new Notification({
        title: 'Notification Test',
        body: 'This is a test to verify notification permissions',
        silent: true
      });
      
      testNotification.on('click', () => {
        testNotification.close();
      });
      
      testNotification.on('close', () => {
        // Permission status is now determined by whether the notification was shown
        permissionsGranted = true;
      });
      
      testNotification.show();
      
      // Wait a brief moment for permission prompt to be processed
      setTimeout(() => {
        permissionsGranted = true;
      }, 100);
      
    } else {
      // On Windows and Linux, permissions are granted by default
      permissionsGranted = true;
    }
    
    logMainProcess('Notification permissions request completed');
    return permissionsGranted;
    
  } catch (error) {
    logMainProcess(`Failed to request notification permissions: ${formatError(error)}`);
    permissionsGranted = false;
    return false;
  }
}

/**
 * Check if notification permissions are currently granted.
 * 
 * @returns {boolean} True if notification permissions are granted, false otherwise
 * 
 * @example
 * ```javascript
 * const { arePermissionsGranted } = require('./notification');
 * 
 * if (arePermissionsGranted()) {
 *   // Safe to show notifications
 * }
 * ```
 */
function arePermissionsGranted() {
  return permissionsGranted;
}

/**
 * Show a native system notification with the specified title and body.
 * 
 * @param {Object} notification - Notification object containing display information
 * @param {string} notification.title - The title of the notification (required)
 * @param {string} notification.body - The body text of the notification (optional)
 * @param {string} [notification.type='info'] - The type of notification for styling (info, warning, error, success)
 * @param {Object} [notification.actions] - Optional actions to attach to the notification
 * @param {Function} [notification.actions.onClick] - Callback function when notification is clicked
 * 
 * @returns {Promise<void>} Resolves when notification is displayed or fails gracefully
 * 
 * @throws {Error} If notification object is invalid or missing required fields
 * 
 * @example
 * ```javascript
 * const { showNotification } = require('./notification');
 * 
 * await showNotification({
 *   title: 'Task Complete',
 *   body: 'Your background task has finished successfully',
 *   type: 'success',
 *   actions: {
 *     onClick: () => console.log('Notification clicked')
 *   }
 * });
 * ```
 */
async function showNotification(notification) {
  try {
    // Validate input
    if (!notification || typeof notification !== 'object') {
      logMainProcess('Notification: Invalid notification object');
      return;
    }
    
    if (typeof notification.title !== 'string' || !notification.title.trim()) {
      logMainProcess('Notification: Title is required and must be a non-empty string');
      return;
    }
    
    // Check permissions before showing
    if (!permissionsGranted) {
      logMainProcess('Notification: Permissions not granted, logging warning and continuing');
      return;
    }
    
    const { title, body, type, actions } = notification;
    
    // Validate types
    if (body !== undefined && typeof body !== 'string') {
      logMainProcess('Notification: Body must be a string if provided');
      return;
    }
    
    if (type !== undefined && typeof type !== 'string') {
      logMainProcess('Notification: Type must be a string if provided');
      return;
    }
    
    if (actions !== undefined && (typeof actions !== 'object' || actions === null)) {
      logMainProcess('Notification: Actions must be an object if provided');
      return;
    }
    
    // Create notification
    const notify = new Notification({
      title: title.trim(),
      body: (body || '').trim(),
      icon: type ? getNotificationIcon(type) : undefined,
      silent: false
    });
    
    // Handle notification click
    if (actions && typeof actions.onClick === 'function') {
      notify.on('click', () => {
        logMainProcess('Notification clicked');
        try {
          actions.onClick();
        } catch (actionError) {
          logMainProcess(`Notification click handler error: ${formatError(actionError)}`);
        }
      });
    }
    
    // Handle notification close
    notify.on('close', () => {
      logMainProcess('Notification closed');
    });
    
    // Handle notification failure
    notify.on('failed', (event, failureReason) => {
      logMainProcess(`Notification failed: ${failureReason}`);
    });
    
    // Show notification
    notify.show();
    logMainProcess(`Notification shown: ${title}`);
    
  } catch (error) {
    logMainProcess(`Failed to show notification: ${formatError(error)}`);
  }
}

/**
 * Get the notification icon path based on notification type.
 * 
 * @param {string} type - The type of notification (info, warning, error, success)
 * @returns {string} The absolute path to the notification icon
 * 
 * @throws {Error} If the icon file cannot be resolved
 */
function getNotificationIcon(type) {
  try {
    const path = require('path');
    const iconPath = path.join(__dirname, '..', 'app-icon.png');
    
    // Validate icon file exists
    const fs = require('fs');
    if (!fs.existsSync(iconPath)) {
      logMainProcess('Notification: Icon file not found, using default');
      return undefined;
    }
    
    return iconPath;
    
  } catch (error) {
    logMainProcess(`Failed to get notification icon: ${formatError(error)}`);
    return undefined;
  }
}

/**
 * Send a notification to the renderer process via IPC.
 * 
 * @param {BrowserWindow} window - The Electron BrowserWindow to send the notification to
 * @param {Object} notification - The notification object to send
 * 
 * @throws {Error} If window or webContents is invalid
 */
function sendNotificationToRenderer(window, notification) {
  try {
    // Validate inputs
    if (!window) {
      logMainProcess('Notification: Window is required');
      return;
    }
    
    if (!window.webContents) {
      logMainProcess('Notification: Window webContents is required');
      return;
    }
    
    if (!notification || typeof notification !== 'object') {
      logMainProcess('Notification: Invalid notification object for renderer');
      return;
    }
    
    window.webContents.send('notification:show', notification);
    logMainProcess('Notification sent to renderer');
    
  } catch (error) {
    logMainProcess(`Failed to send notification to renderer: ${formatError(error)}`);
  }
}

module.exports = {
  requestPermissions,
  arePermissionsGranted,
  showNotification,
  getNotificationIcon,
  sendNotificationToRenderer
};
