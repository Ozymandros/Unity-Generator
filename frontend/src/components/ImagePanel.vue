<script setup lang="ts">
import { ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateImage } from "../api/client";

const prompt = ref("");
const provider = ref("");
const aspectRatio = ref("1:1");
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
      options: { aspect_ratio: aspectRatio.value },
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
    <div class="row">
      <div class="field">
        <label>Provider (optional)</label>
        <input v-model="provider" placeholder="stability | flux" />
      </div>
      <div class="field">
        <label>Aspect Ratio</label>
        <input v-model="aspectRatio" placeholder="1:1" />
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
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
textarea,
input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
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
