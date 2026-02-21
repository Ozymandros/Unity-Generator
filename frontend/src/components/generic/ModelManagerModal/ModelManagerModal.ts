import { ref, watch } from "vue";
import {
  getProviderModels,
  addProviderModel,
  removeProviderModel,
  type ModelEntry,
} from "@/api/client";
import { TEXT_PROVIDERS, IMAGE_PROVIDERS, AUDIO_PROVIDERS } from "@/constants/providers";

export interface ModelManagerProps {
  provider: string;
  modelValue: boolean;
}

/**
 * Find a human-readable label for a provider value.
 */
function resolveProviderLabel(value: string): string {
  const all = [...TEXT_PROVIDERS, ...IMAGE_PROVIDERS, ...AUDIO_PROVIDERS];
  const match = all.find((p) => p.value === value);
  return match?.label ?? value;
}

export function useModelManager(
  props: ModelManagerProps,
  emit: {
    (e: "update:modelValue", value: boolean): void;
    (e: "models-changed"): void;
  },
) {
  const models = ref<ModelEntry[]>([]);
  const newValue = ref("");
  const newLabel = ref("");
  const loading = ref(false);
  const error = ref<string | null>(null);

  const providerLabel = ref(resolveProviderLabel(props.provider));

  async function loadModels() {
    if (!props.provider) return;
    loading.value = true;
    error.value = null;
    try {
      models.value = await getProviderModels(props.provider);
    } catch (err) {
      error.value = String(err);
    } finally {
      loading.value = false;
    }
  }

  async function handleAdd() {
    if (!newValue.value.trim() || !newLabel.value.trim()) return;
    error.value = null;
    try {
      const resp = await addProviderModel(
        props.provider,
        newValue.value.trim(),
        newLabel.value.trim(),
      );
      if (!resp.success) {
        error.value = resp.error ?? "Failed to add model";
        return;
      }
      newValue.value = "";
      newLabel.value = "";
      await loadModels();
      emit("models-changed");
    } catch (err) {
      error.value = String(err);
    }
  }

  async function handleRemove(modelValue: string) {
    error.value = null;
    try {
      await removeProviderModel(props.provider, modelValue);
      await loadModels();
      emit("models-changed");
    } catch (err) {
      error.value = String(err);
    }
  }

  function close() {
    emit("update:modelValue", false);
  }

  // Load on mount
  watch(
    () => props.provider,
    () => {
      providerLabel.value = resolveProviderLabel(props.provider);
      loadModels();
    },
    { immediate: true },
  );

  return {
    models,
    newValue,
    newLabel,
    loading,
    error,
    providerLabel,
    handleAdd,
    handleRemove,
    close,
  };
}
