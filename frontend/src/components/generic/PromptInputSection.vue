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
import SmartField from "./SmartField.vue";
import { usePromptInputSection } from "./PromptInputSection";

const props = defineProps<{
  label: string;
  type: string;
  modelValue: string;
  provider: string;
  providers?: Array<{ label: string; value: string }>;
  options?: Record<string, any>;
}>();
const emit = defineEmits(["update:modelValue", "update:provider", "update:options"]);

const { localPrompt, localProvider, localOptions, updateOptions } = usePromptInputSection(props, emit);
</script>

<style scoped src="./PromptInputSection.css"></style>
