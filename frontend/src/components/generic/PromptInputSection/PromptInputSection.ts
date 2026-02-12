import { ref, watch } from "vue";

export interface PromptInputSectionProps {
  label: string;
  type: string;
  modelValue: string;
  provider: string;
  providers?: Array<{ label: string; value: string }>;
  options?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function usePromptInputSection(props: PromptInputSectionProps, emit: {
  (e: 'update:modelValue', value: string): void;
  (e: 'update:provider', value: string): void;
  (e: 'update:options', value: Record<string, any>): void; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  const localPrompt = ref(props.modelValue);
  const localProvider = ref(props.provider);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const localOptions = ref<Record<string, any>>({ ...(props.options || {}) });

  watch(() => props.modelValue, v => (localPrompt.value = v));
  watch(localPrompt, v => emit("update:modelValue", v));
  
  watch(() => props.provider, v => (localProvider.value = v));
  watch(localProvider, v => emit("update:provider", v));
  
  watch(() => props.options, v => (localOptions.value = { ...(v || {}) }));
  watch(localOptions, v => emit("update:options", v));

  function updateOptions(newOpts: Record<string, any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
    localOptions.value = { ...localOptions.value, ...newOpts };
  }

  return {
    localPrompt,
    localProvider,
    localOptions,
    updateOptions
  };
}
