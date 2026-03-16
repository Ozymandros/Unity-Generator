<script setup lang="ts">
import { ref } from 'vue';
import GeneralSettings from "./sections/GeneralSettings/GeneralSettings.vue";
import ProviderManagement from "./sections/ProviderManagement/ProviderManagement.vue";
import ModelManagement from "./sections/ModelManagement/ModelManagement.vue";
import PromptManagement from "./sections/PromptManagement/PromptManagement.vue";
import GlobalKeyManagement from "./sections/GlobalKeyManagement/GlobalKeyManagement.vue";

const activeTab = ref(0);

const tabs = [
  { label: 'General', icon: 'mdi-cog-outline' },
  { label: 'Providers', icon: 'mdi-robot-outline' },
  { label: 'Models', icon: 'mdi-robot-outline' },
  { label: 'Prompts', icon: 'mdi-script-text-outline' },
  { label: 'Secrets', icon: 'mdi-key-chain' },
];
</script>

<template>
  <div class="settings-shell">
    <div class="pa-6 pb-2">
      <h1 class="text-h4 font-weight-bold mb-1">Configuration</h1>
      <p class="text-subtitle-2 text-grey-lighten-1">Manage your intelligence engines, models, and system prompts.</p>
    </div>

    <!-- Top Tabs -->
    <v-tabs
      v-model="activeTab"
      color="primary"
      align-tabs="start"
      class="px-6 border-bottom"
    >
      <v-tab
        v-for="(tab, i) in tabs"
        :key="i"
        :value="i"
        class="text-none font-weight-medium"
      >
        <v-icon start class="mr-2">{{ tab.icon }}</v-icon>
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <!-- Content Area -->
    <div class="pa-6 bg-background">
      <v-window v-model="activeTab">
        <v-window-item :value="0">
          <GeneralSettings />
        </v-window-item>
        <v-window-item :value="1">
          <ProviderManagement />
        </v-window-item>
        <v-window-item :value="2">
          <ModelManagement />
        </v-window-item>
        <v-window-item :value="3">
          <PromptManagement />
        </v-window-item>
        <v-window-item :value="4">
          <GlobalKeyManagement />
        </v-window-item>
      </v-window>
    </div>
  </div>
</template>

<style scoped src="./SettingsPanel.css"></style>
