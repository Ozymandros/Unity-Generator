import { describe, it, expect } from 'vitest';
import {
  isValidBase64,
  isValidMediaType,
  isSafeFileName,
  getBase64Size,
  isValidFileSize,
  validateMediaImport
} from '@/utils/mediaValidation';

describe('mediaValidation', () => {
  describe('isValidBase64', () => {
    it('should return true for valid base64 data URI', () => {
      const validData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(isValidBase64(validData)).toBe(true);
    });

    it('should return false for data URI without base64 encoding', () => {
      const invalidData = 'data:image/png,notbase64data';
      expect(isValidBase64(invalidData)).toBe(false);
    });

    it('should return false for non-data-URI string', () => {
      expect(isValidBase64('not-a-data-uri')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidBase64('')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidBase64(null as any)).toBe(false);
      expect(isValidBase64(undefined as any)).toBe(false);
    });
  });

  describe('isValidMediaType', () => {
    it('should return true for image data with image type', () => {
      const imageData = 'data:image/png;base64,abc123';
      expect(isValidMediaType(imageData, 'image')).toBe(true);
    });

    it('should return true for audio data with audio type', () => {
      const audioData = 'data:audio/wav;base64,abc123';
      expect(isValidMediaType(audioData, 'audio')).toBe(true);
    });

    it('should return false for mismatched media type', () => {
      const imageData = 'data:image/png;base64,abc123';
      expect(isValidMediaType(imageData, 'audio')).toBe(false);
    });

    it('should return false for text data with image type', () => {
      const textData = 'data:text/plain;base64,abc123';
      expect(isValidMediaType(textData, 'image')).toBe(false);
    });

    it('should return false for invalid data URI', () => {
      expect(isValidMediaType('not-a-data-uri', 'image')).toBe(false);
    });
  });

  describe('isSafeFileName', () => {
    it('should return true for safe file names', () => {
      expect(isSafeFileName('texture.png')).toBe(true);
      expect(isSafeFileName('MyTexture_01')).toBe(true);
      expect(isSafeFileName('audio-clip-123.wav')).toBe(true);
    });

    it('should return false for file names with path traversal', () => {
      expect(isSafeFileName('../../../etc/passwd')).toBe(false);
      expect(isSafeFileName('..\\..\\Windows\\System32')).toBe(false);
      expect(isSafeFileName('file..name')).toBe(false);
    });

    it('should return false for file names with path separators', () => {
      expect(isSafeFileName('folder/file.png')).toBe(false);
      expect(isSafeFileName('C:\\Windows\\file.png')).toBe(false);
      expect(isSafeFileName('/etc/passwd')).toBe(false);
    });

    it('should return false for empty or whitespace-only names', () => {
      expect(isSafeFileName('')).toBe(false);
      expect(isSafeFileName('   ')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isSafeFileName(null as any)).toBe(false);
      expect(isSafeFileName(undefined as any)).toBe(false);
    });
  });

  describe('getBase64Size', () => {
    it('should calculate size for valid base64 data', () => {
      // 1x1 pixel PNG (smallest valid PNG)
      const smallPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const size = getBase64Size(smallPng);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(200); // Small PNG should be < 200 bytes
    });

    it('should return 0 for invalid data', () => {
      expect(getBase64Size('not-a-data-uri')).toBe(0);
      expect(getBase64Size('')).toBe(0);
      expect(getBase64Size(null as any)).toBe(0);
    });
  });

  describe('isValidFileSize', () => {
    it('should return true for files within size limit', () => {
      // Small 1x1 PNG
      const smallPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(isValidFileSize(smallPng)).toBe(true);
    });

    it('should return false for files exceeding size limit', () => {
      // Create a large base64 string (> 5MB)
      const largeData = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024); // ~7MB
      expect(isValidFileSize(largeData)).toBe(false);
    });

    it('should respect custom size limit', () => {
      const smallPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(isValidFileSize(smallPng, 1024)).toBe(true); // 1KB limit (should pass)
      expect(isValidFileSize(smallPng, 10)).toBe(false); // 10 bytes limit (too small)
    });
  });

  describe('validateMediaImport', () => {
    const validImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const validAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

    it('should validate correct image import', () => {
      const result = validateMediaImport(validImageData, 'texture.png', 'image');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate correct audio import', () => {
      const result = validateMediaImport(validAudioData, 'sound.wav', 'audio');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid base64 format', () => {
      const result = validateMediaImport('not-base64', 'file.png', 'image');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid media data format');
    });

    it('should reject mismatched media type', () => {
      const result = validateMediaImport(validImageData, 'file.png', 'audio');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid media type');
    });

    it('should reject unsafe file names', () => {
      const result = validateMediaImport(validImageData, '../../../etc/passwd', 'image');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file name');
    });

    it('should reject oversized files', () => {
      const largeData = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024);
      const result = validateMediaImport(largeData, 'large.png', 'image');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });
  });
});
