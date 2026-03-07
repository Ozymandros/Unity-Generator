/**
 * Electron Shell Service
 *
 * Provides secure, IPC-based access to Electron shell operations.
 * Handles file system interactions through Electron's main process.
 */

/**
 * Result of a shell operation.
 */
interface ShellOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Open a file or folder in the system's default application.
 *
 * Uses Electron IPC to safely open paths without exposing the shell API directly.
 * Validates input before sending to main process.
 *
 * @param filePath - Path to file or folder to open. Must be a non-empty string.
 * @returns Promise resolving to operation result with success status and optional error.
 * @throws {Error} If filePath is not a valid string.
 *
 * @example
 * ```typescript
 * const result = await electronShell.openPath('/path/to/folder');
 * if (result.success) {
 *   console.log('Folder opened successfully');
 * } else {
 *   console.error('Failed to open:', result.error);
 * }
 * ```
 */
async function openPath(filePath: string): Promise<ShellOperationResult> {
  // Input validation
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('filePath must be a non-empty string');
  }

  // Check if electronAPI is available (running in Electron)
  if (!window.electronAPI?.shell?.openPath) {
    throw new Error('Electron shell API is not available');
  }

  try {
    const result = await window.electronAPI.shell.openPath(filePath);
    return result as ShellOperationResult;
  } catch (error) {
    throw new Error(
      `Failed to open path: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const electronShell = {
  openPath
};
