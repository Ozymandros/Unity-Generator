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
  providers,
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
      <div class="options-row d-flex align-center gap-2 mb-4">
        <SmartField 
          label="Provider" 
          type="select" 
          v-model="provider" 
          :options="providers.map(p => ({ value: p.name, label: p.name }))" 
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
          @click="showModelManager = true"
          :disabled="!provider"
          title="Manage models"
        ></v-btn>
      </div>
      <div class="options-row d-flex gap-4 mb-4">
        <SmartField
           label="Temperature"
           type="select"
           v-model.number="temperature"
           :options="TEMPERATURE_PRESETS"
           class="flex-grow-1"
        />
        <SmartField
           label="Max Tokens"
           type="select"
           v-model.number="maxTokens"
           :options="LENGTH_PRESETS"
           class="flex-grow-1"
        />
      </div>
       <v-expansion-panels class="mb-6">
        <v-expansion-panel
          title="Advanced Options"
          bg-color="surface"
          class="border rounded-lg"
          elevation="0"
        >
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
      prepend-icon="mdi-code-braces"
      @click="run"
      class="mb-8"
    >
      Generate Code
    </v-btn>

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
