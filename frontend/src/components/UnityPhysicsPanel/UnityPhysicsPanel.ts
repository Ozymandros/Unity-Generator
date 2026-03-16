import { computed, ref, onMounted, watch } from "vue";
import { generateUnityPhysics } from "@/api/client";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { TEMPERATURE_PRESETS } from "@/constants/providers";
import { PHYSICS_EXAMPLE_PROMPTS } from "@/constants/unityPhysicsPrompts";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import { useSessionProject } from "@/composables/useSessionProject";

export { PHYSICS_EXAMPLE_PROMPTS } from "@/constants/unityPhysicsPrompts";

export interface PhysicsAgentResult {
  content: string;
  files: string[];
  metadata?: {
    steps?: string[];
  };
}

export const PHYSICS_QUICK_ACTIONS = [
  { label: "Bouncy Ball", icon: "mdi-circle-outline", prompt: "Create a bouncy ball with realistic PhysX physics, high bounciness PhysicMaterial, and smooth sphere collider.", gravityPreset: "earth" },
  { label: "Zero-G Object", icon: "mdi-orbit", prompt: "Set up a floating object in zero gravity with drag-based movement and no gravity influence.", gravityPreset: "zero_g" },
  { label: "Platform Character", icon: "mdi-human-handsup", prompt: "Configure a platform game character controller with Rigidbody, CapsuleCollider, and ground detection.", gravityPreset: "earth" },
  { label: "Ragdoll Setup", icon: "mdi-human", prompt: "Generate a ragdoll physics setup with connected Rigidbodies, HingeJoints, and appropriate mass distribution.", gravityPreset: "earth" },
  { label: "Vehicle Physics", icon: "mdi-car-sports", prompt: "Set up a vehicle with WheelColliders, Rigidbody centre-of-mass adjustment, and suspension configuration.", gravityPreset: "earth" },
];

/**
 * Composable for the Unity Physics panel.
 *
 * Manages all reactive state and generation logic for creating Unity physics
 * configuration code via the /generate/unity-physics backend endpoint.
 *
 * @returns Reactive state and functions for the UnityPhysicsPanel component.
 *
 * @example
 * ```typescript
 * const { prompt, run, loading } = useUnityPhysicsPanel();
 * ```
 */
export function useUnityPhysicsPanel() {
  const store = useIntelligenceStore();
  const { projectName } = useSessionProject();

  // Core generation fields
  const prompt = ref("");
  const provider = ref("");
  const model = ref("");
  const temperature = ref(0.7);
  const apiKey = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: You are a senior Unity physics engineer...");

  // Physics-specific fields
  const physicsBackend = ref("physx");
  const simulationMode = ref("fixed_update");
  const gravityPreset = ref("");
  const includeRigidbody = ref(true);
  const includeColliders = ref(true);
  const includeLayers = ref(false);

  // Status / result
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref<PhysicsAgentResult | null>(null);
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
      console.error("Failed to load UnityPhysicsPanel state via store", e);
    }
  });

  // Reset model when provider changes and current model is no longer available
  watch(provider, () => {
    if (provider.value && !availableModels.value.some((m: { value: string }) => m.value === model.value)) {
      model.value = "";
    }
  });

  /**
   * Reload available models from the intelligence store.
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
   * Submit the physics generation request to the backend.
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
    status.value = "Generating physics configuration...";
    tone.value = "ok";
    result.value = null;

    try {
      const response = await generateUnityPhysics({
        prompt: prompt.value,
        provider: provider.value || undefined,
        api_key: apiKey.value || undefined,
        system_prompt: systemPrompt.value || undefined,
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
        physics_backend: physicsBackend.value,
        simulation_mode: simulationMode.value,
        gravity_preset: gravityPreset.value || undefined,
        include_rigidbody: includeRigidbody.value,
        include_colliders: includeColliders.value,
        include_layers: includeLayers.value,
        options: {
          model: model.value || undefined,
          temperature: temperature.value,
        },
      });

      if (response.success) {
        status.value = "Physics configuration generated successfully.";
        result.value = response.data as unknown as PhysicsAgentResult;
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
    // Physics-specific fields
    physicsBackend,
    simulationMode,
    gravityPreset,
    includeRigidbody,
    includeColliders,
    includeLayers,
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
    PHYSICS_QUICK_ACTIONS,
    PHYSICS_EXAMPLE_PROMPTS,
  };
}
