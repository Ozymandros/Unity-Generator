<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "../StatusBanner";
import { SmartField } from "../generic/SmartField";
import { ModelManagerModal } from "../generic/ModelManagerModal";
import { useImagePanel } from "./ImagePanel";

const { t } = useI18n();

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
  QUALITY_OPTIONS,
  generatedImage,
  textureNameInput,
  textureTypeSelect,
  saveToUnity,
} = useImagePanel();

// Texture type options for Unity
const TEXTURE_TYPES = [
  { value: "Default", label: "Default" },
  { value: "Sprite", label: "Sprite" },
  { value: "Normal", label: "Normal Map" },
  { value: "UI", label: "UI" }
];
</script>

<template>
  <div class="panel">
    <div v-if="activeProjectName" class="project-banner">
      <span class="banner-icon">📁</span>
      <span class="banner-text">{{ t('code.activeProject', { name: activeProjectName }) }}</span>
      <label class="auto-save">
        <input type="checkbox" v-model="autoSaveToProject" />
        {{ t('code.autoSave') }}
      </label>
    </div>
    <h2>{{ t('image.title') }}</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField :label="t('common.prompt')" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="row d-flex align-center gap-2 mb-4">
        <SmartField 
          :label="t('common.provider')"
          type="select" 
          v-model="provider" 
          :options="providerOptions" 
          :placeholder="t('common.selectProvider')"
          class="flex-grow-1"
        />
        <SmartField 
          :label="t('common.model')"
          type="select" 
          v-model="model" 
          :options="availableModels" 
          :placeholder="t('common.selectModel')"
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
          :title="t('common.manageModels')"
        ></v-btn>
      </div>
      <div class="row">
        <SmartField :label="t('image.fields.aspectRatio')" type="select" v-model="aspectRatio" :options="ASPECT_RATIOS" />
        <SmartField :label="t('image.fields.quality')" type="select" v-model="quality" :options="QUALITY_OPTIONS" />
      </div>
    </div>

    <v-expansion-panels class="mb-6">
      <v-expansion-panel
        :title="t('common.advancedOptions')"
        bg-color="surface"
        class="border rounded-lg"
        elevation="0"
      >
        <v-expansion-panel-text class="pa-4">
          <SmartField :label="t('common.apiKey')" type="password" v-model="apiKey" :placeholder="t('common.leaveEmptyForGlobalKey')" />
          <SmartField :label="t('common.systemPrompt')" type="textarea" v-model="systemPrompt" :placeholder="defaultSystemPrompt" :rows="3" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-btn color="primary" size="large" rounded="pill" block prepend-icon="mdi-auto-fix" @click="run" class="mb-6">
      {{ t('image.actions.generate') }}
    </v-btn>

    <v-card v-if="generatedImage" class="mb-6" variant="outlined" elevation="0">
      <v-card-title class="text-subtitle-1 d-flex align-center">
        <v-icon start color="primary">mdi-unity</v-icon>
        {{ t('image.actions.saveToUnity') }}
      </v-card-title>
      <v-card-text>
        <SmartField :label="t('image.fields.textureName')" type="text" v-model="textureNameInput" placeholder="GeneratedTexture" class="mb-3" />
        <SmartField :label="t('image.fields.textureType')" type="select" v-model="textureTypeSelect" :options="TEXTURE_TYPES" />
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn color="primary" prepend-icon="mdi-export" block variant="tonal" @click="saveToUnity">
          {{ t('image.actions.saveToUnity') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <SmartField :label="t('common.result') + ' (JSON)'" type="textarea" v-model="result" :rows="10" disabled />

    <ModelManagerModal
      v-if="showModelManager"
      :provider="provider"
      v-model="showModelManager"
      @models-changed="refreshModels"
    />
  </div>
</template>

<style scoped src="./ImagePanel.css"></style>
