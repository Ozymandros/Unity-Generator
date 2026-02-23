import { ref, onMounted, reactive, watch } from 'vue';
import { 
  listProviders, listModels, addModel, removeModel,
  ProviderCapabilities, ModelEntry
} from '@/api/client';

export function useModelManagement() {
  const providers = ref<ProviderCapabilities[]>([]);
  const selectedProviderName = ref<string | null>(null);
  const models = ref<ModelEntry[]>([]);

  const isLoading = ref(false);
  const status = ref<string | null>(null);

  const newModel = reactive({
    value: '',
    label: '',
    modality: 'llm'
  });

  const modelModalities = ['llm', 'image', 'audio', 'video', 'sprite', 'text', 'code'];

  const loadProviders = async () => {
    try {
      providers.value = await listProviders();
      if (providers.value.length > 0 && !selectedProviderName.value) {
        selectedProviderName.value = providers.value[0].name;
      }
    } catch (e) {
      console.error(e);
      status.value = "Failed to load providers";
    }
  };

  const loadModels = async () => {
    if (!selectedProviderName.value) return;
    isLoading.value = true;
    try {
      models.value = await listModels(selectedProviderName.value);
    } catch (e) {
      console.error(e);
      status.value = "Failed to load models";
    } finally {
      isLoading.value = false;
    }
  };

  const handleAdd = async () => {
    if (!selectedProviderName.value || !newModel.value || !newModel.label) {
      status.value = "Please fill in all model details";
      return;
    }

    try {
      const result = await addModel(selectedProviderName.value, newModel.value, newModel.label, newModel.modality);
      if (result.success) {
        newModel.value = '';
        newModel.label = '';
        status.value = "Model registered successfully.";
        await loadModels();
      } else {
        status.value = "Failed: " + result.error;
      }
    } catch (e) {
      console.error(e);
      status.value = "Failed to add model";
    }
  };

  const handleRemove = async (modelValue: string) => {
    if (!selectedProviderName.value) return;
    try {
      await removeModel(selectedProviderName.value, modelValue);
      status.value = "Model deregistered.";
      await loadModels();
    } catch (e) {
      console.error(e);
      status.value = "Failed to remove model";
    }
  };

  watch(selectedProviderName, loadModels);

  onMounted(loadProviders);

  return {
    providers,
    selectedProviderName,
    models,
    isLoading,
    status,
    newModel,
    modelModalities,
    handleAdd,
    handleRemove
  };
}
