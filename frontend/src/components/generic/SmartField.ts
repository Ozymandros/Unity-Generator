import { computed } from 'vue';

export function useSmartField(props: any, emit: any) {
  const fieldId = computed(() => props.id || `field-${Math.random().toString(36).substr(2, 9)}`);

  function updateValue(event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    let val: string | number | null = target.value;
    if (props.type === 'number') {
      val = val === '' ? null : Number(val);
    }
    emit('update:modelValue', val);
  }

  function updateChecked(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.checked);
  }

  return {
    fieldId,
    updateValue,
    updateChecked
  };
}
