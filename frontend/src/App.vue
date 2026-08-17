<script setup lang="ts">
// Menu event handlers for File > New Project and File > Open Project
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import SettingsPanel from "./components/SettingsPanel/SettingsPanel.vue";
import CodePanel from "./components/CodePanel/CodePanel.vue";
import TextPanel from "./components/TextPanel/TextPanel.vue";
import ImagePanel from "./components/ImagePanel/ImagePanel.vue";
import AudioPanel from "./components/AudioPanel/AudioPanel.vue";
import SpritesPanel from "./components/SpritesPanel/SpritesPanel.vue";
import UnityProjectPanel from "./components/UnityProjectPanel/UnityProjectPanel.vue";
import UnityUIPanel from "./components/UnityUIPanel/UnityUIPanel.vue";
import UnityPhysicsPanel from "./components/UnityPhysicsPanel/UnityPhysicsPanel.vue";
import WizardPanel from "./components/WizardPanel/WizardPanel.vue";
import UnityMcpHubPanel from "./components/UnityMcpHubPanel/UnityMcpHubPanel.vue";
import UnityLightingPanel from "./components/UnityLightingPanel/UnityLightingPanel.vue";
import UnityCameraPanel from "./components/UnityCameraPanel/UnityCameraPanel.vue";
import UnityMaterialsPanel from "./components/UnityMaterialsPanel/UnityMaterialsPanel.vue";
import UnityAnimationsPanel from "./components/UnityAnimationsPanel/UnityAnimationsPanel.vue";
import VideoPanel from "./components/VideoPanel/VideoPanel.vue";
import LogsPanel from "./components/LogsPanel/LogsPanel.vue";
import { useApp } from "./App";
import { useSessionProject } from "./composables/useSessionProject";
import { useOpenProject } from "./composables/useOpenProject";
import { useTheme } from "./composables/useTheme";
import { useLocale } from "./composables/useLocale";
import { useIntelligenceStore } from "./store/intelligenceStore";
import { clearActiveProject } from "./store/projectStore";
import { useUnityProjectUiStore } from "./store/unityProjectUiStore";
import ScenesPanel from "./components/ScenesPanel.vue";
import ThemeToggle from "./components/ThemeToggle/ThemeToggle.vue";
import type { ElectronAPI } from "./types/electron";

const { t } = useI18n();
const { tabs, active, backendStatus, setActive } = useApp();
const { projectName, sessionProjectResetKey, resetSessionProject } = useSessionProject();
const { loadProject } = useOpenProject();
useTheme();
useLocale();
const drawer = ref(true);
const store = useIntelligenceStore();
const unityUi = useUnityProjectUiStore();
unityUi.enableAutoPersist();

const TAB_NAV_KEY: Record<string, string> = {
  Settings: "app.nav.settings",
  Wizard: "app.nav.wizard",
  Scenes: "app.nav.scenes",
  Code: "app.nav.code",
  Text: "app.nav.text",
  Image: "app.nav.image",
  Sprites: "app.nav.sprites",
  Audio: "app.nav.audio",
  Video: "app.nav.video",
  "Unity MCP": "app.nav.unityMcp",
  "Unity Lighting": "app.nav.unityLighting",
  "Unity Camera": "app.nav.unityCamera",
  "Unity Materials": "app.nav.unityMaterials",
  "Unity Animations": "app.nav.unityAnimations",
  "Unity UI": "app.nav.unityUi",
  "Unity Physics": "app.nav.unityPhysics",
  "Unity Project": "app.nav.unityProject",
  Logs: "app.nav.logs",
};

const getTabIcon = (tab: string) => {
  switch (tab) {
    case "Settings":
      return "mdi-cog-outline";
    case "Scenes":
      return "mdi-view-dashboard-outline";
    case "Code":
      return "mdi-xml";
    case "Text":
      return "mdi-text-box-outline";
    case "Image":
      return "mdi-image-outline";
    case "Sprites":
      return "mdi-grid";
    case "Audio":
      return "mdi-volume-high";
    case "Video":
      return "mdi-movie-open";
    case "Wizard":
      return "mdi-wizard-hat";
    case "Unity MCP":
      return "mdi-unity";
    case "Unity Lighting":
      return "mdi-lightbulb-on";
    case "Unity Camera":
      return "mdi-camera";
    case "Unity Materials":
      return "mdi-palette";
    case "Unity Animations":
      return "mdi-animation-play";
    case "Unity UI":
      return "mdi-palette-outline";
    case "Unity Physics":
      return "mdi-atom";
    case "Unity Project":
      return "mdi-unity";
    case "Logs":
      return "mdi-text-box-search-outline";
    default:
      return "mdi-circle-medium";
  }
};

