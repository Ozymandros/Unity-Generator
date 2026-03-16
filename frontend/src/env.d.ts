/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare global {
  interface ShellOperationResult {
    success: boolean;
    error?: string;
  }

  interface ElectronShellAPI {
    openPath: (filePath: string) => Promise<ShellOperationResult>;
  }

  interface ElectronBackendAPI {
    status: () => Promise<{ isRunning: boolean; health: string; port?: number }>;
    restart: () => Promise<{ isRunning: boolean; health: string; port?: number }>;
  }

  interface ElectronNotificationAPI {
    show: (notification: { title: string; body: string; type?: 'info' | 'error' | 'warning' }) => Promise<void>;
    requestPermissions: () => Promise<boolean>;
  }

  interface ElectronLoggerAPI {
    error: (error: unknown) => Promise<boolean>;
  }

  interface ElectronI18nAPI {
    translate: (key: string, params?: Record<string, unknown>) => Promise<string>;
    load: (language: string) => Promise<Record<string, string>>;
    getAvailableLanguages: () => Promise<string[]>;
  }

  interface ElectronSecurityAPI {
    validate: (input: unknown) => Promise<boolean>;
    cspViolation: (violation: unknown) => Promise<void>;
  }

  interface ElectronDialogAPI {
    openFile: (options: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>;
    saveFile: (options: unknown) => Promise<{ canceled: boolean; filePath?: string }>;
    error: (options: { title?: string; message: string; detail?: string; buttons?: string[] }) => Promise<number>;
    info: (options: { title?: string; message: string; detail?: string; buttons?: string[] }) => Promise<number>;
    warning: (options: { title?: string; message: string; detail?: string; buttons?: string[] }) => Promise<number>;
    question: (options: { title?: string; message: string; detail?: string; buttons?: string[]; defaultId?: number; cancelId?: number }) => Promise<number>;
  }

  interface ElectronURLSchemeAPI {
    process: (url: string) => Promise<unknown>;
  }

  interface ElectronMigrationAPI {
    status: () => Promise<{ legacyPath: string; electronPath: string; legacyExists: boolean; electronExists: boolean }>;
    perform: () => Promise<{ success: boolean; migrated: number; skipped: number; errors: unknown[] }>;
    extractData: () => Promise<{ exists: boolean; files: Record<string, string>; directories: string[]; count: number }>;
  }

  interface ElectronUnityProjectAPI {
    scan: (projectRoot: string) => Promise<{
      success: boolean;
      data?: {
        root: string;
        unityVersion: string;
        packages: string[];
        unityTemplate: string;
        unityPlatform: string;
        files: { projectVersionTxt: boolean; manifestJson: boolean; generatorMeta: boolean };
      };
      error?: string;
    }>;
    openPicker: () => Promise<{
      canceled: boolean;
      projectPath: string | null;
      error: string | null;
    }>;
  }

  interface ElectronAPI {
    backend: ElectronBackendAPI;
    notification: ElectronNotificationAPI;
    logger: ElectronLoggerAPI;
    i18n: ElectronI18nAPI;
    security: ElectronSecurityAPI;
    dialog: ElectronDialogAPI;
    urlScheme: ElectronURLSchemeAPI;
    shell: ElectronShellAPI;
    migration: ElectronMigrationAPI;
    unityProject: ElectronUnityProjectAPI;
    onBackendStatus: (callback: (status: unknown) => void) => () => void;
    onNotification: (callback: (notification: unknown) => void) => () => void;
    onUrlScheme: (callback: (url: string) => void) => () => void;
    onMenuNewProject: (callback: () => void) => () => void;
    onMenuOpenProject: (callback: (projectPath: string) => void) => () => void;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }


}
