<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
import { useUnityPhysicsPanel, type PhysicsAgentResult, PHYSICS_EXAMPLE_PROMPTS } from "./UnityPhysicsPanel";

const {
  prompt,
  provider,
  model,
  temperature,
  apiKey,
  systemPrompt,
  defaultSystemPrompt,
  physicsBackend,
  simulationMode,
  gravityPreset,
  includeRigidbody,
  includeColliders,
  includeLayers,
  availableModels,
  showModelManager,
  refreshModels,
  status,
  tone,
  result,
  loading,
  canGenerate,
  run,
  providerOptions,
  TEMPERATURE_PRESETS,
  PHYSICS_QUICK_ACTIONS,
} = useUnityPhysicsPanel();

const physicsBackendOptions = [
  { value: "physx", label: "PhysX (Built-in)" },
  { value: "dots", label: "DOTS Physics (ECS)" },
];

const simulationModeOptions = [
  { value: "fixed_update", label: "FixedUpdate (recommended)" },
  { value: "update", label: "Update (kinematic)" },
  { value: "script", label: "Script-driven (Physics.Simulate)" },
];

const gravityPresetOptions = [
  { value: "", label: "None (let LLM decide)" },
  { value: "earth", label: "Earth (9.81 m/s²)" },
  { value: "moon", label: "Moon (1.62 m/s²)" },
  { value: "zero_g", label: "Zero-G (space)" },
  { value: "low", label: "Low gravity (3.0 m/s²)" },
  { value: "high", label: "High gravity (20.0 m/s²)" },
];

/**
 * Handle quick action chip click — injects the chip's template prompt and gravity preset.
 *
 * @param action - The quick action that was clicked.
 *
 * @example
 * ```typescript
 * handleQuickActionClick(PHYSICS_QUICK_ACTIONS[0]);
 * // prompt.value is now the bouncy ball template
 * ```
 */
function handleQuickActionClick(action: typeof PHYSICS_QUICK_ACTIONS[number]): void {
  if (!action?.prompt) return;
  prompt.value = action.prompt;
  if (action.gravityPreset) gravityPreset.value = action.gravityPreset;
}
</script>

<template>
  <div class="panel">
    <div class="header">
      <h2>Unity Physics</h2>
      <p class="subtitle">Generate Unity physics configuration — Rigidbodies, colliders, gravity, and more.</p>
    </div>

    <StatusBanner :status="status" :tone="tone" />

    <!-- Quick Actions -->
    <div class="quick-actions mb-4">
      <h3 class="text-subtitle-2 mb-2">Quick Actions</h3>
      <v-chip-group>
        <v-chip
          v-for="action in PHYSICS_QUICK_ACTIONS"
          :key="action.label"
          :prepend-icon="action.icon"
          variant="outlined"
          color="primary"
          class="ma-1"
          @click="handleQuickActionClick(action)"
        >
          {{ action.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <!-- Example Prompts -->
    <v-expansion-panels class="mb-4">
      <v-expansion-panel title="Example Prompts" bg-color="surface">
        <v-expansion-panel-text>
          <v-list density="compact">
            <v-list-item
              v-for="example in PHYSICS_EXAMPLE_PROMPTS"
              :key="example.text"
              @click="prompt = example.text"
              class="cursor-pointer"
              rounded="lg"
            >
              <v-list-item-title class="text-caption">{{ example.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Backend + Simulation Mode row -->
    <div class="d-flex gap-3 mb-4">
      <SmartField
        label="Physics Backend"
        type="select"
        v-model="physicsBackend"
        :options="physicsBackendOptions"
        class="flex-grow-1"
      />
      <SmartField
        label="Simulation Mode"
        type="select"
        v-model="simulationMode"
        :options="simulationModeOptions"
        class="flex-grow-1"
      />
    </div>

    <!-- Gravity preset -->
    <div class="mb-4">
      <SmartField
        label="Gravity Preset"
        type="select"
        v-model="gravityPreset"
        :options="gravityPresetOptions"
      />
    </div>

    <!-- Prompt textarea -->
    <SmartField
      label="Physics Description"
      type="textarea"
      v-model="prompt"
      :rows="4"
      placeholder="Describe the physics behaviour you want to generate..."
    />

    <!-- Component toggles -->
    <div class="d-flex gap-4 mb-4 flex-wrap">
      <v-checkbox
        v-model="includeRigidbody"
        label="Include Rigidbody setup"
        color="primary"
        hide-details
      />
      <v-checkbox
        v-model="includeColliders"
        label="Include Collider setup"
        color="primary"
        hide-details
      />
      <v-checkbox
        v-model="includeLayers"
        label="Include Physics Layers"
        color="primary"
        hide-details
      />
    </div>

    <!-- Provider / Model / Temperature -->
    <div class="field-group">
      <div class="options-row d-flex align-center gap-2 mb-4">
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
          class="mt-7"
          :disabled="!provider"
          title="Manage models"
          @click="showModelManager = true"
        />
      </div>

      <div class="mb-6">
        <SmartField label="Temperature" type="select" v-model.number="temperature" :options="TEMPERATURE_PRESETS" />
      </div>

      <v-expansion-panels class="mb-6">
        <v-expansion-panel title="Advanced Options" bg-color="surface" class="border rounded-lg" elevation="0">
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
      prepend-icon="mdi-atom"
      :loading="loading"
      :disabled="!canGenerate"
      class="mb-8"
      @click="run"
    >
      Generate Physics Config
    </v-btn>

    <!-- Result -->
    <v-fade-transition>
      <div v-if="result" class="results">
        <h3 class="text-h6 font-weight-bold mb-4">Result</h3>

        <v-card
          v-if="(result as PhysicsAgentResult).content"
          variant="outlined"
          class="pa-4 bg-on-background rounded-lg mb-4 text-white"
        >
          <p class="text-body-2" style="white-space: pre-wrap; font-family: 'JetBrains Mono', monospace;">
            {{ (result as PhysicsAgentResult).content }}
          </p>
        </v-card>

        <div v-if="(result as PhysicsAgentResult).files?.length" class="files-list mb-4">
          <h4 class="text-subtitle-2 font-weight-bold mb-2">Created Files</h4>
          <v-list density="compact" class="bg-transparent text-white">
            <v-list-item
              v-for="file in (result as PhysicsAgentResult).files"
              :key="file"
              prepend-icon="mdi-file-outline"
            >
              <v-list-item-title class="text-caption">{{ file }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <div v-if="(result as PhysicsAgentResult).metadata?.steps?.length" class="steps-list">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              :title="`View Steps (${(result as PhysicsAgentResult).metadata!.steps!.length})`"
              bg-color="surface"
              elevation="0"
              class="border rounded-lg"
            >
              <v-expansion-panel-text>
                <v-list density="compact" class="bg-transparent text-white">
                  <v-list-item
                    v-for="(step, index) in (result as PhysicsAgentResult).metadata!.steps"
                    :key="index"
                  >
                    <template v-slot:prepend>
                      <v-badge color="primary" :content="index + 1" inline />
                    </template>
                    <v-list-item-title class="text-caption ml-4">{{ step }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>
    </v-fade-transition>

    <ModelManagerModal
      v-if="showModelManager"
      :provider="provider"
      v-model="showModelManager"
      @models-changed="refreshModels"
    />
  </div>
</template>

<style scoped>
.panel {
  max-width: 820px;
  margin: 1rem;
}

.header {
  margin-bottom: 20px;
}

h2 {
  margin: 0 0 6px;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95em;
}

.field-group {
  margin-bottom: 12px;
}

.options-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.results {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
