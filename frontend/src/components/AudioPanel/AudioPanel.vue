<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import { useAudioPanel } from "./AudioPanel";

const {
  prompt,
  provider,
  apiKey,
  voiceId,
  stability,
  status,
  tone,
  result,
  systemPrompt,
  defaultSystemPrompt,
  autoSaveToProject,
  activeProjectName,
  availableVoices,
  showModelManager,
  refreshModels,
  run,
  AUDIO_PROVIDERS
} = useAudioPanel();
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
    <h2>Audio Generation</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField label="Prompt" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="row">
        <SmartField 
          label="Provider" 
          type="select" 
          v-model="provider" 
          :options="AUDIO_PROVIDERS" 
          placeholder="Select Provider" 
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
          label="Voice (optional)" 
          type="select" 
          v-model="voiceId" 
          :options="availableVoices" 
          placeholder="Select Voice" 
        />
        <SmartField
          label="Stability"
          type="number"
          v-model.number="stability"
          step="0.1"
          min="0"
          max="1"
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
            label="System Prompt Override" 
            type="textarea" 
            v-model="systemPrompt" 
            :placeholder="defaultSystemPrompt" 
            :rows="3"
          />
          <SmartField 
            label="API Key (Optional)" 
            type="password" 
            v-model="apiKey" 
            placeholder="Override key..." 
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
      Generate Audio
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

<style scoped src="./AudioPanel.css"></style>
