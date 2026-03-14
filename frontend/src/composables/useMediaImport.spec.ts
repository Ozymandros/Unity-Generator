import { describe, it, expect, beforeEach } from 'vitest';
import { useMediaImport } from '@/composables/useMediaImport';
import type { MediaImport } from '@/constants/unityPrompts';

describe('useMediaImport', () => {
  const validImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const validAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

  beforeEach(() => {
    // Clear any pending imports before each test
    const { clearPendingMediaImport } = useMediaImport();
    clearPendingMediaImport();
  });

  describe('setPendingMediaImport', () => {
    it('should set pending media import with valid image data', () => {
      const { setPendingMediaImport, pendingMediaImport, pendingPrompt } = useMediaImport();
      
      const mediaImport: MediaImport = {
        data: validImageData,
        name: 'TestTexture',
        type: 'image',
        textureType: 'Sprite'
      };
      const prompt = 'Import this texture to Unity';

      setPendingMediaImport(mediaImport, prompt);

      expect(pendingMediaImport.value).toEqual(mediaImport);
      expect(pendingPrompt.value).toBe(prompt);
    });

    it('should set pending media import with valid audio data', () => {
      const { setPendingMediaImport, pendingMediaImport, pendingPrompt } = useMediaImport();
      
      const mediaImport: MediaImport = {
        data: validAudioData,
        name: 'TestAudio',
        type: 'audio',
        audioFormat: 'WAV'
      };
      const prompt = 'Import this audio to Unity';

      setPendingMediaImport(mediaImport, prompt);

      expect(pendingMediaImport.value).toEqual(mediaImport);
      expect(pendingPrompt.value).toBe(prompt);
    });

    it('should throw error if mediaImport is null', () => {
      const { setPendingMediaImport } = useMediaImport();
      
      expect(() => {
        setPendingMediaImport(null as any, 'Some prompt');
      }).toThrow('mediaImport cannot be null');
    });

    it('should throw error if mediaImport is missing required fields', () => {
      const { setPendingMediaImport } = useMediaImport();
      
      const invalidImport = {
        data: validImageData,
        name: 'Test'
        // Missing 'type' field
      } as any;

      expect(() => {
        setPendingMediaImport(invalidImport, 'Some prompt');
      }).toThrow('mediaImport must contain data, name, and type');
    });

    it('should throw error if prompt is empty', () => {
      const { setPendingMediaImport } = useMediaImport();
      
      const mediaImport: MediaImport = {
        data: validImageData,
        name: 'Test',
        type: 'image'
      };

      expect(() => {
        setPendingMediaImport(mediaImport, '');
      }).toThrow('prompt cannot be empty');

      expect(() => {
        setPendingMediaImport(mediaImport, '   ');
      }).toThrow('prompt cannot be empty');
    });

    it('should throw error for invalid base64 format', () => {
      const { setPendingMediaImport } = useMediaImport();
      
      const invalidImport: MediaImport = {
        data: 'not-valid-base64',
        name: 'Test',
        type: 'image'
      };

      expect(() => {
        setPendingMediaImport(invalidImport, 'Import this');
      }).toThrow('Media validation failed');
    });

    it('should throw error for mismatched media type', () => {
      const { setPendingMediaImport } = useMediaImport();
      
      const invalidImport: MediaImport = {
        data: validImageData,
        name: 'Test',
        type: 'audio' // Image data but audio type
      };

      expect(() => {
        setPendingMediaImport(invalidImport, 'Import this');
      }).toThrow('Media validation failed');
    });

    it('should throw error for unsafe file names', () => {
      const { setPendingMediaImport } = useMediaImport();
      
      const unsafeNames = [
        '../../../etc/passwd',
        'folder/file.png',
        'C:\\Windows\\file.png'
      ];

      unsafeNames.forEach(unsafeName => {
        const invalidImport: MediaImport = {
          data: validImageData,
          name: unsafeName,
          type: 'image'
        };

        expect(() => {
          setPendingMediaImport(invalidImport, 'Import this');
        }).toThrow('Media validation failed');
      });
    });

    it('should throw error for oversized files', () => {
      const { setPendingMediaImport } = useMediaImport();
      
      // Create a large base64 string (> 5MB)
      const largeData = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024);
      const invalidImport: MediaImport = {
        data: largeData,
        name: 'LargeFile',
        type: 'image'
      };

      expect(() => {
        setPendingMediaImport(invalidImport, 'Import this');
      }).toThrow('Media validation failed');
    });
  });

  describe('clearPendingMediaImport', () => {
    it('should clear pending media import', () => {
      const { setPendingMediaImport, clearPendingMediaImport, pendingMediaImport, pendingPrompt } = useMediaImport();
      
      const mediaImport: MediaImport = {
        data: validImageData,
        name: 'Test',
        type: 'image'
      };

      setPendingMediaImport(mediaImport, 'Import this');
      expect(pendingMediaImport.value).not.toBeNull();
      expect(pendingPrompt.value).not.toBe('');

      clearPendingMediaImport();
      expect(pendingMediaImport.value).toBeNull();
      expect(pendingPrompt.value).toBe('');
    });
  });

  describe('hasPendingMediaImport', () => {
    it('should return false when no media import is pending', () => {
      const { hasPendingMediaImport } = useMediaImport();
      expect(hasPendingMediaImport()).toBe(false);
    });

    it('should return true when media import is pending', () => {
      const { setPendingMediaImport, hasPendingMediaImport } = useMediaImport();
      
      const mediaImport: MediaImport = {
        data: validImageData,
        name: 'Test',
        type: 'image'
      };

      setPendingMediaImport(mediaImport, 'Import this');
      expect(hasPendingMediaImport()).toBe(true);
    });

    it('should return false after clearing pending import', () => {
      const { setPendingMediaImport, clearPendingMediaImport, hasPendingMediaImport } = useMediaImport();
      
      const mediaImport: MediaImport = {
        data: validImageData,
        name: 'Test',
        type: 'image'
      };

      setPendingMediaImport(mediaImport, 'Import this');
      expect(hasPendingMediaImport()).toBe(true);

      clearPendingMediaImport();
      expect(hasPendingMediaImport()).toBe(false);
    });
  });
});
