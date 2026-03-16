import { computed, ref, watch, onMounted } from "vue";
import { generateUnityUI } from "@/api/client";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { TEMPERATURE_PRESETS } from "@/constants/providers";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useSessionProject } from "@/composables/useSessionProject";
import {
  UI_QUICK_ACTIONS,
  UI_EXAMPLE_PROMPTS,
  UI_ELEMENT_TYPES,
  getTemplatePrompt,
  type UIQuickAction,
  type UISystem,
  type UIOutputFormat,
  type UIAnchorPreset,
} from "@/constants/unityUIPrompts";

export interface AgentResult {
  content: string;
  files: string[];
  metadata?: {
    steps?: string[];
  };
}

/**
 * Composable for the Unity UI Elements panel.
 *
 * Manages all reactive state and generation logic for creating Unity UI prefab
 * assets (health bars, buttons, dialogue boxes, etc.) via the /generate/unity-ui
 * backend endpoint.
 *
 * @returns Reactive state and functions for the UnityUIPanel component.
 *
 * @example
 * ```typescript
 * const { prompt, run, loading } = useUnityUIPanel();
 * ```
 */
export function useUnityUIPanel() {
  const store = useIntelligenceStore();
  const { projectName } = useSessionProject();

  // Core generation fields
  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.7);
  const apiKey = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: You are a senior Unity UI engineer...");

  // UI-specific fields
  const uiSystem = ref<UISystem>("ugui");
  const elementType = ref("custom");
  const outputFormat = ref<UIOutputFormat>("script");
  const anchorPreset = ref<UIAnchorPreset | "">("");
  const colorTheme = ref("");
  const includeAnimations = ref(false);

  // Status / result
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref<AgentResult | null>(null);
  const loading = ref(false);

  // Provider/model discovery
  const providers = computed(() => store.getProvidersByModality("llm"));
  const providerOptions = computed(() =>
    providers.value.map((p: { name: string }) => ({ value: p.name, label: p.name }))
  );
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
      console.error("Failed to load UnityUIPanel state via store", e);
    }
  });

  // Reset model when provider changes and current model is no longer available
  watch(provider, () => {
    if (provider.value && !availableModels.value.some((m: { value: string }) => m.value === model.value)) {
      model.value = "";
    }
  });

  // When element type or UI system changes, pre-fill the prompt with a template
  watch([elementType, uiSystem], ([newType, newSystem]) => {
    if (newType && newType !== "custom") {
      const template = getTemplatePrompt(newType, newSystem as UISystem);
      if (template) prompt.value = template;
    }
  });

  /**
   * Reload available models from the intelligence store.
   * Called after the user adds or removes models via the ModelManagerModal.
   *
   * @returns Promise that resolves when the store has finished reloading.
   *
   * @example
   * ```typescript
   * await refreshModels();
   * ```
   */
  async function refreshModels(): Promise<void> {
    await store.load();
  }

  const canGenerate = computed(() => prompt.value.trim().length > 0 && !loading.value);

  /**
   * Submit the UI generation request to the backend.
   *
   * Validates the prompt, builds the request payload, calls the API, and
   * updates status/result refs based on the response.
   *
   * @returns Promise that resolves when generation completes or fails.
   *
   * @example
   * ```typescript
   * await run();
   * // status.value and result.value are updated
   * ```
   */
  async function run(): Promise<void> {
    if (!prompt.value.trim()) {
      tone.value = "error";
      status.value = "Prompt cannot be empty";
      return;
    }
    if (loading.value) return;

    loading.value = true;
    status.value = "Generating UI element...";
    tone.value = "ok";
    result.value = null;

    try {
      const response = await generateUnityUI({
        prompt: prompt.value,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        system_prompt: systemPrompt.value || undefined,
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
        ui_system: uiSystem.value,
        element_type: elementType.value !== "custom" ? elementType.value : undefined,
        output_format: outputFormat.value,
        anchor_preset: anchorPreset.value || undefined,
        color_theme: colorTheme.value || undefined,
        include_animations: includeAnimations.value,
        options: {
          model: model.value || undefined,
          temperature: temperature.value,
        },
      });

      if (response.success) {
        status.value = "UI element generated successfully.";
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
    // Core fields
    prompt,
    provider,
    model,
    temperature,
    apiKey,
    systemPrompt,
    defaultSystemPrompt,
    // UI-specific fields
    uiSystem,
    elementType,
    outputFormat,
    anchorPreset,
    colorTheme,
    includeAnimations,
    // Provider/model
    providers,
    providerOptions,
    availableModels,
    showModelManager,
    refreshModels,
    // Status / result
    status,
    tone,
    result,
    loading,
    canGenerate,
    run,
    // Constants
    TEMPERATURE_PRESETS,
    UI_QUICK_ACTIONS,
    UI_EXAMPLE_PROMPTS,
    UI_ELEMENT_TYPES,
  };
}

export type { UIQuickAction };
