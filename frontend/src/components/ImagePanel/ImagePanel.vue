<script setup lang="ts">
import { StatusBanner } from "../StatusBanner";
import { SmartField } from "../generic/SmartField";
import { ModelManagerModal } from "../generic/ModelManagerModal";
import { useImagePanel } from "./ImagePanel";

const {
  prompt,
  provider,
  model,
  apiKey,
  aspectRatio,
  quality,
  status,
  tone,
  result,
  systemPrompt,
  defaultSystemPrompt,
  autoSaveToProject,
  activeProjectName,
  availableModels,
  showModelManager,
  refreshModels,
  run,
  providerOptions,
  ASPECT_RATIOS,
  QUALITY_OPTIONS
} = useImagePanel();
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
    <h2>Image Generation</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField label="Prompt" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="row d-flex align-center gap-2 mb-4">
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
          class="ml-2 mt-7"
          @click="showModelManager = true"
          :disabled="!provider"
          title="Manage models"
        ></v-btn>
      </div>
      <div class="row">
        <SmartField
           label="Aspect Ratio"
           type="select"
           v-model="aspectRatio"
           :options="ASPECT_RATIOS"
        />
        <SmartField
           label="Quality"
           type="select"
           v-model="quality"
           :options="QUALITY_OPTIONS"
        />
      </div>
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
            label="API Key (Optional)" 
            type="password" 
            v-model="apiKey" 
            placeholder="Override key..." 
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

    <v-btn
      color="primary"
      size="large"
      rounded="pill"
      block
      prepend-icon="mdi-auto-fix"
      @click="run"
      class="mb-6"
    >
      Generate Image
    </v-btn>

    <SmartField label="Result (JSON)" type="textarea" v-model="result" :rows="10" disabled />

    <ModelManagerModal
      v-if="showModelManager"
      :provider="provider"
      v-model="showModelManager"
      @models-changed="refreshModels"
    />
  </div>
</template>

<style scoped src="./ImagePanel.css"></style>
