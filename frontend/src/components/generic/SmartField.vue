<template>
  <BaseField
    :label="type !== 'checkbox' ? label : undefined"
    :id="fieldId"
    :error="error"
    :help="help"
    :required="required"
  >
    <!-- Select -->
    <select
      v-if="type === 'select'"
      :id="fieldId"
      :value="modelValue"
      @change="updateValue($event)"
      :required="required"
      :disabled="disabled"
      class="smart-input"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <!-- Textarea -->
    <textarea
      v-else-if="type === 'textarea'"
      :id="fieldId"
      :value="String(modelValue ?? '')"
      @input="updateValue($event)"
      :rows="rows"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="smart-input"
    ></textarea>

    <!-- Checkbox -->
    <div v-else-if="type === 'checkbox'" class="checkbox-wrapper">
      <input
        type="checkbox"
        :id="fieldId"
        :checked="!!modelValue"
        @change="updateChecked($event)"
        :disabled="disabled"
        class="smart-checkbox"
      />
      <label v-if="label" :for="fieldId" class="checkbox-label">{{ label }}</label>
    </div>

    <!-- Standard Input -->
    <input
      v-else
      :type="type"
      :id="fieldId"
      :value="modelValue"
      @input="updateValue($event)"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      class="smart-input"
    />
  </BaseField>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseField from './BaseField.vue';

const props = withDefaults(defineProps<{
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
}>(), {
  type: 'text',
  rows: 3,
});

const emit = defineEmits(['update:modelValue']);

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
</script>

<style scoped>
.smart-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-sizing: border-box;
}

.smart-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.smart-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  color: #9ca3af;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.smart-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.checkbox-label {
  font-weight: normal;
  margin: 0;
  cursor: pointer;
  user-select: none;
}
</style>
