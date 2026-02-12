<script setup lang="ts">
import StatusBanner from "../StatusBanner/StatusBanner.vue";
import SmartField from "../generic/SmartField/SmartField.vue";
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
  availableVoices,
  run,
  AUDIO_PROVIDERS
} = useAudioPanel();
</script>

<template>
  <div class="panel">
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
        <SmartField 
          label="API Key (Optional)" 
          type="password" 
          v-model="apiKey" 
          placeholder="Override key..." 
        />
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

    <button class="primary" @click="run">Generate</button>

    <SmartField label="Result (JSON)" type="textarea" v-model="result" :rows="10" disabled />
  </div>
</template>

<style scoped src="./AudioPanel.css"></style>
