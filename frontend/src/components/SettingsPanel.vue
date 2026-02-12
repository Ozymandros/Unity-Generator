<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { getPref, saveApiKeys, setPref } from "../api/client";
import { TEXT_PROVIDERS, IMAGE_PROVIDERS, AUDIO_PROVIDERS } from "../constants/providers";
import SmartField from "./generic/SmartField.vue";

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
      <SmartField label="Backend URL" v-model="backendUrl" />
    </div>

    <h3>LLM Keys</h3>
    <SmartField label="Google (Gemini)" type="password" v-model="googleKey" />
    <SmartField label="Anthropic" type="password" v-model="anthropicKey" />
    <SmartField label="OpenAI" type="password" v-model="openaiKey" />
    <SmartField label="DeepSeek" type="password" v-model="deepseekKey" />
    <SmartField label="OpenRouter" type="password" v-model="openrouterKey" />
    <SmartField label="Groq" type="password" v-model="groqKey" />

    <h3>Image Keys</h3>
    <SmartField label="Stability" type="password" v-model="stabilityKey" />
    <SmartField label="Flux" type="password" v-model="fluxKey" />

    <h3>Audio Keys</h3>
    <SmartField label="ElevenLabs" type="password" v-model="elevenlabsKey" />
    <SmartField label="PlayHT" type="password" v-model="playhtKey" />

    <h3>Preferred Providers</h3>
    <SmartField 
      label="LLM" 
      type="select" 
      v-model="preferredLlm" 
      :options="TEXT_PROVIDERS" 
    />
    <SmartField 
      label="Image" 
      type="select" 
      v-model="preferredImage" 
      :options="IMAGE_PROVIDERS" 
    />
    <SmartField 
      label="Audio" 
      type="select" 
      v-model="preferredAudio" 
      :options="AUDIO_PROVIDERS" 
    />

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
