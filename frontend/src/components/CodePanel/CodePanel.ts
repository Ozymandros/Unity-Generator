import { computed, ref, watch, onMounted } from "vue";
import { generateCode, getPref, getProviderModels, type ModelEntry } from "@/api/client";
import { TEXT_PROVIDERS, TEMPERATURE_PRESETS, LENGTH_PRESETS } from "@/constants/providers";
import { projectStore } from "@/store/projectStore";

export function useCodePanel() {
  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.2); // Default for code
  const maxTokens = ref(2048);
  const apiKey = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: You are a senior Unity engineer...");
  const autoSaveToProject = ref(true);

  const activeProjectName = computed(() => projectStore.activeProjectName);
  const activeProjectPath = computed(() => projectStore.activeProjectPath);

  onMounted(async () => {
    const pref = await getPref("default_code_system_prompt");
    if (pref.success && pref.data?.value) {
      defaultSystemPrompt.value = `Default: ${String(pref.data.value).substring(0, 50)}...`;
    }
  });

  const availableModels = ref<ModelEntry[]>([]);
  const showModelManager = ref(false);

  async function refreshModels() {
    availableModels.value = provider.value
      ? await getProviderModels(provider.value)
      : [];
  }

  watch(provider, () => {
    model.value = "";
    refreshModels();
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
    TEXT_PROVIDERS,
    TEMPERATURE_PRESETS,
    LENGTH_PRESETS
  };
}
