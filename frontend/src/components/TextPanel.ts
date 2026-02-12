import { ref, computed } from "vue";
import { generateText } from "../api/client";
import { TEXT_PROVIDERS, TEMPERATURE_PRESETS, LENGTH_PRESETS } from "../constants/providers";

export function useTextPanel() {
  const prompt = ref("");
  const provider = ref("");
  const apiKey = ref("");
  const model = ref("");
  const temperature = ref(0.7);
  const maxTokens = ref(2048);
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");

  const providerModels = computed(() => {
    const p = TEXT_PROVIDERS.find((x) => x.value === provider.value);
    return p ? p.models || [] : [];
  });

  async function run() {
    status.value = "Generating text...";
    tone.value = "ok";
    try {
      const response = await generateText({
        prompt: prompt.value,
        provider: provider.value || undefined,
        options: { 
          model: model.value || undefined,
          temperature: temperature.value,
          max_tokens: maxTokens.value,
          api_key: apiKey.value || undefined,
        },
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
    providerModels,
    run,
    TEXT_PROVIDERS,
    TEMPERATURE_PRESETS,
    LENGTH_PRESETS
  };
}
