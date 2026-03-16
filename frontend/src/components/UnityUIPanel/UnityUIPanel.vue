<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import { useUnityUIPanel } from "./UnityUIPanel";
import type { UIQuickAction } from "./UnityUIPanel";

const { t } = useI18n();

const {
  prompt,
  provider,
  model,
  temperature,
  apiKey,
  systemPrompt,
  defaultSystemPrompt,
  uiSystem,
  elementType,
  outputFormat,
  anchorPreset,
  colorTheme,
  includeAnimations,
  availableModels,
  showModelManager,
  refreshModels,
  status,
  tone,
  result,
  loading,
  canGenerate,
  run,
  providerOptions,
  TEMPERATURE_PRESETS,
  UI_QUICK_ACTIONS,
  UI_EXAMPLE_PROMPTS,
  UI_ELEMENT_TYPES,
} = useUnityUIPanel();

const uiSystemOptions = [
  { value: "ugui", label: "uGUI (Canvas)" },
  { value: "uitoolkit", label: "UI Toolkit (UXML/USS)" },
];

const outputFormatOptions = [
  { value: "script", label: "C# Script only" },
  { value: "prefab_yaml", label: "Prefab YAML only" },
  { value: "both", label: "Script + Prefab YAML" },
];

const anchorPresetOptions = [
  { value: "", label: "None (let LLM decide)" },
  { value: "full_screen", label: "Full Screen (stretch)" },
  { value: "top_left", label: "Top Left" },
  { value: "center", label: "Center" },
  { value: "stretch", label: "Stretch Horizontal" },
];

/**
 * Handle quick action chip click — injects the chip's template prompt.
 *
 * @param action - The quick action that was clicked.
 *
 * @example
 * ```typescript
 * handleQuickActionClick(UI_QUICK_ACTIONS[0]);
 * // prompt.value is now the health bar template
 * ```
 */
function handleQuickActionClick(action: UIQuickAction): void {
  if (!action?.prompt) return;
  prompt.value = action.prompt;
  elementType.value = action.elementType;
}
</script>

<template>
  <div class="panel">
    <div class="header">
      <h2>{{ t('unityUi.title') }}</h2>
      <p class="subtitle">{{ t('unityUi.subtitle') }}</p>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <div class="quick-actions mb-4">
      <h3 class="text-subtitle-2 mb-2">{{ t('unityPhysics.quickActions') }}</h3>
      <v-chip-group>
        <v-chip v-for="action in UI_QUICK_ACTIONS" :key="action.elementType" :prepend-icon="action.icon"
          variant="outlined" color="primary" class="ma-1" @click="handleQuickActionClick(action)">
          {{ action.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <div class="d-flex gap-3 mb-4">
      <SmartField :label="t('unityUi.fields.uiSystem')" type="select" v-model="uiSystem" :options="uiSystemOptions" class="flex-grow-1" />
      <SmartField :label="t('unityUi.fields.elementType')" type="select" v-model="elementType" :options="UI_ELEMENT_TYPES" class="flex-grow-1" />
    </div>

    <SmartField :label="t('unityUi.fields.prompt')" type="textarea" v-model="prompt" :rows="4"
      placeholder="Describe the UI element you want to generate..." />

    <div class="d-flex gap-3 mb-4">
      <v-expansion-panels class="mb-4">
        <v-expansion-panel :title="t('common.examplePrompts')" bg-color="surface">
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item v-for="example in UI_EXAMPLE_PROMPTS" :key="example.text" class="cursor-pointer"
                @click="prompt = example.text">
                <v-list-item-title class="text-caption">{{ example.text }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <div class="d-flex gap-3 mb-4">
      <SmartField :label="t('unityUi.fields.outputFormat')" type="select" v-model="outputFormat" :options="outputFormatOptions" class="flex-grow-1" />
      <SmartField :label="t('unityUi.fields.anchorPreset')" type="select" v-model="anchorPreset" :options="anchorPresetOptions" class="flex-grow-1" />
    </div>

    <div class="d-flex align-center gap-3 mb-4">
      <SmartField :label="t('unityUi.fields.colourTheme')" type="text" v-model="colorTheme"
        placeholder="e.g. dark blue, gold accents" class="flex-grow-1" />
      <v-checkbox v-model="includeAnimations" :label="t('unityUi.fields.includeAnimations')"
        color="primary" hide-details class="mt-1 flex-shrink-0" />
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

    <v-btn color="primary" size="large" rounded="pill" block prepend-icon="mdi-palette-outline"
      :loading="loading" :disabled="!canGenerate" class="mb-8" @click="run">
      {{ t('unityUi.actions.generate') }}
    </v-btn>

    <v-fade-transition>
      <div v-if="result" class="results">
        <h3 class="text-h6 font-weight-bold mb-4">{{ t('common.result') }}</h3>

        <v-card
          v-if="result.content"
          variant="outlined"
          class="pa-4 bg-on-background rounded-lg mb-4 text-white"
        >
          <p class="text-body-2" style="white-space: pre-wrap; font-family: 'JetBrains Mono', monospace;">
            {{ result.content }}
          </p>
        </v-card>

        <div v-if="result.files && result.files.length > 0" class="files-list mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">{{ t('common.createdFiles') }}</h4>
          <v-list density="compact" class="bg-transparent text-white">
            <v-list-item v-for="file in result.files" :key="file" prepend-icon="mdi-file-outline">
              <v-list-item-title class="text-caption">{{ file }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <div v-if="result.metadata?.steps?.length" class="steps-list">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              :title="t('common.viewSteps', { n: result.metadata.steps.length })"
              bg-color="surface"
              elevation="0"
              class="border rounded-lg"
            >
              <v-expansion-panel-text>
                <v-list density="compact" class="bg-transparent text-white">
                  <v-list-item v-for="(step, index) in result.metadata.steps" :key="index">
                    <template v-slot:prepend>
                      <v-badge color="primary" :content="index + 1" inline />
                    </template>
                    <v-list-item-title class="text-caption ml-4">{{ step }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>
    </v-fade-transition>

    <ModelManagerModal
      v-if="showModelManager"
      :provider="provider"
      v-model="showModelManager"
      @models-changed="refreshModels"
    />
  </div>
</template>

<style scoped>
.panel {
  max-width: 820px;
  margin: 1rem;
}

.header {
  margin-bottom: 20px;
}

h2 {
  margin: 0 0 6px;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95em;
}

.field-group {
  margin-bottom: 12px;
}

.options-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.results {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
