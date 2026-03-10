<template>
  <div class="smart-field-container">
    <!-- Select -->
    <v-select
      v-if="type === 'select'"
      :model-value="modelValue"
      @update:model-value="val => $emit('update:modelValue', val)"
      :items="options"
      item-title="label"
      item-value="value"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :error-messages="error"
      :hint="help"
      persistent-hint
      class="smart-field-v"
    ></v-select>

    <!-- Textarea -->
    <v-textarea
      v-else-if="type === 'textarea'"
      :model-value="String(modelValue ?? '')"
      @update:model-value="val => $emit('update:modelValue', val)"
      :label="label"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :error-messages="error"
      :hint="help"
      persistent-hint
      auto-grow
      class="smart-field-v"
    ></v-textarea>

    <!-- Checkbox -->
    <v-checkbox
      v-else-if="type === 'checkbox'"
      :model-value="!!modelValue"
      @update:model-value="val => $emit('update:modelValue', val)"
      :label="label"
      :disabled="disabled"
      :error-messages="error"
      :hint="help"
      persistent-hint
      hide-details="auto"
    ></v-checkbox>

    <!-- Standard Input -->
    <v-text-field
      v-else
      :type="type"
      :model-value="modelValue"
      @update:model-value="val => $emit('update:modelValue', val)"
      :label="label"
      :placeholder="placeholder"
      :disabled="disabled"
      :error-messages="error"
      :hint="help"
      persistent-hint
      :min="min"
      :max="max"
      :step="step"
      class="smart-field-v"
    ></v-text-field>
  </div>
</template>

<script setup lang="ts">
import { useSmartField, type SmartFieldProps, type SmartFieldValue } from './SmartField';

const props = withDefaults(defineProps<SmartFieldProps>(), {
  type: 'text',
  rows: 3,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: SmartFieldValue): void;
}>();

// We keep useSmartField if it provides internal logic, but we don't need updateValue/updateChecked for Vuetify's v-model
useSmartField(props, emit);
</script>

<style scoped src="./SmartField.css"></style>
