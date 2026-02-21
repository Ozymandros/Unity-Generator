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
  replicateKey,
  preferredLlm,
  preferredImage,
  preferredAudio,
  preferredMusic,
  defaultCodeSystemPrompt,
  defaultTextSystemPrompt,
  defaultImageSystemPrompt,
  defaultAudioSystemPrompt,
  defaultMusicSystemPrompt,
  defaultSpriteSystemPrompt,
  status,
  save,
  showModelManager,
  activeProviderForModal,
  manageModels,
  openSections,
  toggleSection,
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

    <div class="collapsible-section" :class="{ open: openSections.llmKeys }">
      <h3 @click="toggleSection('llmKeys')">
        LLM Keys
        <span class="icon">{{ openSections.llmKeys ? '▼' : '▶' }}</span>
      </h3>
      <div class="content" v-show="openSections.llmKeys">
        <SmartField label="Google (Gemini)" type="password" v-model="googleKey" />
        <SmartField label="Anthropic" type="password" v-model="anthropicKey" />
        <SmartField label="OpenAI" type="password" v-model="openaiKey" />
        <SmartField label="DeepSeek" type="password" v-model="deepseekKey" />
        <SmartField label="OpenRouter" type="password" v-model="openrouterKey" />
        <SmartField label="Groq" type="password" v-model="groqKey" />
        <SmartField label="Hugging Face" type="password" v-model="huggingfaceKey" />
        <SmartField label="Ollama" type="password" v-model="ollamaKey" />
        <SmartField label="Replicate" type="password" v-model="replicateKey" />
      </div>
    </div>

    <div class="collapsible-section" :class="{ open: openSections.imageKeys }">
      <h3 @click="toggleSection('imageKeys')">
        Image Keys
        <span class="icon">{{ openSections.imageKeys ? '▼' : '▶' }}</span>
      </h3>
      <div class="content" v-show="openSections.imageKeys">
        <SmartField label="Stability" type="password" v-model="stabilityKey" />
        <SmartField label="Flux" type="password" v-model="fluxKey" />
      </div>
    </div>

    <div class="collapsible-section" :class="{ open: openSections.audioKeys }">
      <h3 @click="toggleSection('audioKeys')">
        Audio Keys
        <span class="icon">{{ openSections.audioKeys ? '▼' : '▶' }}</span>
      </h3>
      <div class="content" v-show="openSections.audioKeys">
        <SmartField label="ElevenLabs" type="password" v-model="elevenlabsKey" />
        <SmartField label="PlayHT" type="password" v-model="playhtKey" />
      </div>
    </div>

    <div class="collapsible-section" :class="{ open: openSections.prompts }">
      <h3 @click="toggleSection('prompts')">
        Default System Prompts (Global)
        <span class="icon">{{ openSections.prompts ? '▼' : '▶' }}</span>
      </h3>
      <div class="content" v-show="openSections.prompts">
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
          label="Voice Generation (TTS)" 
          type="textarea" 
          v-model="defaultAudioSystemPrompt" 
          placeholder="Default: High quality sound effect..." 
          :rows="2"
        />
        <SmartField 
          label="Music Generation" 
          type="textarea" 
          v-model="defaultMusicSystemPrompt" 
          placeholder="Default: Epic orchestral soundtrack..." 
          :rows="2"
        />
        <SmartField 
          label="Sprite Generation" 
          type="textarea" 
          v-model="defaultSpriteSystemPrompt" 
          placeholder="Default: Pixel art style..." 
          :rows="2"
        />
      </div>
    </div>

    <div class="collapsible-section" :class="{ open: openSections.providers }">
      <h3 @click="toggleSection('providers')">
        Preferred Providers
        <span class="icon">{{ openSections.providers ? '▼' : '▶' }}</span>
      </h3>
      <div class="content" v-show="openSections.providers">
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
            label="Voice (TTS)" 
            type="select" 
            v-model="preferredAudio" 
            :options="AUDIO_PROVIDERS.filter(p => p.type !== 'music')" 
          />
          <button class="icon-btn" @click="manageModels(preferredAudio)" :disabled="!preferredAudio">＋</button>
        </div>
        <div class="row">
          <SmartField 
            label="Music" 
            type="select" 
            v-model="preferredMusic" 
            :options="AUDIO_PROVIDERS.filter(p => p.type === 'music')" 
          />
          <button class="icon-btn" @click="manageModels(preferredMusic)" :disabled="!preferredMusic">＋</button>
        </div>
      </div>
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
