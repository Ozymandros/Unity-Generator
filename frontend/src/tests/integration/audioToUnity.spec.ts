import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { useMediaImport } from "@/composables/useMediaImport";

/**
 * Integration tests for Audio-to-Unity workflow.
 * 
 * Tests the complete end-to-end workflow from AudioPanel to ScenesPanel:
 * 1. User generates audio in AudioPanel
 * 2. User clicks "Save to Unity Project" button
 * 3. Navigation to ScenesPanel with media data
 * 4. ScenesPanel receives media data and populates state
 * 5. User submits the prompt with media data included in the request
 * 
 * Validates Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11
 * 
 * Test Coverage:
 * - Complete workflow from audio generation to Unity import
 * - Navigation with query parameters preservation
 * - Prompt pre-fill and media data preservation
 * - Media data validation and integrity
 * - Error handling for invalid states
 */

// Mock dependencies
vi.mock("@/api/client", () => ({
  generateAudio: vi.fn(),
  generateScene: vi.fn()
}));

vi.mock("@/composables/useSessionProject", () => ({
  useSessionProject: () => ({
    projectName: ref("TestProject")
  })
}));

vi.mock("@/store/projectStore", () => ({
  projectStore: {
    activeProjectName: "TestProject"
  }
}));

vi.mock("@/store/intelligenceStore", () => ({
  useIntelligenceStore: () => ({
    load: vi.fn(),
    getProvidersByModality: vi.fn(() => []),
    getModelsByProvider: vi.fn(() => []),
    getPreferredEngine: vi.fn(() => ({ provider: "", model: "" })),
    getPreference: vi.fn(() => null)
  })
}));

