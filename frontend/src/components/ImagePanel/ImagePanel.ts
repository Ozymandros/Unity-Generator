import { ref, computed, onMounted, watch } from "vue";
import { generateImage } from "@/api/client";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { ASPECT_RATIOS, QUALITY_OPTIONS } from "@/constants/providers";
import { useSessionProject } from "@/composables/useSessionProject";
import { projectStore } from "@/store/projectStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useMediaImport } from "@/composables/useMediaImport";
import { useApp } from "@/App";

export function useImagePanel() {
  const store = useIntelligenceStore();
  const { setActive } = useApp();
  const { setPendingMediaImport } = useMediaImport();
  const { projectName: sessionProjectName } = useSessionProject();

  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const apiKey = ref("");
  const aspectRatio = ref("1:1");
  const quality = ref("standard");
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: Professional concept art...");
  const autoSaveToProject = ref(true);

  // Unity integration state
  const generatedImage = ref<string | null>(null);
  const textureNameInput = ref("GeneratedTexture");
  const textureTypeSelect = ref("Sprite");

  const activeProjectName = computed(() => projectStore.activeProjectName);

  // Discovery data from store
  const providers = computed(() => store.getProvidersByModality("image"));
  const providerOptions = computed(() =>
    providers.value.map((p: { name: string }) => ({ value: p.name, label: p.name }))
  );
  const availableModels = computed(() => store.getModelsByProvider(provider.value, "image"));
  const showModelManager = ref(false);

  onMounted(async () => {
    try {
      await store.load();

      const preferred = store.getPreferredEngine("image");
      if (!provider.value) provider.value = preferred.provider;
      if (!model.value) model.value = preferred.model;

      const dbSysPrompt = store.getPreference("default_image_system_prompt");
      if (dbSysPrompt) {
        defaultSystemPrompt.value = `Default: ${dbSysPrompt.substring(0, 50)}...`;
      }
    } catch (e) {
      console.error("Failed to load ImagePanel state via store", e);
    }
  });

  watch(provider, () => {
    // Reset model if not in new provider's list
    if (provider.value && !availableModels.value.some((m: { value: string }) => m.value === model.value)) {
      model.value = "";
    }
  });

  /**
   * Reload available models from the intelligence store.
   * Called after the user adds or removes models via the ModelManagerModal.
   *
   * @returns Promise that resolves when the store has finished reloading
   *
   * @example
   * ```typescript
   * await refreshModels();
   * // availableModels is now up-to-date
   * ```
   */
  async function refreshModels(): Promise<void> {
    await store.load();
  }

  /**
   * Generate an image using the selected provider and model.
   * Updates status, result, and generatedImage refs based on the API response.
   * On success, extracts the image URL/data from the response for Unity integration.
   *
   * @returns Promise that resolves when generation is complete
   * @throws Never — errors are caught and surfaced via the status ref
   *
   * @example
   * ```typescript
   * prompt.value = "A futuristic city skyline";
   * await run();
   * // generatedImage.value now contains the image URL or base64 data
   * ```
   */
  async function run(): Promise<void> {
    status.value = "Generating image...";
    tone.value = "ok";
    try {
      const response = await generateImage({
        prompt: prompt.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        options: { 
          model: model.value || undefined,
          aspect_ratio: aspectRatio.value,
          quality: quality.value,
          api_key: apiKey.value || undefined,
        },
        project_name: sessionProjectName.value?.trim() || DEFAULT_PROJECT_NAME
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate image.";
        return;
      }
      status.value = "Image request complete.";
      result.value = JSON.stringify(response.data || {}, null, 2);
      
      // Extract generated image URL/data for Unity integration.
      // Different providers return image data under different keys (url, image, data),
      // so we probe each known key in priority order.
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.url === 'string') {
          generatedImage.value = data.url;
        } else if (typeof data.image === 'string') {
          generatedImage.value = data.image;
        } else if (typeof data.data === 'string') {
          generatedImage.value = data.data;
        }
      }
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  /**
   * Navigate to ScenesPanel with a pre-filled Unity import prompt for the generated image.
   *
   * Reads `generatedImage`, `textureNameInput`, and `textureTypeSelect` from component
   * state, validates them, then hands off to the `useMediaImport` composable so that
   * ScenesPanel can pick up the pending import on mount.
   *
   * @throws {Error} If no image has been generated yet ("No image available to save to Unity")
   * @throws {Error} If the texture name input is empty ("Texture name cannot be empty")
   * @throws {Error} If no texture type is selected ("Texture type must be selected")
   * @throws {Error} If media validation fails (invalid base64, unsafe file name, or size > 5 MB)
   *
   * @example
   * ```typescript
   * // After a successful run() call:
   * textureNameInput.value = "PlayerTexture";
   * textureTypeSelect.value = "Sprite";
   * saveToUnity();
   * // ScenesPanel is now active with the import prompt pre-filled
   * ```
   */
  function saveToUnity(): void {
    // Guard: an image must have been generated before we can export it
    if (!generatedImage.value) {
      tone.value = "error";
      status.value = "No image available to save to Unity";
      throw new Error("No image available to save to Unity");
    }

    // Guard: texture name must be a non-empty string (trimmed to catch whitespace-only input)
    const textureName = textureNameInput.value.trim();
    if (!textureName) {
      tone.value = "error";
      status.value = "Texture name cannot be empty";
      throw new Error("Texture name cannot be empty");
    }

    // Guard: a texture type (Default, Sprite, Normal, UI) must be selected
    const textureType = textureTypeSelect.value;
    if (!textureType) {
      tone.value = "error";
      status.value = "Texture type must be selected";
      throw new Error("Texture type must be selected");
    }

    // Build a descriptive Unity import prompt that tells the LLM exactly what to do:
    // import the texture, set its type, create a GameObject, and attach a SpriteRenderer
    const unityPrompt = `Import this generated image as a Unity texture named "${textureName}" with ${textureType} texture type, and create a GameObject with SpriteRenderer component displaying it at position (0, 0, 0)`;

    // Store media data in the shared composable so ScenesPanel can read it on mount.
    // validateMediaImport is called internally and will throw if data is invalid.
    setPendingMediaImport(
      {
        data: generatedImage.value,
        name: textureName,
        type: "image",
        textureType: textureType
      },
      unityPrompt
    );

    // Switch to the Scenes tab — ScenesPanel's onMounted hook will detect the pending import
    setActive("Scenes");
  }

  return {
    prompt,
    provider,
    model,
    providers,
    providerOptions,
    apiKey,
    aspectRatio,
    quality,
    status,
    tone,
    result,
    systemPrompt,
    defaultSystemPrompt,
    autoSaveToProject,
    activeProjectName,
    availableModels,
    showModelManager,
    refreshModels,
    run,
    ASPECT_RATIOS,
    QUALITY_OPTIONS,
    // Unity integration
    generatedImage,
    textureNameInput,
    textureTypeSelect,
    saveToUnity,
  };
}
