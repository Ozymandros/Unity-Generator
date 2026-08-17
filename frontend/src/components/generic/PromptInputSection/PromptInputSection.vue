<template>
  <v-card variant="flat" border class="pa-4 rounded-lg bg-surface mb-6">
    <div class="d-flex align-end gap-2">
      <SmartField 
        :label="label" 
        :id="`${type}-prompt`"
        type="textarea" 
        :model-value="localPrompt"
        @update:model-value="val => { localPrompt = String(val); emit('update:modelValue', String(val)); }"
        :rows="3"
        class="flex-grow-1"
      />
      <div class="d-flex flex-column gap-1 mb-1">
        <v-btn
          icon="mdi-auto-fix"
          size="small"
          variant="tonal"
          color="primary"
          :loading="wandLoading"
          :title="t('common.enhancePrompt')"
          @click="enhance(localPrompt)"
        />
        <v-btn
          icon="mdi-dice-multiple"
          size="small"
          variant="tonal"
          color="secondary"
          :loading="wandLoading"
          :title="t('common.samplePrompt')"
          @click="sample(localPrompt)"
        />
      </div>
    </div>
    <v-alert v-if="wandError" type="warning" density="compact" variant="tonal" class="mt-2">{{ wandError }}</v-alert>

    <SmartField 
      v-if="providers && providers.length"
      label="Provider"
      type="select"
      :model-value="localProvider"
      @update:model-value="val => { localProvider = String(val); emit('update:provider', String(val)); }"
      :options="providers"
      placeholder="Default"
      class="mt-4"
    />

    <div class="mt-4">
      <slot name="options" :options="localOptions" :updateOptions="updateOptions" />
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { SmartField } from "../SmartField";
import { usePromptInputSection, type PromptInputSectionProps } from "./PromptInputSection";
import { usePromptAssistWand } from "@/composables/usePromptAssistWand";

const { t } = useI18n();
const props = defineProps<PromptInputSectionProps>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:provider', value: string): void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (e: 'update:options', value: Record<string, any>): void;
}>();

const { localPrompt, localProvider, localOptions, updateOptions } = usePromptInputSection(props, emit);
const { loading: wandLoading, error: wandError, enhance, sample } = usePromptAssistWand((text) => {
  localPrompt.value = text;
  emit("update:modelValue", text);
});
</script>

<style scoped src="./PromptInputSection.css"></style>
