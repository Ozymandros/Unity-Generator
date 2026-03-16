/**
 * TypeScript declarations for Electron API exposed via preload script.
 * These types ensure type safety when using window.electronAPI in the renderer process.
 * 
 * Last updated: 2026-03-10 - Added menu event listeners
 */

export interface ElectronAPI {
  backend: {
    status: () => Promise<{
      isRunning: boolean;
      health: string;
      port: number;
      managedByElectron: boolean;
    }>;
    restart: () => Promise<{
      isRunning: boolean;
      health: string;
      port: number;
      error?: string;
    }>;
  };

  notification: {
    show: (notification: {
      title: string;
      body?: string;
      type?: 'info' | 'success' | 'error';
      actions?: {
        onClick?: () => void;
      };
    }) => Promise<void>;
    requestPermissions: () => Promise<boolean>;
  };

  logger: {
    error: (error: Error | string) => Promise<boolean>;
  };

  i18n: {
    translate: (key: string, params?: Record<string, string>) => Promise<string>;
    load: (language: string) => Promise<boolean>;
    getAvailableLanguages: () => Promise<string[]>;
  };

  security: {
    validate: (input: string) => Promise<{ valid: boolean; sanitized?: string; error?: string }>;
    cspViolation: (violation: unknown) => Promise<{ blocked: boolean; reason: string }>;
  };

  dialog: {
    openFile: (options: {
      title?: string;
      defaultPath?: string;
      buttonLabel?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
      properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
    }) => Promise<{ canceled: boolean; filePaths: string[] }>;
    saveFile: (options: {
      title?: string;
      defaultPath?: string;
      buttonLabel?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }) => Promise<{ canceled: boolean; filePath?: string }>;
    error: (options: {
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
    }) => Promise<{ response: number }>;
    info: (options: {
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
    }) => Promise<{ response: number }>;
    warning: (options: {
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
    }) => Promise<{ response: number }>;
    question: (options: {
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
      defaultId?: number;
      cancelId?: number;
    }) => Promise<{ response: number }>;
  };

  urlScheme: {
    process: (url: string) => Promise<{
      success: boolean;
      parsed?: unknown;
      actions?: unknown;
      error?: string;
    }>;
  };

  shell: {
    openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  };

  unityProject: {
    scan: (projectRoot: string) => Promise<{
      success: boolean;
      data?: {
        root: string;
        unityVersion: string;
        packages: string[];
        unityTemplate: string;
        unityPlatform: string;
        files: {
          projectVersionTxt: boolean;
          manifestJson: boolean;
          generatorMeta: boolean;
        };
      };
      error?: string;
    }>;
    openPicker: () => Promise<{
      canceled: boolean;
      projectPath: string | null;
      error: string | null;
    }>;
  };

  migration: {
    status: () => Promise<{
      legacyPath: string;
      electronPath: string;
      legacyExists: boolean;
      electronExists: boolean;
    }>;
    perform: () => Promise<{
      success: boolean;
      migrated: number;
      skipped: number;
      errors?: Array<{ file?: string; directory?: string; type: string; message: string }>;
      legacyPath: string;
      electronPath: string;
    }>;
    extractData: () => Promise<{
      exists: boolean;
      files: Record<string, string>;
      directories: string[];
      legacyPath?: string;
      count?: number;
      message?: string;
    }>;
  };

  /** Native OS theme control (title bar, menus, scrollbars). */
  nativeTheme: {
    /**
     * Set the OS-level theme source. Maps to Electron's nativeTheme.themeSource.
     *
     * @param mode - 'light', 'dark', or 'system'
     * @returns Promise resolving to success status
     *
     * @example
     * ```ts
     * await window.electronAPI?.nativeTheme?.setTheme('dark');
     * ```
     */
    setTheme: (mode: 'light' | 'dark' | 'system') => Promise<{ success: boolean; mode?: string; error?: string }>;
  };

  // Event listeners
  onBackendStatus: (callback: (status: unknown) => void) => () => void;
  onNotification: (callback: (notification: unknown) => void) => () => void;
  onUrlScheme: (callback: (url: string) => void) => () => void;
  onMenuNewProject: (callback: () => void) => () => void;
  onMenuOpenProject: (callback: (projectPath: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
