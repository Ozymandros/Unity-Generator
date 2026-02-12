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
defineProps<{
  label?: string;
  id?: string;
  error?: string;
  help?: string;
  required?: boolean;
}>();
</script>

<style scoped>
.field-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.field-label {
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: #374151;
  font-size: 0.95rem;
}

.required {
  color: #dc2626;
  margin-left: 0.25rem;
}

.field-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.35rem;
  margin-bottom: 0;
}

.field-help {
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 0.35rem;
  margin-bottom: 0;
}
</style>
