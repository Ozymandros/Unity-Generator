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
import SmartField from "../SmartField/SmartField.vue";
import { usePromptInputSection, type PromptInputSectionProps } from "./PromptInputSection";

const props = defineProps<PromptInputSectionProps>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:provider', value: string): void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (e: 'update:options', value: Record<string, any>): void;
}>();

const { localPrompt, localProvider, localOptions, updateOptions } = usePromptInputSection(props, emit);
</script>

<style scoped src="./PromptInputSection.css"></style>
