import { ref, computed, onMounted, watch } from "vue";
import { generateImage } from "@/api/client";
import { ASPECT_RATIOS, QUALITY_OPTIONS } from "@/constants/providers";
import { useSessionProject } from "@/composables/useSessionProject";
import { projectStore } from "@/store/projectStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";

export function useImagePanel() {
  const store = useIntelligenceStore();
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

  const activeProjectName = computed(() => projectStore.activeProjectName);

  // Discovery data from store
  const providers = computed(() => store.getProvidersByModality("image"));
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

  async function refreshModels() {
    await store.load();
  }


  async function run() {
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
        project_name: (autoSaveToProject.value && (projectStore.activeProjectName || sessionProjectName.value)) || undefined
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate image.";
        return;
      }
      status.value = "Image request complete.";
      result.value = JSON.stringify(response.data || {}, null, 2);
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  return {
    prompt,
    provider,
    model,
    providers,
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
    QUALITY_OPTIONS
  };
}
