<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
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
  providerModels,
  run,
  TEXT_PROVIDERS,
  TEMPERATURE_PRESETS,
  LENGTH_PRESETS
} = useTextPanel();
</script>

<template>
  <div class="panel">
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
      </div>
      <div class="row" style="margin-bottom: 12px;">
         <SmartField 
            label="API Key (Optional)" 
            type="password" 
            v-model="apiKey" 
            placeholder="Override key..." 
         />
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

    <button class="primary" @click="run">Generate</button>

    <SmartField label="Result" type="textarea" v-model="result" :rows="10" disabled />
  </div>
</template>

<style scoped src="./TextPanel.css"></style>
