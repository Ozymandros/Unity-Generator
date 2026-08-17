import { computed, ref, onMounted, watch } from "vue";
import { generateVideo } from "@/api/client";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useSessionProject } from "@/composables/useSessionProject";

/**
 * Composable for the Video generation panel.
 */
export function useVideoPanel() {
  const store = useIntelligenceStore();
  const { projectName } = useSessionProject();

  const prompt = ref("");
  const provider = ref("");
  const duration = ref(5);
  const resolution = ref("720p");
  const aspectRatio = ref("16:9");
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref<Record<string, unknown> | null>(null);
  const loading = ref(false);

  const providers = computed(() => store.getProvidersByModality("video"));
  const providerOptions = computed(() =>
    providers.value.map((p: { name: string }) => ({ value: p.name, label: p.name }))
  );
  const canGenerate = computed(() => prompt.value.trim().length > 0 && !loading.value);

  onMounted(async () => {
    await store.load();
    const preferred = store.getPreferredEngine("video");
    if (!provider.value) provider.value = preferred.provider;
  });

  watch(provider, () => {
    if (!provider.value && providerOptions.value.length) {
      provider.value = providerOptions.value[0].value;
    }
  });

  async function run(): Promise<void> {
    if (!prompt.value.trim()) {
      tone.value = "error";
      status.value = "Prompt cannot be empty";
      return;
    }
    loading.value = true;
    status.value = "Generating video...";
    tone.value = "ok";
    result.value = null;

    try {
      const response = await generateVideo({
        prompt: prompt.value,
        provider: provider.value || undefined,
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
        options: {
          duration: duration.value,
          resolution: resolution.value,
          aspect_ratio: aspectRatio.value,
        },
      });
      if (response.success && response.data) {
        status.value = "Video request completed.";
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
    prompt, provider, duration, resolution, aspectRatio,
    status, tone, result, loading, canGenerate, run, providerOptions,
  };
}
