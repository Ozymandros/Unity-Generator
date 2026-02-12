import { computed } from 'vue';

export interface SmartFieldProps {
  modelValue: string | number | boolean | null | undefined;
  type?: 'text' | 'number' | 'password' | 'email' | 'textarea' | 'select' | 'checkbox';
  label?: string;
  id?: string;
  options?: { label: string; value: string | number | boolean | null }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  help?: string;
  rows?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

export type SmartFieldValue = string | number | boolean | null | undefined;

export function useSmartField(props: SmartFieldProps, emit: (event: 'update:modelValue', value: SmartFieldValue) => void) {
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
