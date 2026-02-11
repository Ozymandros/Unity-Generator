<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { getPref, saveApiKeys, setPref } from "../api/client";
import { TEXT_PROVIDERS, IMAGE_PROVIDERS, AUDIO_PROVIDERS } from "../constants/providers";

const backendUrl = ref(localStorage.getItem("backendUrl") || "http://127.0.0.1:8000");
const googleKey = ref("");
const anthropicKey = ref("");
const openaiKey = ref("");
const deepseekKey = ref("");
const openrouterKey = ref("");
const groqKey = ref("");
const stabilityKey = ref("");
const fluxKey = ref("");
const elevenlabsKey = ref("");
const playhtKey = ref("");
const preferredLlm = ref("deepseek");
const preferredImage = ref("stability");
const preferredAudio = ref("elevenlabs");

const status = ref<string | null>(null);

onMounted(async () => {
  const llmPref = await getPref("preferred_llm_provider");
  const imagePref = await getPref("preferred_image_provider");
  const audioPref = await getPref("preferred_audio_provider");

  preferredLlm.value = String(llmPref.data?.value || preferredLlm.value);
  preferredImage.value = String(imagePref.data?.value || preferredImage.value);
  preferredAudio.value = String(audioPref.data?.value || preferredAudio.value);
});

async function save() {
  localStorage.setItem("backendUrl", backendUrl.value);
  const response = await saveApiKeys({
    google_api_key: googleKey.value,
    anthropic_api_key: anthropicKey.value,
    openai_api_key: openaiKey.value,
    deepseek_api_key: deepseekKey.value,
    openrouter_api_key: openrouterKey.value,
    groq_api_key: groqKey.value,
    stability_api_key: stabilityKey.value,
    flux_api_key: fluxKey.value,
    elevenlabs_api_key: elevenlabsKey.value,
    playht_api_key: playhtKey.value,
  });
  await setPref("preferred_llm_provider", preferredLlm.value);
  await setPref("preferred_image_provider", preferredImage.value);
  await setPref("preferred_audio_provider", preferredAudio.value);

  if (!response.success) {
    status.value = response.error || "Failed to save keys.";
    return;
  }
  status.value = "Saved locally.";
}
</script>

<template>
  <div class="panel">
    <h2>Settings</h2>
    <StatusBanner :status="status" tone="ok" />

    <div class="field">
      <label>Backend URL</label>
      <input v-model="backendUrl" />
    </div>

    <h3>LLM Keys</h3>
    <div class="field"><label>Google (Gemini)</label><input v-model="googleKey" type="password" /></div>
    <div class="field"><label>Anthropic</label><input v-model="anthropicKey" type="password" /></div>
    <div class="field"><label>OpenAI</label><input v-model="openaiKey" type="password" /></div>
    <div class="field"><label>DeepSeek</label><input v-model="deepseekKey" type="password" /></div>
    <div class="field"><label>OpenRouter</label><input v-model="openrouterKey" type="password" /></div>
    <div class="field"><label>Groq</label><input v-model="groqKey" type="password" /></div>

    <h3>Image Keys</h3>
    <div class="field"><label>Stability</label><input v-model="stabilityKey" type="password" /></div>
    <div class="field"><label>Flux</label><input v-model="fluxKey" type="password" /></div>

    <h3>Audio Keys</h3>
    <div class="field"><label>ElevenLabs</label><input v-model="elevenlabsKey" type="password" /></div>
    <div class="field"><label>PlayHT</label><input v-model="playhtKey" type="password" /></div>

    <h3>Preferred Providers</h3>
    <div class="field">
      <label>LLM</label>
      <select v-model="preferredLlm">
        <option v-for="p in TEXT_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
    </div>
    <div class="field">
      <label>Image</label>
      <select v-model="preferredImage">
        <option v-for="p in IMAGE_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
    </div>
    <div class="field">
      <label>Audio</label>
      <select v-model="preferredAudio">
        <option v-for="p in AUDIO_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
    </div>

    <button class="primary" @click="save">Save</button>
  </div>
</template>

<style scoped>
.panel {
  max-width: 720px;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
label {
  font-weight: 600;
  margin-bottom: 4px;
}
input,
select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.primary {
  margin-top: 12px;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}
</style>
