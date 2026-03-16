import { ref, onMounted } from 'vue';
import { listSystemPrompts, saveSystemPrompt, resetSystemPrompts } from '@/api/client';

export function usePromptManagement() {
  const prompts = ref<Record<string, string>>({});
  const promptModalities = ['code', 'text', 'image', 'audio', 'music', 'video', 'sprite', 'unity_ui', 'unity_physics'];
  const isLoading = ref(false);
  const isResetting = ref(false);
  const confirmResetDialog = ref(false);
  const status = ref<string | null>(null);

  const loadPrompts = async () => {
    isLoading.value = true;
    try {
      const prList = await listSystemPrompts();
      const initializedPrompts: Record<string, string> = {};
      promptModalities.forEach(m => {
        initializedPrompts[m] = prList[m] || '';
      });
      prompts.value = initializedPrompts;
    } catch (e) {
      console.error(e);
      status.value = "Failed to load system prompts";
    } finally {
      isLoading.value = false;
    }
  };

  const handleSave = async (modality: string) => {
    try {
      const result = await saveSystemPrompt(modality, prompts.value[modality]);
      if (result.success) {
        status.value = `${modality.toUpperCase()} prompt updated.`;
      } else {
        status.value = "Save failed: " + result.error;
      }
    } catch (e) {
      console.error(e);
      status.value = `Failed to save ${modality} prompt`;
    } finally {
      setTimeout(() => status.value = null, 3000);
    }
  };

  const handleResetAll = async () => {
    confirmResetDialog.value = false;
    isResetting.value = true;
    try {
      const defaults = await resetSystemPrompts();
      promptModalities.forEach(m => {
        if (defaults[m]) prompts.value[m] = defaults[m];
      });
      status.value = "All prompts reset to defaults.";
    } catch (e) {
      console.error(e);
      status.value = "Failed to reset prompts";
    } finally {
      isResetting.value = false;
      setTimeout(() => (status.value = null), 3000);
    }
  };

  onMounted(loadPrompts);

  return {
    prompts,
    promptModalities,
    isLoading,
    isResetting,
    confirmResetDialog,
    status,
    handleSave,
    handleResetAll,
    loadPrompts,
  };
}
