<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import type { UnityMcpModalityConfig } from "@/constants/unityMcpModalityConfigs";
import { useUnityMcpModalityPanel } from "@/composables/useUnityMcpModalityPanel";

const props = defineProps<{
  config: UnityMcpModalityConfig;
  generateIcon?: string;
}>();

const { t } = useI18n();
const {
  config,
  prompt,
  provider,
  model,
  temperature,
  apiKey,
  systemPrompt,
  defaultSystemPrompt,
  mcpAvailable,
  editorAvailable,
  mcpWarning,
  applyViaMcp,
  availableModels,
  showModelManager,
  refreshModels,
  status,
  tone,
  result,
  loading,
  canGenerate,
  run,
  handleQuickActionClick,
  providerOptions,
  TEMPERATURE_PRESETS,
} = useUnityMcpModalityPanel(props.config);
</script>

<template>
  <div class="panel">
    <div class="header">
      <h2>{{ t(`${config.i18nPrefix}.title`) }}</h2>
      <p class="subtitle">{{ t(`${config.i18nPrefix}.subtitle`) }}</p>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <v-alert v-if="mcpWarning" type="warning" variant="tonal" class="mb-4" icon="mdi-unity">
      {{ mcpWarning }}
    </v-alert>
    <v-alert v-else-if="mcpAvailable" type="success" variant="tonal" class="mb-4" icon="mdi-unity">
      {{ editorAvailable ? t(`${config.i18nPrefix}.mcpLiveEditor`) : t(`${config.i18nPrefix}.mcpLiveFileOnly`) }}
    </v-alert>

    <div class="quick-actions mb-4">
      <h3 class="text-subtitle-2 mb-2">{{ t(`${config.i18nPrefix}.quickActions`) }}</h3>
      <v-chip-group>
        <v-chip
          v-for="action in config.quickActions"
          :key="action.label"
          :prepend-icon="action.icon"
          variant="outlined"
          color="primary"
          class="ma-1"
          @click="handleQuickActionClick(action)"
        >
          {{ action.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <v-expansion-panels class="mb-4">
      <v-expansion-panel :title="t('common.examplePrompts')" bg-color="surface">
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item
              v-for="example in config.examplePrompts"
              :key="example.text"
              class="cursor-pointer"
              rounded="lg"
              @click="prompt = example.text"
            >
              <v-list-item-title class="text-caption">{{ example.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <SmartField
      :label="t('common.prompt')"
      type="textarea"
      v-model="prompt"
      :rows="4"
      :placeholder="t(`${config.i18nPrefix}.promptPlaceholder`)"
    />

    <div class="d-flex gap-4 mb-4 flex-wrap">
      <v-checkbox
        v-model="applyViaMcp"
        :label="t(`${config.i18nPrefix}.applyViaMcp`)"
        :disabled="!mcpAvailable"
        color="primary"
        hide-details
      />
    </div>

    <div class="field-group">
      <div class="options-row d-flex align-center gap-2 mb-4">
        <SmartField :label="t('common.provider')" type="select" v-model="provider" :options="providerOptions"
          :placeholder="t('common.selectProvider')" class="flex-grow-1" />
        <SmartField :label="t('common.model')" type="select" v-model="model" :options="availableModels"
          :placeholder="t('common.selectModel')" :disabled="!provider" class="flex-grow-1" />
        <v-btn icon="mdi-plus" size="small" variant="tonal" color="primary" class="mt-7" :disabled="!provider"
          :title="t('common.manageModels')" @click="showModelManager = true" />
      </div>

      <div class="mb-6">
        <SmartField :label="t('common.temperature')" type="select" v-model.number="temperature" :options="TEMPERATURE_PRESETS" />
      </div>

      <v-expansion-panels class="mb-6">
        <v-expansion-panel :title="t('common.advancedOptions')" bg-color="surface" class="border rounded-lg" elevation="0">
          <v-expansion-panel-text class="pa-4">
            <SmartField :label="t('common.apiKey')" type="password" v-model="apiKey" :placeholder="t('common.leaveEmptyForGlobalKey')" />
            <SmartField :label="t('common.systemPrompt')" type="textarea" v-model="systemPrompt" :placeholder="defaultSystemPrompt" :rows="3" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <v-btn color="primary" size="large" rounded="pill" block :prepend-icon="generateIcon || 'mdi-unity'"
      :loading="loading" :disabled="!canGenerate" class="mb-8" @click="run">
      {{ t(`${config.i18nPrefix}.actions.generate`) }}
    </v-btn>

    <v-fade-transition>
      <div v-if="result" class="results">
        <h3 class="text-h6 font-weight-bold mb-4">{{ t('common.result') }}</h3>
        <v-card v-if="result.content" variant="outlined" class="pa-4 bg-on-background rounded-lg mb-4 text-white">
          <p class="text-body-2" style="white-space: pre-wrap; font-family: 'JetBrains Mono', monospace;">
            {{ result.content }}
          </p>
        </v-card>
        <div v-if="result.files?.length" class="files-list mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">{{ t('common.createdFiles') }}</h4>
          <v-list density="compact" class="bg-transparent text-white">
            <v-list-item v-for="file in result.files" :key="file" prepend-icon="mdi-file-outline">
              <v-list-item-title class="text-caption">{{ file }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </div>
    </v-fade-transition>

    <ModelManagerModal v-if="showModelManager" :provider="provider" v-model="showModelManager" @models-changed="refreshModels" />
  </div>
</template>

<style scoped>
.panel { padding: 1.5rem; max-width: 960px; margin: 0 auto; }
.subtitle { opacity: 0.7; margin-bottom: 1rem; }
</style>
