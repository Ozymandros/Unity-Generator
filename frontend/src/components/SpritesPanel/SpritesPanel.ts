import { computed, ref, onMounted, watch, type CSSProperties } from "vue";
import { generateSprites } from "@/api/client";
import { useSessionProject } from "@/composables/useSessionProject";
import { projectStore } from "@/store/projectStore";
import { useIntelligenceStore } from "@/store/intelligenceStore";

export function useSpritesPanel() {
  const store = useIntelligenceStore();
  const { projectName: sessionProjectName } = useSessionProject();

  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const apiKey = ref("");
  const resolution = ref(64);
  const paletteSize = ref(32);
  const autoCrop = ref(false);

  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const resultImage = ref("");
  const resultMeta = ref<Record<string, unknown> | null>(null);
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: Pixel art style...");
  const autoSaveToProject = ref(true);

  const activeProjectName = computed(() => projectStore.activeProjectName);

  // Discovery data from store
  const providers = computed(() => store.getProvidersByModality("image"));
  const availableModels = computed(() => store.getModelsByProvider(provider.value, "image"));
  const showModelManager = ref(false);

  onMounted(async () => {
    try {
      await store.load();

      const preferred = store.getPreferredEngine("image");
      if (!provider.value) provider.value = preferred.provider;
      if (!model.value) model.value = preferred.model;

      const dbSysPrompt = store.getPreference("default_sprite_system_prompt");
      if (dbSysPrompt) {
        defaultSystemPrompt.value = `Default: ${dbSysPrompt.substring(0, 50)}...`;
      }
    } catch (e) {
      console.error("Failed to load SpritesPanel state via store", e);
    }
  });

  watch(provider, () => {
    if (provider.value && !availableModels.value.some((m: { value: string }) => m.value === model.value)) {
      model.value = "";
    }
  });

  async function refreshModels() {
    await store.load();
  }


  const RESOLUTIONS = [16, 32, 64, 128, 256];
  const PALETTE_SIZES = [8, 16, 32, 64, 256];

  async function run() {
    if (!prompt.value) {
      tone.value = "error";
      status.value = "Please enter a prompt.";
      return;
    }

    status.value = "Generating sprite...";
    tone.value = "ok";
    resultImage.value = "";

    try {
      const response = await generateSprites({
        prompt: prompt.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        resolution: resolution.value,
        options: {
          model: model.value || undefined,
          palette_size: paletteSize.value,
          auto_crop: autoCrop.value
        },
        project_name: (autoSaveToProject.value && (projectStore.activeProjectName || sessionProjectName.value)) || undefined
      });

      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate sprite.";
        return;
      }

      status.value = "Sprite generated.";
      if (response.data && typeof response.data.image === 'string') {
          resultImage.value = `data:image/png;base64,${response.data.image}`;
          resultMeta.value = response.data;
      }
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  // Canvas Preview Logic (Basic for now)
  const canvasStyle = computed((): CSSProperties => {
      // Zoom in for pixel art preview
      return {
          imageRendering: 'pixelated' as "auto", // Cast to one of the accepted union types to satisfy TS while keeping runtime value
          width: `${resolution.value * 4}px`, // 4x Zoom
          height: 'auto',
          border: '1px solid #ccc',
          background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="8" height="8" fill="%23f0f0f0"/><rect x="8" y="8" width="8" height="8" fill="%23f0f0f0"/></svg>')`
      };
  });

  return {
    prompt,
    provider,
    model,
    providers,
    apiKey,
    resolution,
    paletteSize,
    autoCrop,
    status,
    tone,
    resultImage,
    resultMeta,
    systemPrompt,
    defaultSystemPrompt,
    RESOLUTIONS,
    PALETTE_SIZES,
    autoSaveToProject,
    activeProjectName,
    availableModels,
    showModelManager,
    refreshModels,
    run,
    canvasStyle
  };
}
