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
import { BaseField } from "@/components/generic/BaseField";
import { useSmartField, type SmartFieldProps, type SmartFieldValue } from './SmartField';

const props = withDefaults(defineProps<SmartFieldProps>(), {
  type: 'text',
  rows: 3,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: SmartFieldValue): void;
}>();

const { fieldId, updateValue, updateChecked } = useSmartField(props, emit);
</script>

<style scoped src="./SmartField.css"></style>
