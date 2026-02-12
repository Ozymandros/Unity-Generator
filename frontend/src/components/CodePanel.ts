import { computed, ref, watch } from "vue";
import { generateCode } from "../api/client";
import { TEXT_PROVIDERS, TEMPERATURE_PRESETS, LENGTH_PRESETS } from "../constants/providers";

export function useCodePanel() {
  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.2); // Default for code
  const maxTokens = ref(2048);
  const apiKey = ref("");

  const availableModels = computed(() => {
    const p = TEXT_PROVIDERS.find((x) => x.value === provider.value);
    return p ? p.models || [] : [];
  });

  watch(provider, () => {
      model.value = "";
  });
  
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");

  async function run() {
    status.value = "Generating code...";
    tone.value = "ok";
    try {
      const response = await generateCode({
        prompt: prompt.value,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        options: {
          model: model.value || undefined,
          temperature: temperature.value,
          max_tokens: maxTokens.value,
        },
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
    temperature,
    maxTokens,
    apiKey,
    availableModels,
    status,
    tone,
    result,
    run,
    TEXT_PROVIDERS,
    TEMPERATURE_PRESETS,
    LENGTH_PRESETS
  };
}
