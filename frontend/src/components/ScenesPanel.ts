import { computed, ref, watch, onMounted } from "vue";
import { createScene } from "@/api/client";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { TEMPERATURE_PRESETS } from "@/constants/providers";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useSessionProject } from "@/composables/useSessionProject";
import { useMediaImport } from "@/composables/useMediaImport";

export function useScenesPanel() {
  const store = useIntelligenceStore();
  const { projectName } = useSessionProject();
  const { pendingMediaImport, pendingPrompt, clearPendingMediaImport, hasPendingMediaImport } = useMediaImport();

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

  interface MediaImportPayload {
    data: string;
    name: string;
    type: string;
    texture_type?: string;
    audio_format?: string;
  }

  interface SceneRequestPayload {
    prompt: string;
    system_prompt?: string;
    provider?: string;
    api_key?: string;
    project_name: string;
    options: {
      model?: string;
      temperature: number;
    };
    media_import?: MediaImportPayload;
  }

  const result = ref<AgentResult | null>(null);
  const loading = ref(false);

  // Discovery data from store
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
      console.error("Failed to load ScenesPanel state via store", e);
    }

    // Check for pending media import from ImagePanel or AudioPanel
    if (hasPendingMediaImport() && pendingPrompt.value) {
      prompt.value = pendingPrompt.value;
      status.value = `Ready to import ${pendingMediaImport.value?.type || 'media'} to Unity`;
      tone.value = "ok";
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
      // Build request payload
      const requestPayload: SceneRequestPayload = {
        prompt: prompt.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
        options: {
             model: model.value || undefined,
             temperature: temperature.value
        }
      };

      // Include media import data if present
      if (hasPendingMediaImport() && pendingMediaImport.value) {
        requestPayload.media_import = {
          data: pendingMediaImport.value.data,
          name: pendingMediaImport.value.name,
          type: pendingMediaImport.value.type,
          texture_type: pendingMediaImport.value.textureType,
          audio_format: pendingMediaImport.value.audioFormat
        };
      }

      const response = await createScene(requestPayload);

      if (response.success) {
        status.value = "Scene generated successfully.";
        result.value = response.data as unknown as AgentResult;
        
        // Clear pending media import after successful generation
        if (hasPendingMediaImport()) {
          clearPendingMediaImport();
        }
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
    providerOptions,
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
    TEMPERATURE_PRESETS,
    // Media import state
    pendingMediaImport,
    hasPendingMediaImport
  };
}