let unsubscribeNewProject: (() => void) | undefined;
let unsubscribeOpenProject: (() => void) | undefined;

async function handleNewProject() {
  try {
    resetSessionProject("UnityProject");
    await nextTick();
    clearActiveProject();
    unityUi.reset();
    unityUi.status = "New project started (UI state reset).";
    unityUi.tone = "ok";
    setActive("Unity Project");
  } catch {
    setActive("Unity Project");
  }
  try {
    store.$reset();
    void store.load(true);
  } catch {
    // ignore
  }
}

async function handleOpenProject(projectPath: string) {
  await loadProject(projectPath);
  setActive("Unity Project");
}

onMounted(() => {
  if (window.electronAPI) {
    const api = window.electronAPI as ElectronAPI;
    unsubscribeNewProject = api.onMenuNewProject(handleNewProject);
    unsubscribeOpenProject = api.onMenuOpenProject(handleOpenProject);
  }
});

onUnmounted(() => {
  if (unsubscribeNewProject) unsubscribeNewProject();
  if (unsubscribeOpenProject) unsubscribeOpenProject();
});
</script>

<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" permanent width="260" color="surface" border="0" class="app-sidebar">
      <div class="pa-6 d-flex align-center">
        <v-icon color="primary" size="32" class="mr-3">mdi-gravity</v-icon>
        <div class="flex-grow-1 min-width-0">
          <v-text-field :key="sessionProjectResetKey" v-model="projectName" variant="plain" hide-details density="compact"
            class="project-name-field text-h6 font-weight-bold line-height-1" placeholder="Project name" />
          <div class="d-flex align-center">
            <v-badge dot :color="backendStatus === 'online' ? 'success' : 'error'" inline class="mr-2"></v-badge>
            <span class="text-caption text-grey">{{ backendStatus === 'online' ? t('app.status.online') : t('app.status.offline') }}</span>
          </div>
        </div>
      </div>

      <v-divider class="mx-4 mb-4" opacity="0.25"></v-divider>

      <v-list nav density="comfortable">
        <v-list-item v-for="tab in tabs.filter(t => t !== 'Management')" :key="tab" :active="tab === active"
          :prepend-icon="getTabIcon(tab)" :title="t(TAB_NAV_KEY[tab] ?? tab)" :data-testid="`nav-${tab.replace(/\s+/g, '-')}`" rounded="xl"
          class="mb-1 nav-item" @click="setActive(tab)" color="primary"></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4 d-flex flex-column gap-2">
          <ThemeToggle />
          <v-btn variant="tonal" block prepend-icon="mdi-github" size="small" class="text-none" rounded="lg"
            href="https://github.com/Ozymandros/Unity-Generator" target="_blank">
            {{ t('app.actions.repository') }}
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main class="app-main">
      <v-container fluid class="pa-0 h-100">
        <v-fade-transition hide-on-leave>
          <div :key="active" class="content-wrapper">
            <SettingsPanel v-if="active === 'Settings'" @switch-tab="setActive" />
            <WizardPanel v-else-if="active === 'Wizard'" />
            <ScenesPanel v-else-if="active === 'Scenes'" />
            <CodePanel v-else-if="active === 'Code'" />
            <TextPanel v-else-if="active === 'Text'" />
            <ImagePanel v-else-if="active === 'Image'" />
            <SpritesPanel v-else-if="active === 'Sprites'" />
            <AudioPanel v-else-if="active === 'Audio'" />
            <VideoPanel v-else-if="active === 'Video'" />
            <UnityMcpHubPanel v-else-if="active === 'Unity MCP'" :on-navigate="setActive" />
            <UnityLightingPanel v-else-if="active === 'Unity Lighting'" />
            <UnityCameraPanel v-else-if="active === 'Unity Camera'" />
            <UnityMaterialsPanel v-else-if="active === 'Unity Materials'" />
            <UnityAnimationsPanel v-else-if="active === 'Unity Animations'" />
            <UnityUIPanel v-else-if="active === 'Unity UI'" />
            <UnityPhysicsPanel v-else-if="active === 'Unity Physics'" />
            <UnityProjectPanel v-else-if="active === 'Unity Project'" />
            <LogsPanel v-else-if="active === 'Logs'" />
          </div>
        </v-fade-transition>
      </v-container>
    </v-main>
  </v-app>
</template>

<style src="./App.css"></style>
