<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "../StatusBanner";
import { SmartField } from "../generic/SmartField";
import { ModelManagerModal } from "../generic/ModelManagerModal";
import { useAudioPanel } from "./AudioPanel";

const { t } = useI18n();

const {
  prompt,
  modality,
  provider,
  apiKey,
  voiceId,
  musicModel,
  availableModels,
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
  providers,
  generatedAudio,
  audioNameInput,
  audioFormatSelect,
  saveToUnity,
} = useAudioPanel();

// Audio format options for Unity
const AUDIO_FORMATS = [
  { value: "WAV", label: "WAV" },
  { value: "MP3", label: "MP3" },
  { value: "OGG", label: "OGG" }
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
    <h2>{{ t('audio.title') }}</h2>
    <StatusBanner :status="status" :tone="tone" />

    <div class="mb-6">
      <div class="text-overline mb-2 text-primary">{{ t('audio.generationType') }}</div>
      <v-btn-toggle v-model="modality" mandatory color="primary" variant="outlined" rounded="pill" class="w-100">
        <v-btn value="audio" prepend-icon="mdi-account-voice" class="flex-grow-1">{{ t('audio.speechTts') }}</v-btn>
        <v-btn value="music" prepend-icon="mdi-music-note" class="flex-grow-1">{{ t('audio.atmosphericMusic') }}</v-btn>
      </v-btn-toggle>
    </div>

    <SmartField :label="modality === 'music' ? t('audio.fields.musicDescription') : t('audio.fields.speechPrompt')" type="textarea" v-model="prompt" :rows="6" />

    <div class="field-group">
      <div class="row">
        <SmartField
          :label="t('common.provider')"
          type="select"
          v-model="provider"
          :options="providers.map(p => ({ value: p.name, label: p.name }))"
          :placeholder="t('common.selectProvider')"
        />
        <v-btn icon="mdi-plus" size="small" variant="tonal" color="primary" class="ml-2 mt-7"
          @click="showModelManager = true" :disabled="!provider" :title="t('common.manageModels')"></v-btn>
      </div>
      <div class="row">
        <SmartField v-if="modality === 'audio'" :label="t('audio.fields.voiceOptional')" type="select" v-model="voiceId"
          :options="availableVoices" :placeholder="t('common.selectModel')" />
        <SmartField v-if="modality === 'music'" :label="t('audio.fields.musicModel')" type="select" v-model="musicModel"
          :options="availableModels" :placeholder="t('common.selectModel')" />
        <SmartField :label="t('audio.fields.stability')" type="number" v-model.number="stability" step="0.1" min="0" max="1" />
      </div>
    </div>

    <v-expansion-panels class="mb-6">
      <v-expansion-panel :title="t('common.advancedOptions')" bg-color="surface" class="border rounded-lg" elevation="0">
        <v-expansion-panel-text class="pa-4">
          <SmartField :label="t('common.systemPrompt')" type="textarea" v-model="systemPrompt" :placeholder="defaultSystemPrompt" :rows="3" />
          <SmartField :label="t('common.apiKey')" type="password" v-model="apiKey" :placeholder="t('common.leaveEmptyForGlobalKey')" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-btn color="primary" size="large" rounded="pill" block prepend-icon="mdi-auto-fix" @click="run" class="mb-6">
      {{ t('audio.actions.generate') }}
    </v-btn>

    <v-card v-if="generatedAudio" class="mb-6" variant="outlined" elevation="0">
      <v-card-title class="text-subtitle-1 d-flex align-center">
        <v-icon start color="primary">mdi-unity</v-icon>
        {{ t('audio.actions.saveToUnity') }}
      </v-card-title>
      <v-card-text>
        <SmartField :label="t('audio.fields.audioClipName')" type="text" v-model="audioNameInput" placeholder="GeneratedAudio" class="mb-3" />
        <SmartField :label="t('audio.fields.audioFormat')" type="select" v-model="audioFormatSelect" :options="AUDIO_FORMATS" />
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn color="primary" prepend-icon="mdi-export" block variant="tonal" @click="saveToUnity">
          {{ t('audio.actions.saveToUnity') }}
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

<style scoped src="./AudioPanel.css"></style>
