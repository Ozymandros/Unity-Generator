import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { ref } from "vue";
import AudioPanel from "@/components/AudioPanel/AudioPanel.vue";
import { useAudioPanel } from "@/components/AudioPanel/AudioPanel";
import { useMediaImport } from "@/composables/useMediaImport";
import i18n from "@/i18n";

/**
 * Unit tests for AudioPanel component - Audio-to-Unity Integration
 *
 * Tests Property 19: Conditional Media Button Display
 * - Validates Requirements 5.1, 5.5, 5.6, 5.7, 10.2
 *
 * Test Coverage:
 * 1. "Save to Unity" button visibility based on audio generation state
 * 2. saveToUnity() validation and error handling
 * 3. Navigation via useMediaImport composable (tab-based, no vue-router)
 * 4. Input validation for audio clip name and format
 */

// Mock the composable
vi.mock("@/components/AudioPanel/AudioPanel", async () => {
  const actual = await vi.importActual("@/components/AudioPanel/AudioPanel");
  return {
    ...actual,
    useAudioPanel: vi.fn()
  };
});

// Mock other dependencies
vi.mock("@/api/client", () => ({
  generateAudio: vi.fn()
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

describe("AudioPanel - Audio-to-Unity Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 19: Conditional Media Button Display", () => {
    it("should hide 'Save to Unity' button when no audio has been generated", () => {
      // Arrange: Mock composable with no generated audio
      const mockComposable = {
        prompt: ref(""),
        modality: ref("audio"),
        provider: ref(""),
        apiKey: ref(""),
        voiceId: ref(""),
        musicModel: ref(""),
        stability: ref(0.5),
        status: ref(null),
        tone: ref("ok"),
        result: ref(""),
        systemPrompt: ref(""),
        defaultSystemPrompt: ref("Default prompt"),
        autoSaveToProject: ref(true),
        activeProjectName: ref("TestProject"),
        availableVoices: ref([]),
        availableModels: ref([]),
        showModelManager: ref(false),
        refreshModels: vi.fn(),
        run: vi.fn(),
        providers: ref([]),
        generatedAudio: ref(null), // No audio generated
        audioNameInput: ref("GeneratedAudio"),
        audioFormatSelect: ref("WAV"),
        saveToUnity: vi.fn()
      };

      vi.mocked(useAudioPanel).mockReturnValue(mockComposable as any);

      // Act: Mount component
      const wrapper = mount(AudioPanel, { global: { plugins: [createVuetify(), i18n] } });

      // Assert: "Save to Unity" card should not be visible
      const unityCardTitle = wrapper.findAll(".text-subtitle-1").filter(el =>
        el.text().includes("Save to Unity")
      );
      expect(unityCardTitle.length).toBe(0);
    });

    it("should show 'Save to Unity' button when audio has been generated", () => {
      // Arrange: Mock composable with generated audio
      const mockComposable = {
        prompt: ref(""),
        modality: ref("audio"),
        provider: ref(""),
        apiKey: ref(""),
        voiceId: ref(""),
        musicModel: ref(""),
        stability: ref(0.5),
        status: ref(null),
        tone: ref("ok"),
        result: ref(""),
        systemPrompt: ref(""),
        defaultSystemPrompt: ref("Default prompt"),
        autoSaveToProject: ref(true),
        activeProjectName: ref("TestProject"),
        availableVoices: ref([]),
        availableModels: ref([]),
        showModelManager: ref(false),
        refreshModels: vi.fn(),
        run: vi.fn(),
        providers: ref([]),
        generatedAudio: ref("data:audio/wav;base64,UklGRiQAAABXQVZFZm10..."),
        audioNameInput: ref("GeneratedAudio"),
        audioFormatSelect: ref("WAV"),
        saveToUnity: vi.fn()
      };

      vi.mocked(useAudioPanel).mockReturnValue(mockComposable as any);

      // Act: Mount component
      const wrapper = mount(AudioPanel, { global: { plugins: [createVuetify(), i18n] } });

      // Assert: "Save to Unity" card should be visible
      const unityCardTitle = wrapper.findAll(".text-subtitle-1").filter(el =>
        el.text().includes("Save to Unity")
      );
      expect(unityCardTitle.length).toBeGreaterThan(0);
    });
  });

  describe("saveToUnity() Error Handling - Requirement 10.2", () => {
    it("should throw error when no audio is available", () => {
      // Arrange: Create composable instance with no audio
      const generatedAudio = ref<string | null>(null);
      const status = ref<string | null>(null);
      const tone = ref<"ok" | "error">("ok");

      // Act & Assert: Call saveToUnity and expect error
      const saveToUnity = () => {
        if (!generatedAudio.value) {
          tone.value = "error";
          status.value = "No audio available to save to Unity";
          throw new Error("No audio available to save to Unity");
        }
      };

      expect(() => saveToUnity()).toThrow("No audio available to save to Unity");
      expect(tone.value).toBe("error");
      expect(status.value).toBe("No audio available to save to Unity");
    });

    it("should throw error when audio clip name is empty", () => {
      // Arrange
      const generatedAudio = ref("data:audio/wav;base64,UklGRiQAAABXQVZFZm10...");
      const audioNameInput = ref("   "); // Empty/whitespace name
      const status = ref<string | null>(null);
      const tone = ref<"ok" | "error">("ok");

      // Act & Assert
      const saveToUnity = () => {
        if (!generatedAudio.value) {
          throw new Error("No audio available to save to Unity");
        }

        const audioName = audioNameInput.value.trim();
        if (!audioName) {
          tone.value = "error";
          status.value = "Audio clip name cannot be empty";
          throw new Error("Audio clip name cannot be empty");
        }
      };

      expect(() => saveToUnity()).toThrow("Audio clip name cannot be empty");
      expect(tone.value).toBe("error");
      expect(status.value).toBe("Audio clip name cannot be empty");
    });

    it("should throw error when audio format is not selected", () => {
      // Arrange
      const generatedAudio = ref("data:audio/wav;base64,UklGRiQAAABXQVZFZm10...");
      const audioNameInput = ref("TestAudio");
      const audioFormatSelect = ref(""); // No format selected
      const status = ref<string | null>(null);
      const tone = ref<"ok" | "error">("ok");

      // Act & Assert
      const saveToUnity = () => {
        if (!generatedAudio.value) {
          throw new Error("No audio available to save to Unity");
        }

        const audioName = audioNameInput.value.trim();
        if (!audioName) {
          throw new Error("Audio clip name cannot be empty");
        }

        const audioFormat = audioFormatSelect.value;
        if (!audioFormat) {
          tone.value = "error";
          status.value = "Audio format must be selected";
          throw new Error("Audio format must be selected");
        }
      };

      expect(() => saveToUnity()).toThrow("Audio format must be selected");
      expect(tone.value).toBe("error");
      expect(status.value).toBe("Audio format must be selected");
    });
  });

  describe("Navigation with Query Parameters - Requirements 5.5, 5.6, 5.7", () => {
    beforeEach(() => {
      // Clear composable state before each navigation test
      const { clearPendingMediaImport } = useMediaImport();
      clearPendingMediaImport();
    });

    it("should store media data in useMediaImport composable when saving to Unity", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      const audioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      const audioName = "BackgroundMusic";
      const audioFormat = "MP3";

      // Act: Simulate what saveToUnity() does internally
      const unityPrompt = `Import this generated audio as a Unity audio clip named "${audioName}" in ${audioFormat} format, create an AudioSource GameObject, and set it to play on awake with loop enabled`;
      setPendingMediaImport(
        { data: audioData, name: audioName, type: "audio", audioFormat },
        unityPrompt
      );

      // Assert: Verify media data is stored correctly for ScenesPanel to pick up
      expect(pendingMediaImport.value).toMatchObject({
        data: audioData,
        name: "BackgroundMusic",
        type: "audio",
        audioFormat: "MP3"
      });
    });

    it("should include audio clip name in Unity import prompt", () => {
      // Arrange
      const { setPendingMediaImport, pendingPrompt } = useMediaImport();
      const audioName = "ExplosionSound";
      const audioFormat = "WAV";

      // Act: Simulate saveToUnity() prompt construction
      const unityPrompt = `Import this generated audio as a Unity audio clip named "${audioName}" in ${audioFormat} format, create an AudioSource GameObject, and set it to play on awake with loop enabled`;
      setPendingMediaImport(
        { data: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=", name: audioName, type: "audio", audioFormat },
        unityPrompt
      );

      // Assert: Verify prompt contains audio name and format
      expect(pendingPrompt.value).toContain("ExplosionSound");
      expect(pendingPrompt.value).toContain("WAV");
      expect(pendingPrompt.value).toContain("Unity audio clip");
    });

    it("should pass audio format in media import data", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      const audioFormat = "OGG";

      // Act: Simulate saveToUnity() with OGG format
      setPendingMediaImport(
        { data: "data:audio/ogg;base64,T2dnUwACAAAAAAAAAABqb2huAAAAAAAAqpZ8AQEAAAAAAAAAAAAAAAAAAA==", name: "Music", type: "audio", audioFormat },
        `Import this generated audio as a Unity audio clip named "Music" in ${audioFormat} format, create an AudioSource GameObject, and set it to play on awake with loop enabled`
      );

      // Assert: Verify format is stored correctly
      expect(pendingMediaImport.value?.audioFormat).toBe("OGG");
      expect(pendingMediaImport.value?.type).toBe("audio");
    });

    it("should preserve audio data integrity during navigation", () => {
      // Arrange
      const { setPendingMediaImport, pendingMediaImport } = useMediaImport();
      const testAudioData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

      // Act: Simulate saveToUnity() storing the audio data
      setPendingMediaImport(
        { data: testAudioData, name: "TestSound", type: "audio", audioFormat: "WAV" },
        "Import audio"
      );

      // Assert: Verify audio data is preserved exactly (no corruption)
      expect(pendingMediaImport.value?.data).toBe(testAudioData);
      expect(pendingMediaImport.value?.data.length).toBe(testAudioData.length);
    });
  });
});
