/**
 * Error Handling Utilities
 * 
 * Handles error formatting and propagation for backend and process errors.
 */

/**
 * Format backend error
 * 
 * @param error - Backend error object
 * @returns Formatted error object
 */
export function formatBackendError(error: BackendError): FormattedError {
  if (!error) {
    return {
      message: 'Unknown backend error',
      code: 'UNKNOWN_ERROR',
      source: 'backend',
      timestamp: Date.now()
    };
  }

  // Extract error details
  const message = error.message || error.detail || 'Backend error occurred';
  const status = error.status || error.statusCode || 0;
  const code = error.code || `BACKEND_${status}`;

  return {
    message,
    code,
    details: {
      status,
      detail: error.detail,
      traceback: error.traceback,
      request: error.request
    },
    source: 'backend',
    timestamp: Date.now()
  };
}

/**
 * Format process error
 * 
 * @param error - Process error object
 * @returns Formatted error object
 */
export function formatProcessError(error: ProcessError): FormattedError {
  if (!error) {
    return {
      message: 'Unknown process error',
      code: 'UNKNOWN_ERROR',
      source: 'process',
      timestamp: Date.now()
    };
  }

  const message = error.message || 'Process error occurred';
  const code = error.code || `PROCESS_${error.exitCode || 'UNKNOWN'}`;
  const exitCode = error.exitCode || null;

  return {
    message,
    code,
    details: {
      exitCode,
      signal: error.signal,
      stderr: error.stderr,
      stdout: error.stdout
    },
    source: 'process',
    timestamp: Date.now()
  };
}

/**
 * Format IPC error
 * 
 * @param error - IPC error object
 * @returns Formatted error object
 */
export function formatIpcError(error: IpcError): FormattedError {
  if (!error) {
    return {
      message: 'Unknown IPC error',
      code: 'UNKNOWN_ERROR',
      source: 'ipc',
      timestamp: Date.now()
    };
  }

  const message = error.message || 'IPC communication error';
  const code = error.code || 'IPC_ERROR';

  return {
    message,
    code,
    details: {
      channel: error.channel,
      data: error.data,
      response: error.response
    },
    source: 'ipc',
    timestamp: Date.now()
  };
}

/**
 * Format network error
 * 
 * @param error - Network error object
 * @returns Formatted error object
 */
export function formatNetworkError(error: NetworkError): FormattedError {
  if (!error) {
    return {
      message: 'Unknown network error',
      code: 'UNKNOWN_ERROR',
      source: 'network',
      timestamp: Date.now()
    };
  }

  const message = error.message || 'Network error occurred';
  const code = error.code || 'NETWORK_ERROR';

  return {
    message,
    code,
    details: {
      url: error.url,
      method: error.method,
      status: error.status,
      response: error.response
    },
    source: 'network',
    timestamp: Date.now()
  };
}

/**
 * Format generic error
 * 
 * @param error - Error object
 * @returns Formatted error object
 */
export function formatError(error: Error | string): FormattedError {
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'GENERIC_ERROR',
      source: 'unknown',
      timestamp: Date.now()
    };
  }

  const message = error.message || 'Unknown error';
  const code = error.name || 'GENERIC_ERROR';

  return {
    message,
    code,
    details: {
      stack: error.stack
    },
    source: 'unknown',
    timestamp: Date.now()
  };
}

/**
 * Backend error interface
 */
interface BackendError {
  message?: string;
  detail?: string;
  status?: number;
  statusCode?: number;
  code?: string;
  traceback?: string;
  request?: any;
}

/**
 * Process error interface
 */
interface ProcessError {
  message?: string;
  code?: string;
  exitCode?: number;
  signal?: string;
  stderr?: string;
  stdout?: string;
}

/**
 * IPC error interface
 */
interface IpcError {
  message?: string;
  code?: string;
  channel?: string;
  data?: any;
  response?: any;
}

/**
 * Network error interface
 */
interface NetworkError {
  message?: string;
  code?: string;
  url?: string;
  method?: string;
  status?: number;
  response?: any;
}

/**
 * Formatted error interface
 */
export interface FormattedError {
  message: string;
  code: string;
  details?: any;
  source: 'backend' | 'process' | 'ipc' | 'network' | 'unknown';
  timestamp: number;
  stack?: string;
}
