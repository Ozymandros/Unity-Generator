import { ref, computed, onMounted, watch } from "vue";
import { generateAudio } from "@/api/client";
import { projectStore } from "@/store/projectStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";

export function useAudioPanel() {
  const store = useIntelligenceStore();

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

  async function updateDefaults() {
    const preferred = store.getPreferredEngine(modality.value);
    if (preferred.provider) provider.value = preferred.provider;
    if (preferred.model) voiceId.value = preferred.model;

    const dbSysPrompt = store.getPreference(`default_${modality.value}_system_prompt`);
    if (dbSysPrompt) {
      defaultSystemPrompt.value = `Default: ${dbSysPrompt.substring(0, 50)}...`;
    } else {
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

  async function refreshModels() {
    await store.load();
  }


  async function run() {
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
        project_path: (autoSaveToProject.value && projectStore.activeProjectPath) || undefined
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || (modality.value === "audio" ? "Failed to generate audio." : "Failed to generate music.");
        return;
      }
      status.value = modality.value === "audio" ? "Audio request complete." : "Music request complete.";
      result.value = JSON.stringify(response.data || {}, null, 2);
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
    run
  };
}
