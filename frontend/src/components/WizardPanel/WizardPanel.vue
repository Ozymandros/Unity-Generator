<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import { useWizardPanel } from "./WizardPanel";

const { t } = useI18n();
const {
  prompt, provider, model, temperature, apiKey, systemPrompt,
  status, tone, result, loading, canGenerate, run,
  mcpAvailable, mcpWarning, providerOptions, availableModels,
  showModelManager, refreshModels, TEMPERATURE_PRESETS, WIZARD_QUICK_ACTIONS,
} = useWizardPanel();
</script>

<template>
  <div class="panel">
    <div class="header">
      <h2>{{ t('wizard.title') }}</h2>
      <p class="subtitle">{{ t('wizard.subtitle') }}</p>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <v-alert v-if="mcpWarning" type="warning" variant="tonal" class="mb-4" icon="mdi-unity">{{ mcpWarning }}</v-alert>
    <v-alert v-else-if="mcpAvailable" type="success" variant="tonal" class="mb-4" icon="mdi-unity">
      {{ t('wizard.mcpReady') }}
    </v-alert>

    <v-chip-group class="mb-4">
      <v-chip v-for="action in WIZARD_QUICK_ACTIONS" :key="action.label" :prepend-icon="action.icon"
        variant="outlined" color="primary" @click="prompt = action.prompt">{{ action.label }}</v-chip>
    </v-chip-group>

    <SmartField :label="t('common.prompt')" type="textarea" v-model="prompt" :rows="5" />

    <div class="d-flex gap-2 mb-4 mt-4">
      <SmartField :label="t('common.provider')" type="select" v-model="provider" :options="providerOptions" class="flex-grow-1" />
      <SmartField :label="t('common.model')" type="select" v-model="model" :options="availableModels" :disabled="!provider" class="flex-grow-1" />
    </div>

    <SmartField :label="t('common.temperature')" type="select" v-model.number="temperature" :options="TEMPERATURE_PRESETS" class="mb-4" />

    <v-expansion-panels class="mb-4">
      <v-expansion-panel :title="t('common.advancedOptions')">
        <v-expansion-panel-text>
          <SmartField :label="t('common.apiKey')" type="password" v-model="apiKey" />
          <SmartField :label="t('common.systemPrompt')" type="textarea" v-model="systemPrompt" :rows="3" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-btn color="primary" size="large" block rounded="pill" prepend-icon="mdi-wizard-hat" :loading="loading" :disabled="!canGenerate" @click="run">
      {{ t('wizard.actions.run') }}
    </v-btn>

    <v-card v-if="result?.content" class="mt-6 pa-4" variant="outlined">
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ result.content }}</pre>
    </v-card>

    <ModelManagerModal v-if="showModelManager" :provider="provider" v-model="showModelManager" @models-changed="refreshModels" />
  </div>
</template>

<style scoped>
.panel { padding: 1.5rem; max-width: 960px; margin: 0 auto; }
</style>
