<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateImage } from "../api/client";
import { IMAGE_PROVIDERS, ASPECT_RATIOS, QUALITY_OPTIONS } from "../constants/providers";

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
    <div class="field">
      <label>Prompt</label>
      <textarea v-model="prompt" rows="6"></textarea>
    </div>
    
    <div class="field-group">
      <div class="row">
        <div class="field">
          <label>Provider</label>
          <select v-model="provider">
            <option value="" disabled>Select Provider</option>
            <option v-for="p in IMAGE_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>API Key (Optional)</label>
          <input v-model="apiKey" type="password" placeholder="Override key..." />
        </div>
      </div>
      <div class="row">
        <div class="field">
           <label>Aspect Ratio</label>
           <select v-model="aspectRatio">
             <option v-for="ar in ASPECT_RATIOS" :key="ar.value" :value="ar.value">{{ ar.label }}</option>
           </select>
        </div>
        <div class="field">
           <label>Quality</label>
           <select v-model="quality">
             <option v-for="q in QUALITY_OPTIONS" :key="q.value" :value="q.value">{{ q.label }}</option>
           </select>
        </div>
      </div>
    </div>

    <button class="primary" @click="run">Generate</button>

    <div class="field">
      <label>Result (JSON)</label>
      <textarea v-model="result" rows="10" readonly></textarea>
    </div>
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
