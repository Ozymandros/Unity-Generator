import { ref, onMounted } from 'vue';
import { 
  listProviders, saveProvider, deleteProvider,
  getApiKey,
  ProviderCapabilities
} from '@/api/client';

export function useProviderManagement() {
  const providers = ref<ProviderCapabilities[]>([]);
  const selectedProvider = ref<(ProviderCapabilities & { api_key_value?: string }) | null>(null);
  const isLoading = ref(false);
  const status = ref<string | null>(null);

  const modelModalities = ['llm', 'image', 'audio', 'video', 'sprite', 'text', 'code'];

  const loadProviders = async () => {
    isLoading.value = true;
    try {
      providers.value = await listProviders();
    } catch (e) {
      console.error(e);
      status.value = "Failed to load providers";
    } finally {
      isLoading.value = false;
    }
  };

  const selectProvider = async (p: ProviderCapabilities) => {
    isLoading.value = true;
    try {
      // Deep clone to avoid mutating the list item directly
      const baseCaps = JSON.parse(JSON.stringify(p));
      
      // Fetch associated API key value
      let apiKeyValue = '';
      if (p.api_key_name) {
        apiKeyValue = await getApiKey(p.api_key_name) || '';
      } else if (p.requires_api_key) {
        apiKeyValue = await getApiKey(p.name) || '';
      }

      selectedProvider.value = { 
        ...baseCaps, 
        api_key_value: apiKeyValue 
      };
    } catch (e) {
      console.error(e);
      status.value = "Error loading provider details";
    } finally {
      isLoading.value = false;
    }
  };

  const saveSelected = async () => {
    if (!selectedProvider.value) return;
    
    isLoading.value = true;
    try {
      const result = await saveProvider(selectedProvider.value);
      if (result.success) {
        status.value = "Provider configuration saved.";
        await loadProviders();
        // Update selection if it was a new provider to get its updated state from list
        if (!selectedProvider.value.name) {
             selectedProvider.value = null;
        } else {
             const updated = providers.value.find(pr => pr.name === selectedProvider.value?.name);
             if (updated) await selectProvider(updated);
        }
      } else {
        status.value = "Save failed: " + (result.error || "Unknown error");
      }
    } catch (e) {
      console.error(e);
      status.value = "Network error while saving provider";
    } finally {
      isLoading.value = false;
      setTimeout(() => status.value = null, 3000);
    }
  };

  const deleteSelected = async () => {
    if (!selectedProvider.value || !confirm(`Delete provider '${selectedProvider.value.name}'?`)) return;
    
    isLoading.value = true;
    try {
      await deleteProvider(selectedProvider.value.name);
      selectedProvider.value = null;
      await loadProviders();
      status.value = "Provider deleted.";
    } catch (e) {
      console.error(e);
      status.value = "Failed to delete provider";
    } finally {
      isLoading.value = false;
      setTimeout(() => status.value = null, 3000);
    }
  };

  const initiateAdd = () => {
    selectedProvider.value = {
      name: '',
      api_key_name: '',
      api_key_value: '',
      base_url: '',
      openai_compatible: true,
      requires_api_key: true,
      supports_vision: false,
      supports_streaming: true,
      supports_function_calling: false,
      supports_tool_use: false,
      modalities: ['llm'],
      default_models: {},
      extra: {}
    };
  };

  onMounted(loadProviders);

  return {
    providers,
    selectedProvider,
    isLoading,
    status,
    saveSelected,
    deleteSelected,
    initiateAdd,
    selectProvider,
    modelModalities
  };
}
