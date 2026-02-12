<template>
  <div class="prompt-section">
    <SmartField 
      :label="label" 
      :id="`${type}-prompt`"
      type="textarea" 
      :model-value="localPrompt"
      @update:model-value="val => { localPrompt = String(val); emit('update:modelValue', String(val)); }"
      :rows="3" 
    />
    
    <SmartField 
      v-if="providers && providers.length"
      label="Provider"
      type="select"
      :model-value="localProvider"
      @update:model-value="val => { localProvider = String(val); emit('update:provider', String(val)); }"
      :options="providers"
      placeholder="Default"
    />

    <slot name="options" :options="localOptions" :updateOptions="updateOptions" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRefs } from "vue";
import SmartField from "./SmartField.vue";

const props = defineProps<{
  label: string;
  type: string;
  modelValue: string;
  provider: string;
  providers?: Array<{ label: string; value: string }>;
  options?: Record<string, any>;
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

function updateOptions(newOpts: Record<string, any>) {
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
