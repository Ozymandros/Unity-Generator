<script setup lang="ts">

import { StatusBanner } from "./StatusBanner";
import { SmartField } from "./generic/SmartField";
import { ModelManagerModal } from "./generic/ModelManagerModal";
import { useScenesPanel } from "./ScenesPanel";
import { QUICK_ACTIONS, EXAMPLE_PROMPTS, type QuickAction } from "@/constants/unityPrompts";

const {
  prompt,
  provider,
  model,
  temperature,
  apiKey,
  systemPrompt,
  defaultSystemPrompt,
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
  pendingMediaImport,
  hasPendingMediaImport
} = useScenesPanel();

/**
 * Handle quick action button click by injecting prompt into input field.
 * Allows users to quickly start with pre-written prompts for common Unity tasks.
 * 
 * @param action - The quick action to execute
 * @throws {Error} If action or action.prompt is invalid
 * 
 * @example
 * ```typescript
 * const fpsAction: QuickAction = {
 *   label: "FPS Prototype",
 *   icon: "mdi-pistol",
 *   prompt: "Create a complete FPS prototype...",
 *   category: "prototype"
 * };
 * handleQuickActionClick(fpsAction);
 * // prompt.value now contains the FPS prototype prompt text
 * ```
 */
function handleQuickActionClick(action: QuickAction): void {
  if (!action || !action.prompt) {
    throw new Error("Invalid quick action: action and action.prompt are required");
  }
  
  // Inject prompt into input field
  prompt.value = action.prompt;
  
  // Log analytics event
  console.log(`Quick action used: ${action.label} (${action.category})`);
}

/**
 * Get a random example prompt for placeholder text.
 * Provides variety and inspiration by showing different capabilities each time.
 * 
 * @returns Random example prompt text from EXAMPLE_PROMPTS array
 * 
 * @example
 * ```typescript
 * const placeholder = getRandomExamplePrompt();
 * // Returns: "Create a scene with a red cube, blue sphere, and directional light"
 * // or any other random example from the array
 * ```
 */
function getRandomExamplePrompt(): string {
  const randomIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
  return EXAMPLE_PROMPTS[randomIndex].text;
}
</script>

<template>
  <div class="panel">
    <div class="header">
      <h2>Unity Scene Creator</h2>
      <p class="subtitle">Describe your scene and let the AI build it in Unity.</p>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <!-- Media Import Info Banner -->
    <v-alert
      v-if="hasPendingMediaImport()"
      type="info"
      variant="tonal"
      class="mb-4"
      icon="mdi-import"
      closable
    >
      <template v-slot:title>Media Ready to Import</template>
      <template v-slot:text>
        {{ pendingMediaImport?.type === 'image' ? 'Image' : 'Audio' }} "{{ pendingMediaImport?.name }}" is ready to be imported to Unity. 
        Review the prompt below and click "Generate Scene" to proceed.
      </template>
    </v-alert>

    <!-- Quick Actions Section -->
    <div class="quick-actions mb-4">
      <h3 class="text-subtitle-2 mb-2">Quick Actions</h3>
      <v-chip-group>
        <v-chip
          v-for="action in QUICK_ACTIONS"
          :key="action.label"
          :prepend-icon="action.icon"
          @click="handleQuickActionClick(action)"
          variant="outlined"
          color="primary"
          class="ma-1"
        >
          {{ action.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <SmartField label="Scene Description" type="textarea" v-model="prompt" :rows="4"
      :placeholder="getRandomExamplePrompt()" />

    <!-- Example Prompts Section -->
    <v-expansion-panels class="mb-4">
      <v-expansion-panel title="Example Prompts" bg-color="surface">
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item
              v-for="example in EXAMPLE_PROMPTS"
              :key="example.text"
              @click="prompt = example.text"
              class="cursor-pointer hover:bg-surface-variant"
            >
              <v-list-item-title class="text-caption">
                {{ example.text }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div class="field-group">
      <div class="options-row d-flex align-center gap-2 mb-4">
        <SmartField label="Provider" type="select" v-model="provider" :options="providerOptions"
          placeholder="Select Provider" class="flex-grow-1" />
        <SmartField label="Model" type="select" v-model="model" :options="availableModels" placeholder="Select Model"
          :disabled="!provider" class="flex-grow-1" />
        <v-btn
          icon="mdi-plus"
          size="small"
          variant="tonal"
          color="primary"
          class="mt-7"
          @click="showModelManager = true"
          :disabled="!provider"
          title="Manage models"
        ></v-btn>
      </div>

      <div class="mb-6">
        <SmartField label="Temperature" type="select" v-model.number="temperature" :options="TEMPERATURE_PRESETS" />
      </div>

      <v-expansion-panels class="mb-6">
        <v-expansion-panel
          title="Advanced Options"
          bg-color="surface"
          class="border rounded-lg"
          elevation="0"
        >
          <v-expansion-panel-text class="pa-4">
            <SmartField label="API Key (Optional Override)" type="password" v-model="apiKey"
              placeholder="Leave empty to use global key" />
            <SmartField label="System Prompt Override" type="textarea" v-model="systemPrompt"
              :placeholder="defaultSystemPrompt" :rows="3" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <v-btn
      color="primary"
      size="large"
      rounded="pill"
      block
      prepend-icon="mdi-auto-fix"
      :loading="loading"
      :disabled="!canGenerate"
      @click="run"
      class="mb-8"
    >
      Generate Scene
    </v-btn>

    <v-fade-transition>
      <div v-if="result" class="results">
        <h3 class="text-h6 font-weight-bold mb-4">Result</h3>
        <v-card v-if="result.content" variant="outlined" class="pa-4 bg-on-background rounded-lg mb-4 text-white">
          <p class="text-body-2" style="white-space: pre-wrap; font-family: 'JetBrains Mono', monospace;">{{ result.content }}</p>
        </v-card>

        <div v-if="result.files && result.files.length > 0" class="files-list mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">Created Files</h4>
          <v-list density="compact" class="bg-transparent text-white">
            <v-list-item v-for="file in result.files" :key="file" prepend-icon="mdi-file-outline">
              <v-list-item-title class="text-caption">{{ file }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <div v-if="result.metadata && result.metadata.steps && result.metadata.steps.length > 0" class="steps-list">
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
                      <v-badge color="primary" :content="index + 1" inline></v-badge>
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

/* Matching CodePanel.css structure */
.field-group {
  margin-bottom: 12px;
}

.options-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.field-item {
  flex: 1;
}

/* Ensure inputs verify box-sizing if not global */
textarea,
input,
select {
  box-sizing: border-box;
  width: 100%;
}

.primary {
  margin: 8px 0 14px;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
  width: 100%;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
}

.primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.results {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.result-content {
  background: #020617;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  white-space: pre-wrap;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.files-list ul,
.steps-list ul {
  list-style: disc;
  padding-left: 20px;
  color: #cbd5e1;
}

summary {
  cursor: pointer;
  font-weight: 500;
  color: #38bdf8;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
