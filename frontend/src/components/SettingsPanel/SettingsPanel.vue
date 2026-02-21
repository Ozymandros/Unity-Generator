<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { ModelManagerModal } from "@/components/generic/ModelManagerModal";
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
  huggingfaceKey,
  ollamaKey,
  preferredLlm,
  preferredImage,
  preferredAudio,
  defaultCodeSystemPrompt,
  defaultTextSystemPrompt,
  defaultImageSystemPrompt,
  defaultAudioSystemPrompt,
  defaultSpriteSystemPrompt,
  status,
  save,
  showModelManager,
  activeProviderForModal,
  manageModels,
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
    <SmartField label="Hugging Face" type="password" v-model="huggingfaceKey" />
    <SmartField label="Ollama" type="password" v-model="ollamaKey" />

    <h3>Image Keys</h3>
    <SmartField label="Stability" type="password" v-model="stabilityKey" />
    <SmartField label="Flux" type="password" v-model="fluxKey" />

    <h3>Audio Keys</h3>
    <SmartField label="ElevenLabs" type="password" v-model="elevenlabsKey" />
    <SmartField label="PlayHT" type="password" v-model="playhtKey" />

    <h3>Default System Prompts (Global)</h3>
    <SmartField 
      label="Code Generation" 
      type="textarea" 
      v-model="defaultCodeSystemPrompt" 
      placeholder="Default: You are a senior Unity engineer..." 
      :rows="2"
    />
    <SmartField 
      label="Text Generation" 
      type="textarea" 
      v-model="defaultTextSystemPrompt" 
      placeholder="Default: You are a creative writer..." 
      :rows="2"
    />
    <SmartField 
      label="Image Generation" 
      type="textarea" 
      v-model="defaultImageSystemPrompt" 
      placeholder="Default: Professional concept art..." 
      :rows="2"
    />
    <SmartField 
      label="Audio Generation" 
      type="textarea" 
      v-model="defaultAudioSystemPrompt" 
      placeholder="Default: High quality sound effect..." 
      :rows="2"
    />
    <SmartField 
      label="Sprite Generation" 
      type="textarea" 
      v-model="defaultSpriteSystemPrompt" 
      placeholder="Default: Pixel art style..." 
      :rows="2"
    />

    <h3>Preferred Providers</h3>
    <div class="row">
      <SmartField 
        label="LLM" 
        type="select" 
        v-model="preferredLlm" 
        :options="TEXT_PROVIDERS" 
      />
      <button class="icon-btn" @click="manageModels(preferredLlm)" :disabled="!preferredLlm">＋</button>
    </div>
    <div class="row">
      <SmartField 
        label="Image" 
        type="select" 
        v-model="preferredImage" 
        :options="IMAGE_PROVIDERS" 
      />
      <button class="icon-btn" @click="manageModels(preferredImage)" :disabled="!preferredImage">＋</button>
    </div>
    <div class="row">
      <SmartField 
        label="Audio" 
        type="select" 
        v-model="preferredAudio" 
        :options="AUDIO_PROVIDERS" 
      />
      <button class="icon-btn" @click="manageModels(preferredAudio)" :disabled="!preferredAudio">＋</button>
    </div>

    <button class="primary" @click="save">Save</button>

    <ModelManagerModal
      v-if="showModelManager"
      :provider="activeProviderForModal"
      v-model="showModelManager"
    />
  </div>
</template>

<style scoped src="./SettingsPanel.css"></style>