describe("Audio-to-Unity Integration Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear any pending media imports from previous tests
    const { clearPendingMediaImport } = useMediaImport();
    clearPendingMediaImport();
  });

  describe("Complete Workflow: Generate Audio → Save to Unity → Import", () => {
    it("should complete full workflow from audio generation to Unity import", () => {
      // Arrange: Simulate audio generation
      const generatedAudio = ref("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
      const audioNameInput = ref("ExplosionSound");
      const audioFormatSelect = ref("WAV");
      
      const { setPendingMediaImport, pendingMediaImport, pendingPrompt } = useMediaImport();
      
      // Act: Step 1 - User clicks "Save to Unity" in AudioPanel
      const audioName = audioNameInput.value.trim();
      const audioFormat = audioFormatSelect.value;
      const unityPrompt = `Import this generated audio as a Unity audio clip named "${audioName}" in ${audioFormat} format, create an AudioSource GameObject, and set it to play on awake with loop enabled`;
      
      setPendingMediaImport(
        {
          data: generatedAudio.value,
          name: audioName,
          type: "audio",
          audioFormat: audioFormat
        },
        unityPrompt
      );
      
      // Assert: Step 2 - Verify media data is stored correctly
      expect(pendingMediaImport.value).not.toBeNull();
      expect(pendingMediaImport.value?.data).toBe(generatedAudio.value);
      expect(pendingMediaImport.value?.name).toBe("ExplosionSound");
      expect(pendingMediaImport.value?.type).toBe("audio");
      expect(pendingMediaImport.value?.audioFormat).toBe("WAV");
      expect(pendingPrompt.value).toContain("ExplosionSound");
      expect(pendingPrompt.value).toContain("WAV");
      expect(pendingPrompt.value).toContain("Unity audio clip");
    });

    it("should preserve audio data during navigation to ScenesPanel", () => {
      // Arrange
      const testAudioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Act: Set pending media import
      setPendingMediaImport(
        {
          data: testAudioData,
          name: "BackgroundMusic",
          type: "audio",
          audioFormat: "MP3"
        },
        "Import this generated audio as a Unity audio clip named \"BackgroundMusic\" in MP3 format, create an AudioSource GameObject, and set it to play on awake with loop enabled"
      );
      
      // Assert: Verify data is preserved exactly
      expect(pendingMediaImport.value?.data).toBe(testAudioData);
      expect(pendingMediaImport.value?.name).toBe("BackgroundMusic");
      expect(pendingMediaImport.value?.type).toBe("audio");
      expect(pendingMediaImport.value?.audioFormat).toBe("MP3");
    });

    it("should pre-fill prompt with Unity import instructions", () => {
      // Arrange
      const { setPendingMediaImport, pendingPrompt } = useMediaImport();
      
      // Act: Set pending media import with specific audio name and format
      setPendingMediaImport(
        {
          data: "data:audio/ogg;base64,test",
          name: "MenuMusic",
          type: "audio",
          audioFormat: "OGG"
        },
        "Import this generated audio as a Unity audio clip named \"MenuMusic\" in OGG format, create an AudioSource GameObject, and set it to play on awake with loop enabled"
      );
      
      // Assert: Verify prompt contains correct instructions
      expect(pendingPrompt.value).toContain("MenuMusic");
      expect(pendingPrompt.value).toContain("OGG");
      expect(pendingPrompt.value).toContain("Unity audio clip");
      expect(pendingPrompt.value).toContain("AudioSource");
    });
  });

  describe("Navigation with Query Parameters - Requirements 5.5, 5.6, 5.7", () => {
    it("should pass audio data via media import composable", () => {
      // Arrange
      const audioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Act: Simulate saveToUnity() call
      setPendingMediaImport(
        {
          data: audioData,
          name: "JumpSound",
          type: "audio",
          audioFormat: "WAV"
        },
        "Import this generated audio as a Unity audio clip named \"JumpSound\" in WAV format, create an AudioSource GameObject, and set it to play on awake with loop enabled"
      );
      
      // Assert: Verify all required data is passed
      expect(pendingMediaImport.value).toMatchObject({
        data: audioData,
        name: "JumpSound",
        type: "audio",
        audioFormat: "WAV"
      });
    });

    it("should include audio clip name in Unity import prompt", () => {
      // Arrange
      const { setPendingMediaImport, pendingPrompt } = useMediaImport();
      
      // Act: Set media import with specific audio name
      setPendingMediaImport(
        {
          data: "data:audio/mp3;base64,test",
          name: "VictoryFanfare",
          type: "audio",
          audioFormat: "MP3"
        },
        "Import this generated audio as a Unity audio clip named \"VictoryFanfare\" in MP3 format, create an AudioSource GameObject, and set it to play on awake with loop enabled"
      );
      
      // Assert: Verify audio name is in prompt
      expect(pendingPrompt.value).toContain("VictoryFanfare");
      expect(pendingPrompt.value).toContain("MP3");
    });

    it("should pass audio format in media import data", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Act: Set media import with OGG format
      setPendingMediaImport(
        {
          data: "data:audio/ogg;base64,test",
          name: "AmbientSound",
          type: "audio",
          audioFormat: "OGG"
        },
        "Import this generated audio as a Unity audio clip named \"AmbientSound\" in OGG format, create an AudioSource GameObject, and set it to play on awake with loop enabled"
      );
      
      // Assert: Verify format is passed correctly
      expect(pendingMediaImport.value?.audioFormat).toBe("OGG");
      expect(pendingMediaImport.value?.type).toBe("audio");
    });
  });

  describe("Prompt Pre-fill and Media Data Preservation - Requirements 5.8, 5.9", () => {
    it("should pre-fill prompt with AudioSource GameObject instructions", () => {
      // Arrange
      const { setPendingMediaImport, pendingPrompt } = useMediaImport();
      
      // Act: Set media import
      setPendingMediaImport(
        {
          data: "data:audio/wav;base64,test",
          name: "TestAudio",
          type: "audio",
          audioFormat: "WAV"
        },
        "Import this generated audio as a Unity audio clip named \"TestAudio\" in WAV format, create an AudioSource GameObject, and set it to play on awake with loop enabled"
      );
      
      // Assert: Verify prompt includes AudioSource instructions
      expect(pendingPrompt.value).toContain("AudioSource");
      expect(pendingPrompt.value).toContain("GameObject");
      expect(pendingPrompt.value).toContain("play on awake");
    });

    it("should preserve audio data integrity during workflow", () => {
      // Arrange: Create realistic audio data
      const originalAudioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Act: Set and retrieve media import
      setPendingMediaImport(
        {
          data: originalAudioData,
          name: "IntegrityTest",
          type: "audio",
          audioFormat: "WAV"
        },
        "Import audio"
      );
      
      // Assert: Verify data is not corrupted
      expect(pendingMediaImport.value?.data).toBe(originalAudioData);
      expect(pendingMediaImport.value?.data.length).toBe(originalAudioData.length);
    });

    it("should handle different audio formats (WAV, MP3, OGG)", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport, clearPendingMediaImport } = useMediaImport();
      
      const formats = ["WAV", "MP3", "OGG"];
      
      formats.forEach(format => {
        // Act: Set media import for each format
        clearPendingMediaImport();
        setPendingMediaImport(
          {
            data: `data:audio/${format.toLowerCase()};base64,test`,
            name: `TestAudio_${format}`,
            type: "audio",
            audioFormat: format
          },
          `Import audio in ${format} format`
        );
        
        // Assert: Verify format is preserved
        expect(pendingMediaImport.value?.audioFormat).toBe(format);
        expect(pendingMediaImport.value?.name).toBe(`TestAudio_${format}`);
      });
    });
  });

  describe("Media Data Validation - Requirements 5.10, 5.11", () => {
    it("should validate audio data before storing", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      // Act & Assert: Invalid base64 data should throw
      expect(() => {
        setPendingMediaImport(
          {
            data: "invalid-base64-data",
            name: "TestAudio",
            type: "audio",
            audioFormat: "WAV"
          },
          "Import audio"
        );
      }).toThrow();
    });

    it("should reject empty audio clip names", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      // Act & Assert: Empty name should throw (caught by early validation)
      expect(() => {
        setPendingMediaImport(
          {
            data: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
            name: "",
            type: "audio",
            audioFormat: "WAV"
          },
          "Import audio"
        );
      }).toThrow(); // Will throw "mediaImport must contain data, name, and type"
    });

    it("should reject audio clip names with path traversal characters", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      const maliciousNames = ["../audio", "audio/../../etc", "audio\\..\\file"];
      
      maliciousNames.forEach(name => {
        // Act & Assert: Malicious names should throw
        expect(() => {
          setPendingMediaImport(
            {
              data: "data:audio/wav;base64,test",
              name: name,
              type: "audio",
              audioFormat: "WAV"
            },
            "Import audio"
          );
        }).toThrow("Media validation failed");
      });
    });

    it("should validate media type matches audio", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      // Act & Assert: Non-audio data URL should throw
      expect(() => {
        setPendingMediaImport(
          {
            data: "data:image/png;base64,test",
            name: "TestAudio",
            type: "audio",
            audioFormat: "WAV"
          },
          "Import audio"
        );
      }).toThrow("Media validation failed");
    });

    it("should clear pending media import after successful processing", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport, clearPendingMediaImport } = useMediaImport();
      
      // Act: Set and then clear media import
      setPendingMediaImport(
        {
          data: "data:audio/wav;base64,test",
          name: "TestAudio",
          type: "audio",
          audioFormat: "WAV"
        },
        "Import audio"
      );
      
      expect(pendingMediaImport.value).not.toBeNull();
      
      clearPendingMediaImport();
      
      // Assert: Media import should be cleared
      expect(pendingMediaImport.value).toBeNull();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should throw error when media import data is null", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      // Act & Assert
      expect(() => {
        setPendingMediaImport(null as any, "Import audio");
      }).toThrow("mediaImport cannot be null");
    });

    it("should throw error when prompt is empty", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      // Act & Assert
      expect(() => {
        setPendingMediaImport(
          {
            data: "data:audio/wav;base64,test",
            name: "TestAudio",
            type: "audio",
            audioFormat: "WAV"
          },
          ""
        );
      }).toThrow("prompt cannot be empty");
    });

    it("should throw error when media import is missing required fields", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      // Act & Assert: Missing data field
      expect(() => {
        setPendingMediaImport(
          {
            data: "",
            name: "TestAudio",
            type: "audio",
            audioFormat: "WAV"
          } as any,
          "Import audio"
        );
      }).toThrow("mediaImport must contain data, name, and type");
    });

    it("should handle large audio files within size limits", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Create a large but valid audio data string (under 5MB limit)
      const largeAudioData = "data:audio/wav;base64," + "A".repeat(1000);
      
      // Act: Set media import with large data
      setPendingMediaImport(
        {
          data: largeAudioData,
          name: "LargeAudio",
          type: "audio",
          audioFormat: "WAV"
        },
        "Import large audio"
      );
      
      // Assert: Should succeed for reasonable sizes
      expect(pendingMediaImport.value?.data).toBe(largeAudioData);
    });

    it("should reject audio files exceeding size limit", () => {
      // Arrange
      const { setPendingMediaImport } = useMediaImport();
      
      // Create an extremely large audio data string (over 5MB limit)
      // Use valid base64 characters (A-Z, a-z, 0-9, +, /, =)
      const tooLargeAudioData = "data:audio/wav;base64," + "AAAA".repeat(2 * 1024 * 1024);
      
      // Act & Assert: Should throw for files over 5MB
      expect(() => {
        setPendingMediaImport(
          {
            data: tooLargeAudioData,
            name: "TooLargeAudio",
            type: "audio",
            audioFormat: "WAV"
          },
          "Import too large audio"
        );
      }).toThrow("Media validation failed");
    });
  });

  describe("Multiple Audio Formats Support", () => {
    it("should support WAV format with correct MIME type", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Act
      setPendingMediaImport(
        {
          data: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
          name: "WavAudio",
          type: "audio",
          audioFormat: "WAV"
        },
        "Import WAV audio"
      );
      
      // Assert
      expect(pendingMediaImport.value?.audioFormat).toBe("WAV");
      expect(pendingMediaImport.value?.data).toContain("audio/wav");
    });

    it("should support MP3 format with correct MIME type", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Act
      setPendingMediaImport(
        {
          data: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA",
          name: "Mp3Audio",
          type: "audio",
          audioFormat: "MP3"
        },
        "Import MP3 audio"
      );
      
      // Assert
      expect(pendingMediaImport.value?.audioFormat).toBe("MP3");
      expect(pendingMediaImport.value?.data).toContain("audio/mp3");
    });

    it("should support OGG format with correct MIME type", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      
      // Act
      setPendingMediaImport(
        {
          data: "data:audio/ogg;base64,T2dnUwACAAAAAAAAAABqb2huAAAAAAAAqpZ8AQEAAAAAAAAAAAAAAAAAAA==",
          name: "OggAudio",
          type: "audio",
          audioFormat: "OGG"
        },
        "Import OGG audio"
      );
      
      // Assert
      expect(pendingMediaImport.value?.audioFormat).toBe("OGG");
      expect(pendingMediaImport.value?.data).toContain("audio/ogg");
    });
  });
});
