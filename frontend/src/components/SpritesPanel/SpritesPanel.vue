<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "../StatusBanner";
import { SmartField } from "../generic/SmartField";
import { ModelManagerModal } from "../generic/ModelManagerModal";
import { useSpritesPanel } from "./SpritesPanel";

const { t } = useI18n();

const {
  prompt,
  model,
  provider,
  apiKey,
  resolution,
  paletteSize,
  autoCrop,
  status,
  tone,
  resultImage,
  resultMeta,
  systemPrompt,
  defaultSystemPrompt,
  RESOLUTIONS,
  PALETTE_SIZES,
  autoSaveToProject,
  activeProjectName,
  availableModels,
  showModelManager,
  refreshModels,
  run,
  canvasStyle,
  providers
} = useSpritesPanel();
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
    <div class="header">
        <h2>{{ t('sprites.title') }}</h2>
        <div class="badge">{{ t('sprites.badge') }}</div>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <div class="content-grid">
        <div class="sidebar">
            <SmartField :label="t('common.prompt')" type="textarea" v-model="prompt" :rows="3"
              placeholder="e.g. A pixel art sword, fire enchantment" />

            <v-card variant="flat" border class="pa-4 rounded-lg bg-surface">
                <div class="field-group mb-4">
                  <div class="row d-flex align-center gap-2">
                    <SmartField :label="t('common.provider')" type="select" v-model="provider"
                      :options="providers.map(p => ({ value: p.name, label: p.name }))"
                      :placeholder="t('common.selectProvider')" class="flex-grow-1" />
                  </div>
                  <div class="row d-flex align-center gap-2">
                    <SmartField :label="t('common.model')" type="select" v-model="model"
                      :options="availableModels" :placeholder="t('common.selectModel')"
                      :disabled="!provider" class="flex-grow-1" />
                  </div>
                  <div class="row d-flex align-center gap-2">
                    <v-btn variant="text" size="small" class="mt-1 margin-0" prepend-icon="mdi-plus"
                      @click="showModelManager = true">
                      {{ t('common.manageModels') }}
                    </v-btn>
                  </div>
                </div>

                <div class="field mb-4">
                    <label class="field-label mb-2 d-block">{{ t('sprites.fields.resolution') }}</label>
                    <v-btn-toggle v-model="resolution" mandatory color="primary" variant="outlined"
                      density="compact" rounded="lg" class="mb-2">
                      <v-btn v-for="res in RESOLUTIONS" :key="res" :value="res" size="small" class="text-none">
                        {{ res }}x
                      </v-btn>
                    </v-btn-toggle>
                </div>

                <SmartField :label="t('sprites.fields.paletteSize')" type="select" v-model.number="paletteSize"
                  :options="PALETTE_SIZES.map(s => ({ label: t('sprites.fields.colors', { n: s }), value: s }))" />
                <SmartField :label="t('sprites.fields.autoCrop')" type="checkbox" v-model="autoCrop" />
                <SmartField :label="t('common.apiKey')" type="password" v-model="apiKey"
                  :placeholder="t('common.leaveEmptyForGlobalKey')" />
                <SmartField :label="t('common.systemPrompt')" type="textarea" v-model="systemPrompt"
                  :placeholder="defaultSystemPrompt" :rows="2" />
            </v-card>

            <v-btn color="primary" size="large" rounded="pill" block prepend-icon="mdi-pencil-box-outline"
              @click="run" class="mt-4">
              {{ t('sprites.actions.generate') }}
            </v-btn>
        </div>

        <div class="preview-area">
            <div v-if="resultImage" class="canvas-container">
                <img :src="resultImage" :style="canvasStyle" />
                <div class="meta" v-if="resultMeta">
                    <p>{{ resultMeta.resolution }}x{{ resultMeta.resolution }}px</p>
                    <p>{{ resultMeta.provider }}</p>
                </div>
            </div>
            <div v-else class="placeholder">
                <p>{{ t('sprites.preview') }}</p>
            </div>
        </div>
    </div>

    <ModelManagerModal
      v-if="showModelManager"
      :provider="provider"
      v-model="showModelManager"
      @models-changed="refreshModels"
    />
  </div>
</template>

<style scoped src="./SpritesPanel.css"></style>
