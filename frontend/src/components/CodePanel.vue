<script setup lang="ts">
import StatusBanner from "./StatusBanner.vue";
import SmartField from "./generic/SmartField.vue";
import { useCodePanel } from "./CodePanel";

const {
  prompt,
  provider,
  model,
  temperature,
  maxTokens,
  apiKey,
  availableModels,
  status,
  tone,
  result,
  run,
  TEXT_PROVIDERS,
  TEMPERATURE_PRESETS,
  LENGTH_PRESETS
} = useCodePanel();
</script>

<template>
  <div class="panel">
    <h2>Unity C# Code</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField label="Prompt" type="textarea" v-model="prompt" :rows="6" />
    
    <div class="field-group">
      <div class="options-row">
        <SmartField 
          label="Provider" 
          type="select" 
          v-model="provider" 
          :options="TEXT_PROVIDERS" 
          placeholder="Select Provider"
          class="field-item"
        />
        <SmartField 
          label="Model" 
          type="select" 
          v-model="model" 
          :options="availableModels" 
          placeholder="Select Model" 
          :disabled="!provider"
          class="field-item"
        />
      </div>
      <div class="options-row">
        <SmartField
           label="Temperature"
           type="select"
           v-model.number="temperature"
           :options="TEMPERATURE_PRESETS"
           class="field-item"
        />
        <SmartField
           label="Max Tokens"
           type="select"
           v-model.number="maxTokens"
           :options="LENGTH_PRESETS"
           class="field-item"
        />
      </div>
      <div style="margin-top: 8px;">
          <SmartField 
            label="API Key (Optional Override)" 
            type="password" 
            v-model="apiKey" 
            placeholder="Leave empty to use global key" 
          />
      </div>
    </div>

    <button class="primary" @click="run">Generate</button>

    <SmartField label="Result" type="textarea" v-model="result" :rows="10" disabled />
  </div>
</template>

<style scoped src="./CodePanel.css"></style>
