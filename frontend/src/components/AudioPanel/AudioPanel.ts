import { ref, computed, onMounted, watch } from "vue";
import { generateAudio } from "@/api/client";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { useSessionProject } from "@/composables/useSessionProject";
import { projectStore } from "@/store/projectStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useMediaImport } from "@/composables/useMediaImport";
import { useApp } from "@/App";

export function useAudioPanel() {
  const store = useIntelligenceStore();
  const { setActive } = useApp();
  const { setPendingMediaImport } = useMediaImport();
  const { projectName: sessionProjectName } = useSessionProject();

  const prompt = ref("");
  const modality = ref<"audio" | "music">("audio");
  const provider = ref("");
  const apiKey = ref("");
  const voiceId = ref("");
  const musicModel = ref("");
  const stability = ref(0.5);
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: High quality sound effect...");
  const autoSaveToProject = ref(true);

  // Unity integration state
  const generatedAudio = ref<string | null>(null);
  const audioNameInput = ref("GeneratedAudio");
  const audioFormatSelect = ref("WAV");

  const activeProjectName = computed(() => projectStore.activeProjectName);

  // Discovery data from store
  const providers = computed(() => store.getProvidersByModality(modality.value));
  const availableVoices = computed(() => modality.value === "audio" ? store.getModelsByProvider(provider.value, "audio") : []);
  const availableModels = computed(() => modality.value === "music" ? store.getModelsByProvider(provider.value, "music") : []);
  const showModelManager = ref(false);

  onMounted(async () => {
    try {
      await store.load();
      await updateDefaults();
    } catch (e) {
      console.error("Failed to load AudioPanel state via store", e);
    }
  });

  /**
   * Load preferred provider/model and system prompt defaults for the current modality.
   * Called on mount and whenever `modality` changes so the UI reflects the right defaults.
   *
   * @returns Promise that resolves when defaults have been applied to reactive state
   *
   * @example
   * ```typescript
   * modality.value = "music";
   * await updateDefaults();
   * // provider.value and defaultSystemPrompt.value now reflect music preferences
   * ```
   */
  async function updateDefaults(): Promise<void> {
    const preferred = store.getPreferredEngine(modality.value);
    if (preferred.provider) provider.value = preferred.provider;
    if (preferred.model) voiceId.value = preferred.model;

    const dbSysPrompt = store.getPreference(`default_${modality.value}_system_prompt`);
    if (dbSysPrompt) {
      defaultSystemPrompt.value = `Default: ${dbSysPrompt.substring(0, 50)}...`;
    } else {
      // Fall back to a sensible placeholder that matches the selected modality
      defaultSystemPrompt.value = modality.value === "music" 
        ? "Default: Cinematic background music..." 
        : "Default: High quality sound effect...";
    }
  }

  watch(modality, async () => {
    provider.value = "";
    voiceId.value = "";
    musicModel.value = "";
    systemPrompt.value = "";
    await updateDefaults();
  });

  watch(provider, () => {
    // Reset voice if not in new provider's list
    if (provider.value && !availableVoices.value.some((m: { value: string }) => m.value === voiceId.value)) {
      voiceId.value = "";
    }
  });

  /**
   * Reload available models/voices from the intelligence store.
   * Called after the user adds or removes models via the ModelManagerModal.
   *
   * @returns Promise that resolves when the store has finished reloading
   *
   * @example
   * ```typescript
   * await refreshModels();
   * // availableVoices / availableModels are now up-to-date
   * ```
   */
  async function refreshModels(): Promise<void> {
    await store.load();
  }

  /**
   * Navigate to ScenesPanel with a pre-filled Unity import prompt for the generated audio.
   *
   * Reads `generatedAudio`, `audioNameInput`, and `audioFormatSelect` from component
   * state, validates them, then hands off to the `useMediaImport` composable so that
   * ScenesPanel can pick up the pending import on mount.
   *
   * @throws {Error} If no audio has been generated yet ("No audio available to save to Unity")
   * @throws {Error} If the audio clip name input is empty ("Audio clip name cannot be empty")
   * @throws {Error} If no audio format is selected ("Audio format must be selected")
   * @throws {Error} If media validation fails (invalid base64, unsafe file name, or size > 5 MB)
   *
   * @example
   * ```typescript
   * // After a successful run() call:
   * audioNameInput.value = "BackgroundMusic";
   * audioFormatSelect.value = "WAV";
   * saveToUnity();
   * // ScenesPanel is now active with the import prompt pre-filled
   * ```
   */
  function saveToUnity(): void {
    // Guard: audio must have been generated before we can export it
    if (!generatedAudio.value) {
      tone.value = "error";
      status.value = "No audio available to save to Unity";
      throw new Error("No audio available to save to Unity");
    }

    // Guard: clip name must be a non-empty string (trimmed to catch whitespace-only input)
    const audioName = audioNameInput.value.trim();
    if (!audioName) {
      tone.value = "error";
      status.value = "Audio clip name cannot be empty";
      throw new Error("Audio clip name cannot be empty");
    }

    // Guard: a format (WAV, MP3, OGG) must be selected so Unity knows how to import the clip
    const audioFormat = audioFormatSelect.value;
    if (!audioFormat) {
      tone.value = "error";
      status.value = "Audio format must be selected";
      throw new Error("Audio format must be selected");
    }

    // Build a descriptive Unity import prompt that tells the LLM exactly what to do:
    // import the audio clip, set its format, create an AudioSource, and configure playback
    const unityPrompt = `Import this generated audio as a Unity audio clip named "${audioName}" in ${audioFormat} format, create an AudioSource GameObject, and set it to play on awake with loop enabled`;

    // Store media data in the shared composable so ScenesPanel can read it on mount.
    // validateMediaImport is called internally and will throw if data is invalid.
    setPendingMediaImport(
      {
        data: generatedAudio.value,
        name: audioName,
        type: "audio",
        audioFormat: audioFormat
      },
      unityPrompt
    );

    // Switch to the Scenes tab — ScenesPanel's onMounted hook will detect the pending import
    setActive("Scenes");
  }


  /**
   * Generate audio or music using the selected provider and model.
   * Updates status, result, and generatedAudio refs based on the API response.
   * On success, extracts the audio URL/data from the response for Unity integration.
   *
   * @returns Promise that resolves when generation is complete
   * @throws Never — errors are caught and surfaced via the status ref
   *
   * @example
   * ```typescript
   * modality.value = "audio";
   * prompt.value = "A dramatic orchestral sting";
   * await run();
   * // generatedAudio.value now contains the audio URL or base64 data
   * ```
   */
  async function run(): Promise<void> {
    status.value = modality.value === "audio" ? "Generating audio..." : "Generating music...";
    tone.value = "ok";
    try {
      const response = await generateAudio({
        prompt: prompt.value,
        modality: modality.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        options: modality.value === "audio"
          ? { voice_id: voiceId.value || undefined, stability: stability.value, api_key: apiKey.value || undefined }
          : { model: musicModel.value || undefined, stability: stability.value, api_key: apiKey.value || undefined },
        project_name: sessionProjectName.value?.trim() || DEFAULT_PROJECT_NAME
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || (modality.value === "audio" ? "Failed to generate audio." : "Failed to generate music.");
        return;
      }
      status.value = modality.value === "audio" ? "Audio request complete." : "Music request complete.";
      result.value = JSON.stringify(response.data || {}, null, 2);
      
      // Extract generated audio URL/data for Unity integration.
      // Different providers return audio data under different keys (url, audio, data),
      // so we probe each known key in priority order.
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.url === 'string') {
          generatedAudio.value = data.url;
        } else if (typeof data.audio === 'string') {
          generatedAudio.value = data.audio;
        } else if (typeof data.data === 'string') {
          generatedAudio.value = data.data;
        }
      }
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  return {
    prompt,
    modality,
    provider,
    providers,
    apiKey,
    voiceId,
    musicModel,
    stability,
    status,
    tone,
    result,
    systemPrompt,
    defaultSystemPrompt,
    autoSaveToProject,
    activeProjectName,
    availableVoices,
    availableModels,
    showModelManager,
    refreshModels,
    run,
    // Unity integration
    generatedAudio,
    audioNameInput,
    audioFormatSelect,
    saveToUnity,
  };
}
