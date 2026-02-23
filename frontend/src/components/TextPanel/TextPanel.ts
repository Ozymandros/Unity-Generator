import { ref, computed, onMounted, watch } from "vue";
import { generateText } from "@/api/client";
import { TEMPERATURE_PRESETS, LENGTH_PRESETS } from "@/constants/providers";
import { projectStore } from "@/store/projectStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";

export function useTextPanel() {
  const store = useIntelligenceStore();

  const prompt = ref("");
  const provider = ref("");
  const apiKey = ref("");
  const model = ref("");
  const temperature = ref(0.7);
  const maxTokens = ref(2048);
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: You are a creative writer...");
  const autoSaveToProject = ref(true);

  const activeProjectName = computed(() => projectStore.activeProjectName);

  // Discovery data from store
  const providers = computed(() => store.getProvidersByModality("llm"));
  const providerModels = computed(() => store.getModelsByProvider(provider.value, "llm"));
  const showModelManager = ref(false);

  onMounted(async () => {
    try {
      await store.load();

      // Auto-default to preferred choices if local choice is empty
      if (!provider.value) {
        provider.value = store.getPreference("preferred_llm_provider");
      }
      if (!model.value) {
        model.value = store.getPreference("preferred_llm_model");
      }

      const dbSysPrompt = store.getPreference("default_text_system_prompt");
      if (dbSysPrompt) {
        defaultSystemPrompt.value = `Default: ${dbSysPrompt.substring(0, 50)}...`;
      }
    } catch (e) {
      console.error("Failed to load TextPanel state via store", e);
    }
  });

  watch(provider, () => {
    // Reset model when provider changes if not in discovery list
    if (provider.value && !providerModels.value.some((m: { value: string }) => m.value === model.value)) {
      model.value = "";
    }
  });

  async function refreshModels() {
    // No-op or call store.refresh() if needed, but computed handled it
    await store.load();
  }


  async function run() {
    status.value = "Generating text...";
    tone.value = "ok";
    try {
      const response = await generateText({
        prompt: prompt.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        options: { 
          model: model.value || undefined,
          temperature: temperature.value,
          max_tokens: maxTokens.value,
          api_key: apiKey.value || undefined,
        },
        project_path: (autoSaveToProject.value && projectStore.activeProjectPath) || undefined
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate text.";
        return;
      }
      status.value = "Text generated.";
      result.value = String(response.data?.content || "");
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  return {
    prompt,
    provider,
    apiKey,
    model,
    temperature,
    maxTokens,
    status,
    tone,
    result,
    systemPrompt,
    defaultSystemPrompt,
    autoSaveToProject,
    activeProjectName,
    providerModels,
    providers,
    showModelManager,
    refreshModels,
    run,
    TEMPERATURE_PRESETS,
    LENGTH_PRESETS
  };
}
