/**
 * Backend API constants. Default port must match main process (main.js) and backend entrypoint.
 */

/** Default backend port (high port to avoid conflicts with common dev tools). */
export const DEFAULT_BACKEND_PORT = 35421;

const BACKEND_HOST = "127.0.0.1";

/**
 * Default backend base URL when none is stored (e.g. in localStorage).
 */
export function getDefaultBackendUrl(): string {
  return `http://${BACKEND_HOST}:${DEFAULT_BACKEND_PORT}`;
}

/** Default project name when session project name is empty. Must match backend schema defaults. */
export const DEFAULT_PROJECT_NAME = "UnityProject";
