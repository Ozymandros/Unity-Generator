<script setup lang="ts">
import StatusBanner from "../StatusBanner/StatusBanner.vue";
import SmartField from "../generic/SmartField/SmartField.vue";
import { useImagePanel } from "./ImagePanel";

const {
  prompt,
  provider,
  apiKey,
  aspectRatio,
  quality,
  status,
  tone,
  result,
  run,
  IMAGE_PROVIDERS,
  ASPECT_RATIOS,
  QUALITY_OPTIONS
} = useImagePanel();
</script>

<template>
  <div class="panel">
    <h2>Image Generation</h2>
    <StatusBanner :status="status" :tone="tone" />
    <SmartField label="Prompt" type="textarea" v-model="prompt" :rows="6" />
    
    <div class="field-group">
      <div class="row">
        <SmartField 
          label="Provider" 
          type="select" 
          v-model="provider" 
          :options="IMAGE_PROVIDERS" 
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
           label="Aspect Ratio"
           type="select"
           v-model="aspectRatio"
           :options="ASPECT_RATIOS"
        />
        <SmartField
           label="Quality"
           type="select"
           v-model="quality"
           :options="QUALITY_OPTIONS"
        />
      </div>
    </div>

    <button class="primary" @click="run">Generate</button>

    <SmartField label="Result (JSON)" type="textarea" v-model="result" :rows="10" disabled />
  </div>
</template>

<style scoped src="./ImagePanel.css"></style>
