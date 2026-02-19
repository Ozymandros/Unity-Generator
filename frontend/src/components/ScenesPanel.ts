import { computed, ref, watch, onMounted } from "vue";
import { createScene, getPref } from "@/api/client";
import { TEXT_PROVIDERS, TEMPERATURE_PRESETS } from "@/constants/providers";

export function useScenesPanel() {
  const prompt = ref("");
  const provider = ref(""); // Default to empty, backend falls back to global pref
  const model = ref("");
  const temperature = ref(0.7); // Default for creative tasks
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

  onMounted(async () => {
    // We reuse code prompt for now as scenes are code-heavy
    const pref = await getPref("default_code_system_prompt");
    if (pref.success && pref.data?.value) {
      defaultSystemPrompt.value = `Default: ${String(pref.data.value).substring(0, 50)}...`;
    }
  });

  const availableModels = computed(() => {
    const p = TEXT_PROVIDERS.find((x) => x.value === provider.value);
    return p ? p.models || [] : [];
  });

  // Reset model when provider changes
  watch(provider, () => {
      model.value = "";
  });

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
    temperature,
    apiKey,
    systemPrompt,
    defaultSystemPrompt,
    availableModels,
    status,
    tone,
    result,
    loading,
    canGenerate,
    run,
    TEXT_PROVIDERS,
    TEMPERATURE_PRESETS
  };
}
