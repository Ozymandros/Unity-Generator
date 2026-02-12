<template>
  <div class="field-wrapper">
    <label v-if="label" :for="id" class="field-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="field-control">
      <slot :id="id" />
    </div>
    <p v-if="error" class="field-error">{{ error }}</p>
    <p v-if="help" class="field-help">{{ help }}</p>
  </div>
</template>

<script setup lang="ts">
import { useBaseField } from "./BaseField";

defineProps<{
  label?: string;
  id?: string;
  error?: string;
  help?: string;
  required?: boolean;
}>();

useBaseField();
</script>

<style scoped src="./BaseField.css"></style>
