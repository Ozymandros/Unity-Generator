<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import { useCodePanel } from "./CodePanel";

const {
  prompt,
  provider,
  model,
  temperature,
  maxTokens,
  apiKey,
  systemPrompt,
  defaultSystemPrompt,
  autoSaveToProject,
  activeProjectName,
  availableModels,
  showModelManager,
  refreshModels,
  status,
  tone,
  result,
  run,
  TEXT_PROVIDERS,
  TEMPERATURE_PRESETS,
  LENGTH_PRESETS
} = useCodePanel();
</script>

<template>
  <div class="panel">
    <div v-if="activeProjectName" class="project-banner">
      <span class="banner-icon">📁</span>
      <span class="banner-text">Active Project: <strong>{{ activeProjectName }}</strong></span>
      <label class="auto-save">
        <input type="checkbox" v-model="autoSaveToProject" />
        Auto-save to project
      </label>
    </div>

    <h2>Unity C# Code</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField label="Prompt" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="options-row">
        <SmartField 
          label="Provider" 
          type="select" 
          v-model="provider" 
          :options="TEXT_PROVIDERS" 
          placeholder="Select Provider"
          class="field-item"
        />
        <SmartField 
          label="Model" 
          type="select" 
          v-model="model" 
          :options="availableModels" 
          placeholder="Select Model" 
          :disabled="!provider"
          class="field-item"
        />
        <button
          class="icon-btn"
          @click="showModelManager = true"
          :disabled="!provider"
          title="Manage models"
        >＋</button>
      </div>
      <div class="options-row">
        <SmartField
           label="Temperature"
           type="select"
           v-model.number="temperature"
           :options="TEMPERATURE_PRESETS"
           class="field-item"
        />
        <SmartField
           label="Max Tokens"
           type="select"
           v-model.number="maxTokens"
           :options="LENGTH_PRESETS"
           class="field-item"
        />
      </div>
       <div style="margin-top: 8px;">
        <details>
          <summary style="cursor: pointer; margin-bottom: 4px; font-size: 0.9em; user-select: none;">Advanced Options</summary>
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
        </details>
      </div>
    </div>

    <button class="primary" @click="run">Generate</button>

    <SmartField label="Result" type="textarea" v-model="result" :rows="10" disabled />

    <ModelManagerModal
      v-if="showModelManager"
      :provider="provider"
      v-model="showModelManager"
      @models-changed="refreshModels"
    />
  </div>
</template>

<style scoped src="./CodePanel.css"></style>
