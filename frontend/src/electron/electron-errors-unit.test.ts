/**
 * Unit Tests: Error Formatting
 * 
 * Tests backend error conversion and process error formatting.
 * 
 * Validates: Requirements 9.3, 3.5
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { formatBackendError, formatProcessError, getUserFriendlyErrorMessage } from './errors';

describe('Error Formatting Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatBackendError', () => {
    it('should format backend error with all details', () => {
      const backendError = {
        status: 500,
        message: 'Internal server error',
        details: { code: 'INTERNAL_ERROR' },
        traceback: 'Traceback (most recent call last):...'
      };

      const result = formatBackendError(backendError, '/api/tasks', 'POST');

      expect(result).toEqual({
        message: expect.stringContaining('Internal server error'),
        code: 'BACKEND_ERROR',
        source: 'backend',
        status: 500,
        details: expect.objectContaining({
          endpoint: '/api/tasks',
          method: 'POST',
          traceback: 'Traceback (most recent call last):...'
        }),
        timestamp: expect.any(Number)
      });

      expect(result.message).toContain('Traceback');
    });

    it('should format backend error without optional fields', () => {
      const backendError = {
        status: 404,
        message: 'Not found'
      };

      const result = formatBackendError(backendError);

      expect(result).toEqual({
        message: 'Not found',
        code: 'BACKEND_ERROR',
        source: 'backend',
        status: 404,
        details: expect.objectContaining({
          endpoint: null,
          method: null,
          traceback: null
        }),
        timestamp: expect.any(Number)
      });
    });

    it('should throw TypeError for invalid backendError', () => {
      type BackendErrorArg = Parameters<typeof formatBackendError>[0];
      expect(() => formatBackendError(null as unknown as BackendErrorArg)).toThrow('backendError must be an object');
      expect(() => formatBackendError('invalid' as unknown as BackendErrorArg)).toThrow('backendError must be an object');
    });

    it('should throw Error for missing status', () => {
      type BackendErrorArg = Parameters<typeof formatBackendError>[0];
      expect(() => formatBackendError({ message: 'Error' } as unknown as BackendErrorArg)).toThrow('backendError must have a status property');
    });

    it('should throw Error for invalid message', () => {
      type BackendErrorArg = Parameters<typeof formatBackendError>[0];
      expect(() => formatBackendError({ status: 500, message: 123 } as unknown as BackendErrorArg)).toThrow('backendError must have a valid message string');
    });
  });

  describe('formatProcessError', () => {
    it('should format process error with exit code', () => {
      const processError = {
        code: 1,
        signal: null,
        message: 'Process exited'
      };

      const result = formatProcessError(processError, 'Python Backend', 12345);

      expect(result).toEqual({
        message: expect.stringContaining('Process exited'),
        code: 'PROCESS_ERROR',
        source: 'process',
        processName: 'Python Backend',
        processId: 12345,
        details: {
          exitCode: 1,
          signal: null
        },
        timestamp: expect.any(Number)
      });

      expect(result.message).toContain('exit code: 1');
    });

    it('should format process error with signal', () => {
      const processError = {
        code: null,
        signal: 'SIGTERM',
        message: 'Process terminated'
      };

      const result = formatProcessError(processError, 'Backend Process');

      expect(result.message).toContain('signal: SIGTERM');
    });

    it('should format process error without process ID', () => {
      const processError = {
        code: 1,
        message: 'Process failed'
      };

      const result = formatProcessError(processError, 'My Process');

      expect(result.processId).toBeNull();
      expect(result.message).toContain('(My Process)');
    });

    it('should throw TypeError for invalid processError', () => {
      type ProcessErrorArg = Parameters<typeof formatProcessError>[0];
      expect(() => formatProcessError(null as unknown as ProcessErrorArg, 'Process')).toThrow('processError must be an object');
    });

    it('should throw TypeError for invalid processName', () => {
      expect(() => formatProcessError({}, '')).toThrow('processName must be a non-empty string');
      expect(() => formatProcessError({}, 123 as unknown as string)).toThrow('processName must be a non-empty string');
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should return user-friendly message for backend connection refused', () => {
      const error = {
        source: 'backend',
        code: 'BACKEND_ERROR',
        message: 'Connection refused',
        details: {
          message: 'Connection refused'
        }
      };

      const result = getUserFriendlyErrorMessage(error);

      expect(result).toBe('Unable to connect to the Python backend. Please ensure the backend is running.');
    });

    it('should return user-friendly message for backend 5xx error', () => {
      const error = {
        source: 'backend',
        code: 'BACKEND_ERROR',
        message: 'Internal server error',
        details: {
          status: 500
        }
      };

      const result = getUserFriendlyErrorMessage(error);

      expect(result).toBe('The Python backend encountered an internal error. Please try again later.');
    });

    it('should return user-friendly message for backend 4xx error', () => {
      const error = {
        source: 'backend',
        code: 'BACKEND_ERROR',
        message: 'Bad request',
        details: {
          status: 400
        }
      };

      const result = getUserFriendlyErrorMessage(error);

      expect(result).toBe('The request to the Python backend failed. Please check your input.');
    });

    it('should return user-friendly message for process error with exit code 1', () => {
      const error = {
        source: 'process',
        code: 'PROCESS_ERROR',
        message: 'Process failed',
        details: {
          processName: 'Python Backend',
          exitCode: 1
        }
      };

      const result = getUserFriendlyErrorMessage(error);

      expect(result).toBe('Python Backend failed to start. Please check the logs for details.');
    });

    it('should return user-friendly message for process error with exit code 127', () => {
      const error = {
        source: 'process',
        code: 'PROCESS_ERROR',
        message: 'Process not found',
        details: {
          processName: 'Python',
          exitCode: 127
        }
      };

      const result = getUserFriendlyErrorMessage(error);

      expect(result).toBe('Python not found. Please ensure it is installed correctly.');
    });

    it('should return user-friendly message for process terminated with SIGTERM', () => {
      const error = {
        source: 'process',
        code: 'PROCESS_ERROR',
        message: 'Process terminated',
        details: {
          processName: 'Backend',
          signal: 'SIGTERM'
        }
      };

      const result = getUserFriendlyErrorMessage(error);

      expect(result).toBe('Backend was terminated. Please try again.');
    });

    it('should return user-friendly message for unknown error', () => {
      const error = {
        source: 'unknown',
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong'
      };

      const result = getUserFriendlyErrorMessage(error);

      expect(result).toBe('Something went wrong');
    });

    it('should return default message for invalid error', () => {
      const result = getUserFriendlyErrorMessage(null);

      expect(result).toBe('An unknown error occurred');
    });
  });
});
