<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "../StatusBanner";
import { SmartField } from "../generic/SmartField";
import { ModelManagerModal } from "../generic/ModelManagerModal";
import { useTextPanel } from "./TextPanel";

const { t } = useI18n();

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
  providers,
  TEMPERATURE_PRESETS,
  LENGTH_PRESETS
} = useTextPanel();
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
    <h2>{{ t('text.title') }}</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField :label="t('common.prompt')" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="row">
        <SmartField 
          :label="t('common.provider')"
          type="select" 
          v-model="provider" 
          :options="providers.map(p => ({ value: p.name, label: p.name }))" 
          :placeholder="t('common.selectProvider')"
        />
        <SmartField 
          :label="t('common.model')"
          type="select" 
          v-model="model" 
          :options="providerModels" 
          :placeholder="t('common.selectModel')"
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
      <div class="row" style="margin-bottom: 12px;">
      </div>
      <div class="row">
        <SmartField
           :label="t('common.temperature')"
           type="select"
           v-model.number="temperature"
           :options="TEMPERATURE_PRESETS"
        />
        <SmartField
           :label="t('text.fields.length')"
           type="select"
           v-model.number="maxTokens"
           :options="LENGTH_PRESETS"
        />
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

    <v-btn
      color="primary"
      size="large"
      rounded="pill"
      block
      prepend-icon="mdi-auto-fix"
      @click="run"
      class="mb-6"
    >
      {{ t('text.actions.generate') }}
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

<style scoped src="./TextPanel.css"></style>
