import { computed, ref, onMounted, watch } from "vue";
import { generateWizard } from "@/api/client";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { TEMPERATURE_PRESETS } from "@/constants/providers";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useSessionProject } from "@/composables/useSessionProject";
import { useUnityMcpStatus } from "@/composables/useUnityMcpStatus";

export const WIZARD_QUICK_ACTIONS = [
  { label: "FPS Prototype", icon: "mdi-target", prompt: "Create a playable FPS prototype: scene, player, camera, input, and basic UI." },
  { label: "Platformer Level", icon: "mdi-layers", prompt: "Build a platformer level with ground, platforms, player spawn, lighting, and collectibles." },
  { label: "UI + Menu", icon: "mdi-menu", prompt: "Create a main menu scene with canvas UI, buttons, and a playable start flow." },
];

/**
 * Composable for the Unity Wizard orchestration panel.
 */
export function useWizardPanel() {
  const store = useIntelligenceStore();
  const { projectName } = useSessionProject();
  const { available: mcpAvailable, warning: mcpWarning } = useUnityMcpStatus();

  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.7);
  const apiKey = ref("");
  const systemPrompt = ref("");
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref<Record<string, unknown> | null>(null);
  const loading = ref(false);
  const showModelManager = ref(false);

  const providers = computed(() => store.getProvidersByModality("llm"));
  const providerOptions = computed(() =>
    providers.value.map((p: { name: string }) => ({ value: p.name, label: p.name }))
  );
  const availableModels = computed(() => store.getModelsByProvider(provider.value, "llm"));
  const canGenerate = computed(() => prompt.value.trim().length > 0 && !loading.value);

  onMounted(async () => {
    await store.load();
    const preferred = store.getPreferredEngine("llm");
    if (!provider.value) provider.value = preferred.provider;
    if (!model.value) model.value = preferred.model;
  });

  watch(provider, () => {
    if (provider.value && !availableModels.value.some((m: { value: string }) => m.value === model.value)) {
      model.value = "";
    }
  });

  async function refreshModels(): Promise<void> {
    await store.load(true);
  }

  async function run(): Promise<void> {
    if (!prompt.value.trim()) {
      tone.value = "error";
      status.value = "Prompt cannot be empty";
      return;
    }
    loading.value = true;
    status.value = "Running wizard orchestration...";
    tone.value = "ok";
    result.value = null;

    try {
      const response = await generateWizard({
        prompt: prompt.value,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        system_prompt: systemPrompt.value || undefined,
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
        options: { model: model.value || undefined, temperature: temperature.value, max_tokens: 8000 },
      });
      if (response.success && response.data) {
        status.value = "Wizard run completed.";
        result.value = response.data;
      } else {
        tone.value = "error";
        status.value = response.error || "Unknown error";
      }
    } catch (e) {
      tone.value = "error";
      status.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  return {
    prompt, provider, model, temperature, apiKey, systemPrompt,
    status, tone, result, loading, canGenerate, run,
    mcpAvailable, mcpWarning, providerOptions, availableModels,
    showModelManager, refreshModels, TEMPERATURE_PRESETS, WIZARD_QUICK_ACTIONS,
  };
}
