/**
 * API Client
 * 
 * Handles HTTP communication with Python FastAPI backend.
 */

import axios, { AxiosError, AxiosResponse } from 'axios';

// Configuration (default port must match main process and backend entrypoint)
const DEFAULT_BACKEND_PORT = 35421;
const API_BASE_URL = `http://127.0.0.1:${DEFAULT_BACKEND_PORT}`;
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Call Python FastAPI backend
 * 
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param data - Request data
 * @returns API response
 */
export async function callBackend(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<BackendResponse> {
  try {
    const response: AxiosResponse = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      ok: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return handleBackendError(error);
  }
}

/**
 * Handle backend error
 * 
 * @param error - Error object
 * @returns Error response
 */
function handleBackendError(error: AxiosError | Error): BackendErrorResponse {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      // Backend returned an error response
      return {
        ok: false,
        error: {
          message: axiosError.response.data?.detail || 'Backend error',
          status: axiosError.response.status,
          details: axiosError.response.data
        }
      };
    } else if (axiosError.request) {
      // Backend not reachable
      return {
        ok: false,
        error: {
          message: 'Backend not reachable',
          details: {
            endpoint: axiosError.config?.url,
            method: axiosError.config?.method
          }
        }
      };
    }
  }

  // Other error
  return {
    ok: false,
    error: {
      message: error.message || 'Unknown error',
      details: { error }
    }
  };
}

/**
 * Retry failed request with exponential backoff
 * 
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param data - Request data
 * @param maxRetries - Maximum number of retries
 * @returns API response
 */
export async function callBackendWithRetry(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  maxRetries: number = 3
): Promise<BackendResponse> {
  let lastError: BackendErrorResponse | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await callBackend(endpoint, method, data);

      if (response.ok) {
        return response;
      }

      lastError = response as BackendErrorResponse;

      // Don't retry on client errors (4xx)
      if (lastError.error.status && lastError.error.status >= 400 && lastError.error.status < 500) {
        return lastError;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      lastError = handleBackendError(error);
    }
  }

  return lastError || {
    ok: false,
    error: {
      message: 'All retry attempts failed',
      details: { maxRetries }
    }
  };
}

/**
 * Get backend health status
 * 
 * @returns Backend health status
 */
export async function getBackendHealth(): Promise<BackendHealthResponse> {
  try {
    const response = await callBackend('/health');

    if (response.ok) {
      return {
        ok: true,
        status: response.data as BackendHealthStatus
      };
    }

    return {
      ok: false,
      error: response.error
    };
  } catch (error) {
    return {
      ok: false,
      error: handleBackendError(error).error
    };
  }
}

/**
 * Backend response interface
 */
interface BackendResponse {
  ok: boolean;
  data?: any;
  status?: number;
  error?: BackendError;
}

/**
 * Backend error response interface
 */
interface BackendErrorResponse {
  ok: boolean;
  error: BackendError;
}

/**
 * Backend error interface
 */
interface BackendError {
  message: string;
  status?: number;
  details?: any;
}

/**
 * Backend health status interface
 */
interface BackendHealthStatus {
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopped';
  port: number;
}

/**
 * Backend health response interface
 */
interface BackendHealthResponse {
  ok: boolean;
  status?: BackendHealthStatus;
  error?: BackendError;
}
