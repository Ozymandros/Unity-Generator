import { ref, computed, onMounted, watch } from "vue";
import { generateText, getPref, listModels, type ModelEntry } from "@/api/client";
import { TEXT_PROVIDERS, TEMPERATURE_PRESETS, LENGTH_PRESETS } from "@/constants/providers";
import { projectStore } from "@/store/projectStore";

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
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: You are a creative writer...");
  const autoSaveToProject = ref(true);

  const activeProjectName = computed(() => projectStore.activeProjectName);

  onMounted(async () => {
    const pref = await getPref("default_text_system_prompt");
    if (pref.success && pref.data?.value) {
      const val = String(pref.data.value);
      defaultSystemPrompt.value = val ? `Default: ${val.substring(0, 50)}...` : defaultSystemPrompt.value;
    }
  });

  const providerModels = ref<ModelEntry[]>([]);
  const showModelManager = ref(false);

  async function refreshModels() {
    providerModels.value = provider.value
      ? await listModels(provider.value)
      : [];
  }

  watch(provider, () => {
    model.value = "";
    refreshModels();
  });

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
    showModelManager,
    refreshModels,
    run,
    TEXT_PROVIDERS,
    TEMPERATURE_PRESETS,
    LENGTH_PRESETS
  };
}
