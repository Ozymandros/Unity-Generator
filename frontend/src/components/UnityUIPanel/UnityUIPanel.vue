<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import { useUnityUIPanel } from "./UnityUIPanel";
import type { UIQuickAction } from "./UnityUIPanel";

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
      <h2>Unity UI Elements</h2>
      <p class="subtitle">Generate Unity UI prefabs — health bars, buttons, dialogue boxes, and more.</p>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <!-- Quick Actions -->
    <div class="quick-actions mb-4">
      <h3 class="text-subtitle-2 mb-2">Quick Actions</h3>
      <v-chip-group>
        <v-chip
          v-for="action in UI_QUICK_ACTIONS"
          :key="action.elementType"
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

    <!-- UI System + Element Type row -->
    <div class="d-flex gap-3 mb-4">
      <SmartField
        label="UI System"
        type="select"
        v-model="uiSystem"
        :options="uiSystemOptions"
        class="flex-grow-1"
      />
      <SmartField
        label="Element Type"
        type="select"
        v-model="elementType"
        :options="UI_ELEMENT_TYPES"
        class="flex-grow-1"
      />
    </div>

    <!-- Prompt textarea -->
    <SmartField
      label="UI Element Description"
      type="textarea"
      v-model="prompt"
      :rows="4"
      placeholder="Describe the UI element you want to generate..."
    />

    <!-- Example Prompts -->
    <div class="d-flex gap-3 mb-4">
      <v-expansion-panels class="mb-4">
        <v-expansion-panel title="Example Prompts" bg-color="surface">
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item
                v-for="example in UI_EXAMPLE_PROMPTS"
                :key="example.text"
                class="cursor-pointer"
                @click="prompt = example.text"
              >
                <v-list-item-title class="text-caption">{{ example.text }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Output options row -->
    <div class="d-flex gap-3 mb-4">
      <SmartField
        label="Output Format"
        type="select"
        v-model="outputFormat"
        :options="outputFormatOptions"
        class="flex-grow-1"
      />
      <SmartField
        label="Anchor Preset"
        type="select"
        v-model="anchorPreset"
        :options="anchorPresetOptions"
        class="flex-grow-1"
      />
    </div>

    <!-- Color theme + animation row -->
    <div class="d-flex align-center gap-3 mb-4">
      <SmartField
        label="Colour Theme (optional)"
        type="text"
        v-model="colorTheme"
        placeholder="e.g. dark blue, gold accents"
        class="flex-grow-1"
      />
      <v-checkbox
        v-model="includeAnimations"
        label="Include animations"
        color="primary"
        hide-details
        class="mt-1 flex-shrink-0"
      />
    </div>

    <!-- Provider / Model / Temperature -->
    <div class="field-group">
      <div class="options-row d-flex align-center gap-2 mb-4">
        <SmartField
          label="Provider"
          type="select"
          v-model="provider"
          :options="providerOptions"
          placeholder="Select Provider"
          class="flex-grow-1"
        />
        <SmartField
          label="Model"
          type="select"
          v-model="model"
          :options="availableModels"
          placeholder="Select Model"
          :disabled="!provider"
          class="flex-grow-1"
        />
        <v-btn
          icon="mdi-plus"
          size="small"
          variant="tonal"
          color="primary"
          class="mt-7"
          :disabled="!provider"
          title="Manage models"
          @click="showModelManager = true"
        />
      </div>

      <div class="mb-6">
        <SmartField label="Temperature" type="select" v-model.number="temperature" :options="TEMPERATURE_PRESETS" />
      </div>

      <v-expansion-panels class="mb-6">
        <v-expansion-panel title="Advanced Options" bg-color="surface" class="border rounded-lg" elevation="0">
          <v-expansion-panel-text class="pa-4">
            <SmartField
              label="API Key (Optional Override)"
              type="password"
              v-model="apiKey"
              placeholder="Leave empty to use global key"
            />
            <SmartField
              label="System Prompt Override"
              type="textarea"
              v-model="systemPrompt"
              :placeholder="defaultSystemPrompt"
              :rows="3"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <v-btn
      color="primary"
      size="large"
      rounded="pill"
      block
      prepend-icon="mdi-palette-outline"
      :loading="loading"
      :disabled="!canGenerate"
      class="mb-8"
      @click="run"
    >
      Generate UI Element
    </v-btn>

    <!-- Result -->
    <v-fade-transition>
      <div v-if="result" class="results">
        <h3 class="text-h6 font-weight-bold mb-4">Result</h3>

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
          <h4 class="text-subtitle-2 font-weight-bold mb-2">Created Files</h4>
          <v-list density="compact" class="bg-transparent text-white">
            <v-list-item v-for="file in result.files" :key="file" prepend-icon="mdi-file-outline">
              <v-list-item-title class="text-caption">{{ file }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <div v-if="result.metadata?.steps?.length" class="steps-list">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              :title="`View Steps (${result.metadata.steps.length})`"
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
