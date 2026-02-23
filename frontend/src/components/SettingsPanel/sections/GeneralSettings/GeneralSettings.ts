import { onMounted, ref, computed } from "vue";
import { setPref } from "@/api/client";
import { useIntelligenceStore } from "@/store/intelligenceStore";

export function useGeneralSettings() {
  const store = useIntelligenceStore();

  const backendUrl = ref(
    localStorage.getItem("backendUrl") || "http://127.0.0.1:8000",
  );

  // Selection refs (staged for saving)
  const preferredLlm = ref("");
  const preferredLlmModel = ref("");

  const preferredImage = ref("");
  const preferredImageModel = ref("");

  const preferredAudio = ref("");
  const preferredAudioModel = ref("");

  const preferredMusic = ref("");
  const preferredMusicModel = ref("");

  const status = ref<string | null>(null);

  // Computed lists derived from store
  const providers = computed(() => store.providers);

  const llmProviders = computed(() => store.getProvidersByModality("llm"));
  const llmModels = computed(() => store.getModelsByProvider(preferredLlm.value, "llm"));

  const imageProviders = computed(() => store.getProvidersByModality("image"));
  const imageModels = computed(() => store.getModelsByProvider(preferredImage.value, "image"));

  const audioProviders = computed(() => store.getProvidersByModality("audio"));
  const audioModels = computed(() => store.getModelsByProvider(preferredAudio.value, "audio"));

  const musicProviders = computed(() => store.getProvidersByModality("music"));
  const musicModels = computed(() => store.getModelsByProvider(preferredMusic.value, "music"));

  onMounted(async () => {
    try {
      await store.load();

      // Initialize selection from store preferences
      preferredLlm.value = store.getPreference("preferred_llm_provider");
      preferredLlmModel.value = store.getPreference("preferred_llm_model");

      preferredImage.value = store.getPreference("preferred_image_provider");
      preferredImageModel.value = store.getPreference("preferred_image_model");

      preferredAudio.value = store.getPreference("preferred_audio_provider");
      preferredAudioModel.value = store.getPreference("preferred_audio_model");

      preferredMusic.value = store.getPreference("preferred_music_provider");
      preferredMusicModel.value = store.getPreference("preferred_music_model");

    } catch (e) {
      console.error("Failed to load settings via store", e);
    }
  });

  async function save() {
    localStorage.setItem("backendUrl", backendUrl.value);
    status.value = "Saving...";

    try {
      const results = await Promise.all([
        setPref("preferred_llm_provider", preferredLlm.value),
        setPref("preferred_llm_model", preferredLlmModel.value),
        setPref("preferred_image_provider", preferredImage.value),
        setPref("preferred_image_model", preferredImageModel.value),
        setPref("preferred_audio_provider", preferredAudio.value),
        setPref("preferred_audio_model", preferredAudioModel.value),
        setPref("preferred_music_provider", preferredMusic.value),
        setPref("preferred_music_model", preferredMusicModel.value),
      ]);

      const errorResult = results.find(r => !r.success);
      if (errorResult) {
        status.value = errorResult.error || "Save failed";
      } else {
        // Refresh store after save to ensure all components see new preferences
        await store.refresh();
        status.value = "Preferences saved successfully.";
        setTimeout(() => status.value = null, 3000);
      }
    } catch {
      status.value = "Network error: Failed to reach backend.";
    }
  }

  return {
    backendUrl,
    providers,
    llmProviders,
    llmModels,
    preferredLlm,
    preferredLlmModel,
    imageProviders,
    imageModels,
    preferredImage,
    preferredImageModel,
    audioProviders,
    audioModels,
    preferredAudio,
    preferredAudioModel,
    musicProviders,
    musicModels,
    preferredMusic,
    preferredMusicModel,
    status,
    save,
  };
}

