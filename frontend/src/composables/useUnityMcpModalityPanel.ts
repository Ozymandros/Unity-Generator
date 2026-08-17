import { computed, ref, onMounted, watch } from "vue";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { TEMPERATURE_PRESETS } from "@/constants/providers";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useSessionProject } from "@/composables/useSessionProject";
import { useUnityMcpStatus } from "@/composables/useUnityMcpStatus";
import type { UnityMcpModalityConfig, UnityModalityQuickAction } from "@/constants/unityMcpModalityConfigs";

export interface ModalityAgentResult {
  content: string;
  files?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Shared composable for Unity MCP modality panels (lighting, camera, materials, animation).
 *
 * @param config - Modality configuration with endpoint and quick actions.
 * @returns Reactive panel state and run handler.
 */
export function useUnityMcpModalityPanel(config: UnityMcpModalityConfig) {
  const store = useIntelligenceStore();
  const { projectName } = useSessionProject();
  const { available: mcpAvailable, editorAvailable, warning: mcpWarning, applyViaMcp } = useUnityMcpStatus();

  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.7);
  const apiKey = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default Unity MCP assistant prompt.");
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref<ModalityAgentResult | null>(null);
  const loading = ref(false);
  const showModelManager = ref(false);

  const providers = computed(() => store.getProvidersByModality("llm"));
  const providerOptions = computed(() =>
    providers.value.map((p: { name: string }) => ({ value: p.name, label: p.name }))
  );
  const availableModels = computed(() => store.getModelsByProvider(provider.value, "llm"));
  const canGenerate = computed(() => prompt.value.trim().length > 0 && !loading.value);

  onMounted(async () => {
    try {
      await store.load();
      const preferred = store.getPreferredEngine("llm");
      if (!provider.value) provider.value = preferred.provider;
      if (!model.value) model.value = preferred.model;
      if (config.systemPromptPrefKey) {
        const dbPrompt = store.getPreference(config.systemPromptPrefKey);
        if (dbPrompt) defaultSystemPrompt.value = `Default: ${dbPrompt.substring(0, 60)}...`;
      }
    } catch (e) {
      console.error(`Failed to load ${config.modalityKey} panel state`, e);
    }
  });

  watch(provider, () => {
    if (provider.value && !availableModels.value.some((m: { value: string }) => m.value === model.value)) {
      model.value = "";
    }
  });

  async function refreshModels(): Promise<void> {
    await store.load(true);
  }

  function handleQuickActionClick(action: UnityModalityQuickAction): void {
    prompt.value = action.prompt;
  }

  async function run(): Promise<void> {
    if (!prompt.value.trim()) {
      tone.value = "error";
      status.value = "Prompt cannot be empty";
      return;
    }
    if (loading.value) return;

    loading.value = true;
    status.value = "Generating...";
    tone.value = "ok";
    result.value = null;

    try {
      const response = await config.generate({
        prompt: prompt.value,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        system_prompt: systemPrompt.value || undefined,
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
        apply_via_mcp: applyViaMcp.value,
        options: {
          model: model.value || undefined,
          temperature: temperature.value,
        },
      });

      if (response.success && response.data) {
        status.value = "Generation completed.";
        result.value = response.data as unknown as ModalityAgentResult;
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
    config,
    prompt,
    provider,
    model,
    temperature,
    apiKey,
    systemPrompt,
    defaultSystemPrompt,
    mcpAvailable,
    editorAvailable,
    mcpWarning,
    applyViaMcp,
    providers,
    providerOptions,
    availableModels,
    showModelManager,
    refreshModels,
    status,
    tone,
    result,
    loading,
    canGenerate,
    run,
    handleQuickActionClick,
    TEMPERATURE_PRESETS,
  };
}
