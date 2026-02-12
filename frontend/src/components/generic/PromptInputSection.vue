<template>
  <div class="prompt-section">
    <div class="field">
      <label :for="`${type}-prompt`">{{ label }}</label>
      <textarea :id="`${type}-prompt`" v-model="localPrompt" rows="3" />
    </div>
    <div class="field" v-if="providers && providers.length">
      <label :for="`${type}-provider`">Provider</label>
      <select :id="`${type}-provider`" v-model="localProvider">
        <option value="">Default</option>
        <option v-for="p in providers" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
    </div>
    <slot name="options" :options="localOptions" :updateOptions="updateOptions" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRefs } from "vue";

const props = defineProps<{
  label: string;
  type: string;
  modelValue: string;
  provider: string;
  providers?: Array<{ label: string; value: string }>;
  options?: Record<string, unknown>;
}>();
const emit = defineEmits(["update:modelValue", "update:provider", "update:options"]);

const { modelValue, provider, options } = toRefs(props);
const localPrompt = ref(modelValue.value);
const localProvider = ref(provider.value);
const localOptions = ref({ ...(options?.value || {}) });

watch(modelValue, v => (localPrompt.value = v));
watch(localPrompt, v => emit("update:modelValue", v));
watch(provider, v => (localProvider.value = v));
watch(localProvider, v => emit("update:provider", v));
watch(options, v => (localOptions.value = { ...(v || {}) }));
watch(localOptions, v => emit("update:options", v));

function updateOptions(newOpts: Record<string, unknown>) {
  localOptions.value = { ...localOptions.value, ...newOpts };
}
</script>

<style scoped>
.prompt-section {
  margin-bottom: 1.5em;
}
.field {
  margin-bottom: 0.5em;
}
</style>
