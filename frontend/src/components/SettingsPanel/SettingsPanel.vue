<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { useSettingsPanel } from "./SettingsPanel";

const {
  backendUrl,
  preferredLlm,
  preferredImage,
  preferredAudio,
  preferredMusic,
  status,
  save,
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

    <div class="card management-callout">
      <h3>Advanced Management</h3>
      <p>Configure Providers, Models, API Keys and System Prompts in the dedicated dashboard.</p>
      <button class="secondary" @click="$emit('switch-tab', 'Management')">Go to Management Dashboard</button>
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
        </div>
        <div class="row">
          <SmartField 
            label="Image" 
            type="select" 
            v-model="preferredImage" 
            :options="IMAGE_PROVIDERS" 
          />
        </div>
        <div class="row">
          <SmartField 
            label="Voice (TTS)" 
            type="select" 
            v-model="preferredAudio" 
            :options="AUDIO_PROVIDERS.filter(p => p.type !== 'music')" 
          />
        </div>
        <div class="row">
          <SmartField 
            label="Music" 
            type="select" 
            v-model="preferredMusic" 
            :options="AUDIO_PROVIDERS.filter(p => p.type === 'music')" 
          />
        </div>
      </div>
    </div>

    <button class="primary" @click="save">Save Preferences</button>
  </div>
</template>

<style scoped src="./SettingsPanel.css"></style>
