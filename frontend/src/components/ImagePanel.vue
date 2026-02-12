<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateImage } from "../api/client";
import { IMAGE_PROVIDERS, ASPECT_RATIOS, QUALITY_OPTIONS } from "../constants/providers";
import SmartField from "./generic/SmartField.vue";

const prompt = ref("");
const provider = ref("");
const apiKey = ref("");
const aspectRatio = ref("1:1");
const quality = ref("standard");
const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");

async function run() {
  status.value = "Generating image...";
  tone.value = "ok";
  try {
    const response = await generateImage({
      prompt: prompt.value,
      provider: provider.value || undefined,
      options: { 
        aspect_ratio: aspectRatio.value,
        quality: quality.value,
        api_key: apiKey.value || undefined,
      },
    });
    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "Failed to generate image.";
      return;
    }
    status.value = "Image request complete.";
    result.value = JSON.stringify(response.data || {}, null, 2);
  } catch (error) {
    tone.value = "error";
    status.value = String(error);
  }
}
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

<style scoped>
.panel {
  max-width: 820px;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
.field-group {
  margin-bottom: 12px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
textarea,
input,
select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
}
.primary {
  margin: 8px 0 14px;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}
</style>
