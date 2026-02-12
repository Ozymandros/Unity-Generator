import { ref, watch } from "vue";

export function usePromptInputSection(props: any, emit: any) {
  const localPrompt = ref(props.modelValue);
  const localProvider = ref(props.provider);
  const localOptions = ref({ ...(props.options || {}) });

  watch(() => props.modelValue, v => (localPrompt.value = v));
  watch(localPrompt, v => emit("update:modelValue", v));
  
  watch(() => props.provider, v => (localProvider.value = v));
  watch(localProvider, v => emit("update:provider", v));
  
  watch(() => props.options, v => (localOptions.value = { ...(v || {}) }));
  watch(localOptions, v => emit("update:options", v));

  function updateOptions(newOpts: Record<string, any>) {
    localOptions.value = { ...localOptions.value, ...newOpts };
  }

  return {
    localPrompt,
    localProvider,
    localOptions,
    updateOptions
  };
}
