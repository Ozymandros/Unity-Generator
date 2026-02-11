<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref, computed } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateAudio } from "../api/client";
import { AUDIO_PROVIDERS } from "../constants/providers";

const prompt = ref("");
const provider = ref("");
const apiKey = ref("");
const voiceId = ref("");
const stability = ref(0.5);
const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");

const availableVoices = computed(() => {
  const p = AUDIO_PROVIDERS.find((x) => x.value === provider.value);
  return p ? p.models || [] : [];
});

async function run() {
  status.value = "Generating audio...";
  tone.value = "ok";
  try {
    const response = await generateAudio({
      prompt: prompt.value,
      provider: provider.value || undefined,
      options: { 
        voice_id: voiceId.value || undefined,
        stability: stability.value,
        api_key: apiKey.value || undefined,
      },
    });
    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "Failed to generate audio.";
      return;
    }
    status.value = "Audio request complete.";
    result.value = JSON.stringify(response.data || {}, null, 2);
  } catch (error) {
    tone.value = "error";
    status.value = String(error);
  }
}
</script>

<template>
  <div class="panel">
    <h2>Audio Generation</h2>
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
            <option v-for="p in AUDIO_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>API Key (Optional)</label>
          <input v-model="apiKey" type="password" placeholder="Override key..." />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label>Voice (optional)</label>
          <select v-model="voiceId">
            <option value="" disabled>Select Voice</option>
            <option v-for="v in availableVoices" :key="v.value" :value="v.value">{{ v.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Stability</label>
          <input type="number" v-model.number="stability" step="0.1" min="0" max="1" />
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
