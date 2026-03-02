import { computed, ref, watch, onMounted } from "vue";
import { createScene } from "@/api/client";
import { TEMPERATURE_PRESETS } from "@/constants/providers";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useSessionProject } from "@/composables/useSessionProject";

export function useScenesPanel() {
  const store = useIntelligenceStore();
  const { projectName } = useSessionProject();

  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.7);
  const apiKey = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: You are a senior Unity engineer...");

  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");

  interface AgentResult {
    content: string;
    files: string[];
    metadata?: {
      steps?: string[];
    };
  }

  const result = ref<AgentResult | null>(null);
  const loading = ref(false);

  // Discovery data from store
  const providers = computed(() => store.getProvidersByModality("llm"));
  const availableModels = computed(() => store.getModelsByProvider(provider.value, "llm"));
  const showModelManager = ref(false);

  onMounted(async () => {
    try {
      await store.load();

      const preferred = store.getPreferredEngine("llm");
      if (!provider.value) provider.value = preferred.provider;
      if (!model.value) model.value = preferred.model;

      const dbSysPrompt = store.getPreference("default_code_system_prompt");
      if (dbSysPrompt) {
        defaultSystemPrompt.value = `Default: ${dbSysPrompt.substring(0, 50)}...`;
      }
    } catch (e) {
      console.error("Failed to load ScenesPanel state via store", e);
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


  const canGenerate = computed(() => prompt.value.trim().length > 0 && !loading.value);

  async function run() {
    if (!canGenerate.value) return;

    loading.value = true;
    status.value = "Generating scene...";
    tone.value = "ok";
    result.value = null;

    try {
      const response = await createScene({
        prompt: prompt.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        project_name: projectName.value || undefined,
        options: {
             model: model.value || undefined,
             temperature: temperature.value
        }
      });

      if (response.success) {
        status.value = "Scene generated successfully.";
        result.value = response.data as unknown as AgentResult;
      } else {
        tone.value = "error";
        status.value = response.error || "Unknown error occurred";
      }
    } catch (e) {
      tone.value = "error";
      status.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  return {
    prompt,
    provider,
    model,
    providers,
    temperature,
    apiKey,
    systemPrompt,
    defaultSystemPrompt,
    availableModels,
    showModelManager,
    refreshModels,
    status,
    tone,
    result,
    loading,
    canGenerate,
    run,
    TEMPERATURE_PRESETS
  };
}
