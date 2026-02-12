<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { useSettingsPanel } from "./SettingsPanel";

const {
  backendUrl,
  googleKey,
  anthropicKey,
  openaiKey,
  deepseekKey,
  openrouterKey,
  groqKey,
  stabilityKey,
  fluxKey,
  elevenlabsKey,
  playhtKey,
  preferredLlm,
  preferredImage,
  preferredAudio,
  status,
  save,
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  AUDIO_PROVIDERS
} = useSettingsPanel();
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

<style scoped src="./SettingsPanel.css"></style>
