export interface BackendError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
  traceback?: string;
}

export interface ProcessError {
  code?: number | null;
  signal?: string | null;
  message?: string;
}

export interface FormattedError {
  message: string;
  code: string;
  source: string;
  status?: number;
  details?: Record<string, unknown>;
  timestamp?: number;
  processName?: string;
  processId?: number | null;
}

export function formatBackendError(backendError: any, endpoint?: string | null, method?: string | null): FormattedError;
export function formatProcessError(processError: any, processName: string, processId?: number | null): FormattedError;
export function getUserFriendlyErrorMessage(error: FormattedError | null | undefined): string;
