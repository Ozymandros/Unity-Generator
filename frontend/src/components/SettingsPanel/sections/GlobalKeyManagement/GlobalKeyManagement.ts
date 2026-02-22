import { ref, onMounted, reactive, computed } from 'vue';
import { listApiKeys, saveApiKey, deleteApiKey } from '@/api/client';

export function useGlobalKeyManagement() {
  const apiKeys = ref<Record<string, string>>({});
  const isLoading = ref(false);
  const status = ref<string | null>(null);
  const showAddDialog = ref(false);
  
  const newKey = reactive({
    name: '',
    value: ''
  });

  const loadKeys = async () => {
    isLoading.value = true;
    try {
      apiKeys.value = await listApiKeys();
    } catch (e) {
      console.error(e);
      status.value = "Failed to load keys";
    } finally {
      isLoading.value = false;
    }
  };

  const handleSave = async () => {
    if (!newKey.name || !newKey.value) return;
    try {
      const result = await saveApiKey(newKey.name, newKey.value);
      if (result.success) {
        newKey.name = '';
        newKey.value = '';
        showAddDialog.value = false;
        status.value = "Global key securely stored.";
        await loadKeys();
      } else {
        status.value = "Save failed: " + result.error;
      }
    } catch (e) {
      console.error(e);
      status.value = "Failed to save key";
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Permanently remove key for '${name}'?`)) return;
    try {
      await deleteApiKey(name);
      status.value = "Key removed from workspace.";
      await loadKeys();
    } catch (e) {
      console.error(e);
      status.value = "Deletion failed";
    }
  };

  const formattedKeys = computed(() => {
    return Object.entries(apiKeys.value).map(([name, value]) => ({
      name,
      status: value ? `••••••••${value.slice(-4)}` : 'No value'
    }));
  });

  onMounted(loadKeys);

  return {
    apiKeys,
    isLoading,
    status,
    showAddDialog,
    newKey,
    handleSave,
    handleDelete,
    formattedKeys
  };
}
