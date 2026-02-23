import { computed, ref, watch, onMounted } from "vue";
import { generateCode } from "@/api/client";
import { TEMPERATURE_PRESETS, LENGTH_PRESETS } from "@/constants/providers";
import { projectStore } from "@/store/projectStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";

export function useCodePanel() {
  const store = useIntelligenceStore();

  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.2);
  const maxTokens = ref(2048);
  const apiKey = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: You are a senior Unity engineer...");
  const autoSaveToProject = ref(true);

  const activeProjectName = computed(() => projectStore.activeProjectName);
  const activeProjectPath = computed(() => projectStore.activeProjectPath);

  // Discovery data from store
  const providers = computed(() => store.getProvidersByModality("llm"));
  const availableModels = computed(() => store.getModelsByProvider(provider.value, "llm"));
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

      const dbSysPrompt = store.getPreference("default_code_system_prompt");
      if (dbSysPrompt) {
        defaultSystemPrompt.value = `Default: ${dbSysPrompt.substring(0, 50)}...`;
      }
    } catch (e) {
      console.error("Failed to load CodePanel state via store", e);
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


  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");

  async function run() {
    status.value = "Generating code...";
    tone.value = "ok";
    try {
      const response = await generateCode({
        prompt: prompt.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        options: {
          model: model.value || undefined,
          temperature: temperature.value,
          max_tokens: maxTokens.value,
        },
        project_path: (autoSaveToProject.value && projectStore.activeProjectPath) || undefined
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate code.";
        return;
      }
      status.value = "Code generated.";
      result.value = String(response.data?.content || "");
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
    temperature,
    maxTokens,
    apiKey,
    systemPrompt,
    defaultSystemPrompt,
    autoSaveToProject,
    activeProjectName,
    activeProjectPath,
    availableModels,
    showModelManager,
    refreshModels,
    status,
    tone,
    result,
    run,
    TEMPERATURE_PRESETS,
    LENGTH_PRESETS
  };
}
