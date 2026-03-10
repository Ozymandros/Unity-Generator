/**
 * Electron Preload Script
 * 
 * Provides secure IPC communication between main and renderer processes.
 * All exposed APIs are explicitly defined and filtered.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to communicate
// with the main process without exposing the entire Electron API

contextBridge.exposeInMainWorld('electronAPI', {
  // Backend communication
  backend: {
    status: () => ipcRenderer.invoke('backend:status'),
    restart: () => ipcRenderer.invoke('backend:restart')
  },

  // Notification system
  notification: {
    show: (notification) => ipcRenderer.invoke('notification:show', notification),
    requestPermissions: () => ipcRenderer.invoke('notification:request-permissions')
  },

  // Logger
  logger: {
    error: (error) => ipcRenderer.invoke('logger:error', error)
  },

  // Internationalization
  i18n: {
    translate: (key, params) => ipcRenderer.invoke('i18n:translate', key, params),
    load: (language) => ipcRenderer.invoke('i18n:load', language),
    getAvailableLanguages: () => ipcRenderer.invoke('i18n:available-languages')
  },

  // Security
  security: {
    validate: (input) => ipcRenderer.invoke('security:validate', input),
    cspViolation: (violation) => ipcRenderer.invoke('security:csp-violation', violation)
  },

  // File dialogs
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog:open-file', options),
    saveFile: (options) => ipcRenderer.invoke('dialog:save-file', options),
    error: (options) => ipcRenderer.invoke('dialog:error', options),
    info: (options) => ipcRenderer.invoke('dialog:info', options),
    warning: (options) => ipcRenderer.invoke('dialog:warning', options),
    question: (options) => ipcRenderer.invoke('dialog:question', options)
  },

  // URL scheme
  urlScheme: {
    process: (url) => ipcRenderer.invoke('url:process', url)
  },

  // Shell operations
  shell: {
    openPath: (filePath) => ipcRenderer.invoke('shell:open-path', filePath)
  },

  // Migration functionality
  migration: {
    status: () => ipcRenderer.invoke('migration:status'),
    perform: () => ipcRenderer.invoke('migration:perform'),
    extractData: () => ipcRenderer.invoke('migration:extract-data')
  },

  // Listen for events from main process
  onBackendStatus: (callback) => {
    const subscription = ipcRenderer.on('backend:status', (_event, status) => {
      callback(status);
    });
    return () => subscription.remove();
  },

  onNotification: (callback) => {
    const subscription = ipcRenderer.on('notification:show', (_event, notification) => {
      callback(notification);
    });
    return () => subscription.remove();
  },

  onUrlScheme: (callback) => {
    const subscription = ipcRenderer.on('url:scheme', (_event, url) => {
      callback(url);
    });
    return () => subscription.remove();
  }
});

// Log preload initialization
console.log('Electron preload script initialized');
