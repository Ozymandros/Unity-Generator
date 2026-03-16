/**
 * Electron Application Menu Module
 * 
 * Handles creation and configuration of application menus including:
 * - Main application menu (File, Edit, Tools, Help)
 * - Context menu (right-click)
 */

const { Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Check if a file exists safely (avoids DEP0187 warning).
 * 
 * @param {string} p - Path to check
 * @returns {boolean} True if file exists, false otherwise
 */
function safeExistsSync(p) {
  return typeof p === 'string' && p.length > 0 && fs.existsSync(p);
}

/**
 * Creates and sets the application menu with English labels.
 * Call this once at startup.
 *
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 * @param {Electron.App} app - The Electron app instance
 * @param {string} __dirname - The directory name of the current module
 * @param {Function} logMainProcess - Logging function
 *
 * @example
 * ```javascript
 * createApplicationMenu(mainWindow, app, __dirname, logMainProcess);
 * ```
 */
function createApplicationMenu(mainWindow, app, __dirname, logMainProcess) {
  if (!mainWindow) throw new Error('mainWindow is required');
  if (!app) throw new Error('app is required');

  const isMac = process.platform === 'darwin';

  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => { if (mainWindow) mainWindow.webContents.send('menu:new-project'); }
        },
        {
          label: 'Open Project...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (!mainWindow) return;
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Select Unity Project Folder',
              buttonLabel: 'Open Project'
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const projectPath = result.filePaths[0];
              const assetsPath = path.join(projectPath, 'Assets');
              const projectSettingsPath = path.join(projectPath, 'ProjectSettings');
              if (safeExistsSync(assetsPath) && safeExistsSync(projectSettingsPath)) {
                mainWindow.webContents.send('menu:open-project', projectPath);
                if (logMainProcess) logMainProcess(`Unity project opened: ${projectPath}`);
              } else {
                dialog.showErrorBox('Invalid Unity Project',
                  'The selected folder is not a valid Unity project.\n\nA Unity project must contain "Assets" and "ProjectSettings" folders.');
              }
            }
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          { label: 'Speech', submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }] }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },

    // Tools menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Developer Tools',
          accelerator: 'F12',
          click: () => { if (mainWindow) mainWindow.webContents.toggleDevTools(); }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' }
      ]
    },

    // Window menu (non-mac)
    ...(!isMac ? [{
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    }] : []),

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'User Guide',
          click: async () => {
            const userGuidePath = path.join(__dirname, '..', 'docs', 'UserGuide.md');
            if (safeExistsSync(userGuidePath)) {
              await shell.openPath(userGuidePath);
            } else {
              dialog.showMessageBox({
                type: 'info',
                title: 'User Guide',
                message: 'User Guide not found',
                detail: 'The user guide documentation is not available at this time.'
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About Unity Generator',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About Unity Generator',
              message: 'Unity Generator',
              detail: `Version: ${app.getVersion()}\n\nAI-powered Unity project generator with multi-modal content creation.`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (logMainProcess) logMainProcess('Application menu created');
}

/**
 * Enables context menu (right-click) with system default options.
 * Provides Cut, Copy, Paste, and Select All in text fields.
 * 
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 * @param {Function} logMainProcess - Logging function
 * 
 * @example
 * ```javascript
 * enableContextMenu(mainWindow, logMainProcess);
 * ```
 */
function enableContextMenu(mainWindow, logMainProcess) {
  if (!mainWindow) {
    throw new Error('mainWindow is required');
  }
  
  mainWindow.webContents.on('context-menu', (event, params) => {
    const { selectionText, isEditable } = params;
    
    if (isEditable) {
      const template = [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        { role: 'selectAll' }
      ];
      
      const menu = Menu.buildFromTemplate(template);
      menu.popup({ window: mainWindow });
    } else if (selectionText) {
      const template = [
        { role: 'copy' },
        { type: 'separator' },
        { role: 'selectAll' }
      ];
      
      const menu = Menu.buildFromTemplate(template);
      menu.popup({ window: mainWindow });
    }
  });
  
  if (logMainProcess) {
    logMainProcess('Context menu enabled');
  }
}

module.exports = {
  createApplicationMenu,
  enableContextMenu
};
