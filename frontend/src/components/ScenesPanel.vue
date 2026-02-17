<script setup lang="ts">

import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { useScenesPanel } from "./ScenesPanel";

const {
  prompt,
  provider,
  model,
  temperature,
  apiKey,
  systemPrompt,
  defaultSystemPrompt,
  availableModels,
  status,
  tone,
  result,
  loading,
  canGenerate,
  run,
  TEXT_PROVIDERS,
  TEMPERATURE_PRESETS
} = useScenesPanel();
</script>

<template>
  <div class="panel">
    <div class="header">
      <h2>Unity Scene Creator</h2>
      <p class="subtitle">Describe your scene and let the AI build it in Unity.</p>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <SmartField label="Scene Description" type="textarea" v-model="prompt" :rows="4"
      placeholder="e.g., Create a scene with a red cube at (0,0,0)..." />

    <div class="field-group">
      <div class="options-row">
        <SmartField label="Provider" type="select" v-model="provider" :options="TEXT_PROVIDERS"
          placeholder="Select Provider (Optional)" class="field-item" />
        <SmartField label="Model" type="select" v-model="model" :options="availableModels" placeholder="Select Model"
          :disabled="!provider" class="field-item" />
      </div>
      <div class="options-row">
        <SmartField label="Temperature" type="select" v-model.number="temperature" :options="TEMPERATURE_PRESETS"
          class="field-item" />
      </div>
      <div style="margin-top: 8px;">
        <SmartField label="API Key (Optional Override)" type="password" v-model="apiKey"
          placeholder="Leave empty to use global key" />
      </div>
      <div style="margin-top: 8px;">
        <details>
          <summary style="cursor: pointer; margin-bottom: 4px; font-size: 0.9em; user-select: none;">Advanced Options
          </summary>
          <SmartField label="System Prompt Override" type="textarea" v-model="systemPrompt"
            :placeholder="defaultSystemPrompt" :rows="3" />
        </details>
      </div>
    </div>

    <button class="primary" @click="run" :disabled="!canGenerate">
      <span v-if="loading" class="spinner"></span>
      <span v-else>Generate Scene</span>
    </button>

    <div v-if="result" class="results">
      <h3>Result</h3>
      <div v-if="result.content" class="result-content">
        <p>{{ result.content }}</p>
      </div>

      <div v-if="result.files && result.files.length > 0" class="files-list">
        <h4>Created Files</h4>
        <ul>
          <li v-for="file in result.files" :key="file">{{ file }}</li>
        </ul>
      </div>

      <div v-if="result.metadata && result.metadata.steps && result.metadata.steps.length > 0" class="steps-list">
        <details>
          <summary>View Steps ({{ result.metadata.steps.length }})</summary>
          <ul>
            <li v-for="(step, index) in result.metadata.steps" :key="index">
              <strong>Step {{ index + 1 }}:</strong> {{ step }}
            </li>
          </ul>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  max-width: 820px;
  margin: 0 auto;
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
  border-top: 1px solid #eee;
}

.result-content {
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.9em;
  border: 1px solid #e2e8f0;
}

.files-list ul,
.steps-list ul {
  list-style: disc;
  padding-left: 20px;
  color: #475569;
}

summary {
  cursor: pointer;
  font-weight: 500;
  color: #2563eb;
}
</style>
