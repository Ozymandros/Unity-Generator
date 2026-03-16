<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "../StatusBanner";
import { SmartField } from "../generic/SmartField";
import { ModelManagerModal } from "../generic/ModelManagerModal";
import { useCodePanel } from "./CodePanel";

const { t } = useI18n();

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
      <span class="banner-text">{{ t('code.activeProject', { name: activeProjectName }) }}</span>
      <label class="auto-save">
        <input type="checkbox" v-model="autoSaveToProject" />
        {{ t('code.autoSave') }}
      </label>
    </div>

    <h2>{{ t('code.title') }}</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField :label="t('common.prompt')" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="options-row d-flex align-center gap-2 mb-4">
        <SmartField 
          :label="t('common.provider')"
          type="select" 
          v-model="provider" 
          :options="providers.map(p => ({ value: p.name, label: p.name }))" 
          :placeholder="t('common.selectProvider')"
          class="flex-grow-1"
        />
        <SmartField 
          :label="provider ? `${t('common.model')} (${provider})` : t('common.model')"
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
          class="mt-7"
          @click="showModelManager = true"
          :disabled="!provider"
          :title="t('common.manageModels')"
        ></v-btn>
      </div>
      <div class="options-row d-flex gap-4 mb-4">
        <SmartField
           :label="t('common.temperature')"
           type="select"
           v-model.number="temperature"
           :options="TEMPERATURE_PRESETS"
           class="flex-grow-1"
        />
        <SmartField
           :label="t('code.fields.maxTokens')"
           type="select"
           v-model.number="maxTokens"
           :options="LENGTH_PRESETS"
           class="flex-grow-1"
        />
      </div>
       <v-expansion-panels class="mb-6">
        <v-expansion-panel
          :title="t('common.advancedOptions')"
          bg-color="surface"
          class="border rounded-lg"
          elevation="0"
        >
          <v-expansion-panel-text class="pa-4">
            <SmartField 
              :label="t('common.apiKey')"
              type="password" 
              v-model="apiKey" 
              :placeholder="t('common.leaveEmptyForGlobalKey')"
            />
            <SmartField 
              :label="t('common.systemPrompt')"
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
      {{ t('code.actions.generate') }}
    </v-btn>

    <SmartField :label="t('common.result')" type="textarea" v-model="result" :rows="10" disabled />

    <ModelManagerModal
      v-if="showModelManager"
      :provider="provider"
      v-model="showModelManager"
      @models-changed="refreshModels"
    />
  </div>
</template>

<style scoped src="./CodePanel.css"></style>
