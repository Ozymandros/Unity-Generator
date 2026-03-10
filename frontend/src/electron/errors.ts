/**
 * Error formatting for backend and process errors (used by renderer for display).
 */

export function formatBackendError(
  backendError: { status: number; message: string; details?: Record<string, unknown>; traceback?: string },
  endpoint: string | null = null,
  method: string | null = null
) {
  if (!backendError || typeof backendError !== 'object') throw new TypeError('backendError must be an object');
  if (backendError.status === undefined || backendError.status === null) throw new Error('backendError must have a status property');
  if (!backendError.message || typeof backendError.message !== 'string') throw new Error('backendError must have a valid message string');

  const { status, message, details = {}, traceback = null } = backendError;
  let formattedMessage = message;
  if (traceback) formattedMessage = `${message}\n\nTraceback:\n${traceback}`;

  return {
    message: formattedMessage,
    code: 'BACKEND_ERROR',
    source: 'backend',
    status,
    details: { ...details, endpoint, method, traceback },
    timestamp: Date.now()
  };
}

export function formatProcessError(
  processError: { code?: number | null; signal?: string | null; message?: string },
  processName: string,
  processId: number | null = null
) {
  if (!processError || typeof processError !== 'object') throw new TypeError('processError must be an object');
  if (!processName || typeof processName !== 'string') throw new TypeError('processName must be a non-empty string');

  const code = processError.code !== undefined ? processError.code : null;
  const signal = processError.signal || null;
  const message = processError.message || 'Process error occurred';
  const processInfo = processId ? ` (PID: ${processId})` : ` (${processName})`;
  let formattedMessage = message;
  if (code !== null) formattedMessage = `${message}${processInfo}, exit code: ${code}`;
  else if (signal) formattedMessage = `${message}${processInfo}, signal: ${signal}`;

  return {
    message: formattedMessage,
    code: 'PROCESS_ERROR',
    source: 'process',
    processName,
    processId,
    details: { exitCode: code, signal },
    timestamp: Date.now()
  };
}

export function getUserFriendlyErrorMessage(error: {
  source?: string;
  code?: string;
  message?: string;
  details?: { status?: number; exitCode?: number; processName?: string; message?: string; signal?: string };
} | null): string {
  if (!error || typeof error !== 'object') return 'An unknown error occurred';
  const { source, code, message } = error;
  const details = error.details || {};

  if (source === 'backend' && code === 'BACKEND_ERROR') {
    if (details.exitCode === 111 || details.message?.includes?.('Connection refused'))
      return 'Unable to connect to the Python backend. Please ensure the backend is running.';
    if ((details.status ?? 0) >= 500) return 'The Python backend encountered an internal error. Please try again later.';
    if ((details.status ?? 0) >= 400) return 'The request to the Python backend failed. Please check your input.';
    return `Backend error: ${message ?? ''}`;
  }
  if (source === 'process' && code === 'PROCESS_ERROR') {
    if (details.exitCode === 1) return `${details.processName ?? 'Process'} failed to start. Please check the logs for details.`;
    if (details.exitCode === 127) return `${details.processName ?? 'Process'} not found. Please ensure it is installed correctly.`;
    if (details.signal === 'SIGTERM') return `${details.processName ?? 'Process'} was terminated. Please try again.`;
    return `${details.processName ?? 'Process'} error: ${message ?? ''}`;
  }
  if (source === 'renderer') return `Application error: ${message ?? ''}`;
  return message ?? 'An error occurred';
}
