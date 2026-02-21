<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import { useTextPanel } from "./TextPanel";

const {
  prompt,
  provider,
  apiKey,
  model,
  temperature,
  maxTokens,
  status,
  tone,
  result,
  systemPrompt,
  defaultSystemPrompt,
  autoSaveToProject,
  activeProjectName,
  providerModels,
  showModelManager,
  refreshModels,
  run,
  TEXT_PROVIDERS,
  TEMPERATURE_PRESETS,
  LENGTH_PRESETS
} = useTextPanel();
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
    <h2>Text Generation</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField label="Prompt" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="row">
        <SmartField 
          label="Provider" 
          type="select" 
          v-model="provider" 
          :options="TEXT_PROVIDERS" 
          placeholder="Select Provider" 
        />
        <SmartField 
          label="Model" 
          type="select" 
          v-model="model" 
          :options="providerModels" 
          placeholder="Select Model" 
        />
        <button
          class="icon-btn"
          @click="showModelManager = true"
          :disabled="!provider"
          title="Manage models"
        >＋</button>
      </div>
      <div class="row" style="margin-bottom: 12px;">
      </div>
      <div class="row">
        <SmartField
           label="Temperature"
           type="select"
           v-model.number="temperature"
           :options="TEMPERATURE_PRESETS"
        />
        <SmartField
           label="Length"
           type="select"
           v-model.number="maxTokens"
           :options="LENGTH_PRESETS"
        />
      </div>
    </div>

    <details class="advanced-opts">
      <summary>Advanced Options</summary>
      <div class="opts-content">
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
      </div>
    </details>

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

<style scoped src="./TextPanel.css"></style>
