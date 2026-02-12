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
import BaseField from './BaseField.vue';
import { useSmartField } from './SmartField';

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

const { fieldId, updateValue, updateChecked } = useSmartField(props, emit);
</script>

<style scoped src="./SmartField.css"></style>
