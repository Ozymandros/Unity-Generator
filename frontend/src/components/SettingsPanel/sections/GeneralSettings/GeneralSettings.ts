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
  const statusType = ref<"success" | "error" | "info" | null>(null);

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

      // Initialize from store (correct-on-read via getPreferredEngine)
      const llm = store.getPreferredEngine("llm");
      preferredLlm.value = llm.provider;
      preferredLlmModel.value = llm.model;

      const image = store.getPreferredEngine("image");
      preferredImage.value = image.provider;
      preferredImageModel.value = image.model;

      const audio = store.getPreferredEngine("audio");
      preferredAudio.value = audio.provider;
      preferredAudioModel.value = audio.model;

      const music = store.getPreferredEngine("music");
      preferredMusic.value = music.provider;
      preferredMusicModel.value = music.model;
    } catch (e) {
      console.error("Failed to load settings via store", e);
    }
  });

  async function save() {
    localStorage.setItem("backendUrl", backendUrl.value);
    status.value = "Saving...";
    statusType.value = "info";

    // Validate each model is in the selected provider's list before saving
    const checks: [string, string, string][] = [
      [preferredLlm.value, preferredLlmModel.value, "llm"],
      [preferredImage.value, preferredImageModel.value, "image"],
      [preferredAudio.value, preferredAudioModel.value, "audio"],
      [preferredMusic.value, preferredMusicModel.value, "music"],
    ];
    for (const [prov, modVal, modality] of checks) {
      if (prov && modVal) {
        const allowed = store.getModelsByProvider(prov, modality).map((m) => m.value);
        if (allowed.length && !allowed.includes(modVal)) {
          status.value = `Model "${modVal}" is not registered for provider "${prov}".`;
          statusType.value = "error";
          return;
        }
      }
    }

    try {
      // Save provider keys first, then model keys
      await setPref("preferred_llm_provider", preferredLlm.value);
      await setPref("preferred_llm_model", preferredLlmModel.value);
      await setPref("preferred_image_provider", preferredImage.value);
      await setPref("preferred_image_model", preferredImageModel.value);
      await setPref("preferred_audio_provider", preferredAudio.value);
      await setPref("preferred_audio_model", preferredAudioModel.value);
      await setPref("preferred_music_provider", preferredMusic.value);
      await setPref("preferred_music_model", preferredMusicModel.value);

      await store.refresh();
      status.value = "Preferences saved successfully.";
      statusType.value = "success";
      setTimeout(() => {
        status.value = null;
        statusType.value = null;
      }, 3000);
    } catch (e) {
      status.value = (e as Error).message ?? "Network error: Failed to reach backend.";
      statusType.value = "error";
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
    statusType,
    save,
  };
}

