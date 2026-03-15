<script setup lang="ts">
// Menu event handlers for File > New Project and File > Open Project
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import SettingsPanel from "./components/SettingsPanel/SettingsPanel.vue";
import CodePanel from "./components/CodePanel/CodePanel.vue";
import TextPanel from "./components/TextPanel/TextPanel.vue";
import ImagePanel from "./components/ImagePanel/ImagePanel.vue";
import AudioPanel from "./components/AudioPanel/AudioPanel.vue";
import SpritesPanel from "./components/SpritesPanel/SpritesPanel.vue";
import UnityProjectPanel from "./components/UnityProjectPanel/UnityProjectPanel.vue";
import UnityUIPanel from "./components/UnityUIPanel/UnityUIPanel.vue";
import { useApp } from "./App";
import { useSessionProject } from "./composables/useSessionProject";
import { useOpenProject } from "./composables/useOpenProject";
import { useIntelligenceStore } from "./store/intelligenceStore";
import { clearActiveProject } from "./store/projectStore";
import { useUnityProjectUiStore } from "./store/unityProjectUiStore";
import ScenesPanel from "./components/ScenesPanel.vue";
import type { ElectronAPI } from "./types/electron";

const { tabs, active, backendStatus, setActive } = useApp();
const { projectName, sessionProjectResetKey, resetSessionProject } = useSessionProject();
const { loadProject } = useOpenProject();
const drawer = ref(true);
const store = useIntelligenceStore();
const unityUi = useUnityProjectUiStore();
unityUi.enableAutoPersist();

const getTabIcon = (tab: string) => {
  switch (tab) {
    case 'Settings': return 'mdi-cog-outline';
    case 'Scenes': return 'mdi-view-dashboard-outline';
    case 'Code': return 'mdi-xml';
    case 'Text': return 'mdi-text-box-outline';
    case 'Image': return 'mdi-image-outline';
    case 'Sprites': return 'mdi-grid';
    case 'Audio': return 'mdi-volume-high';
    case 'Unity UI': return 'mdi-palette-outline';
    case 'Unity Project': return 'mdi-unity';
    default: return 'mdi-circle-medium';
  }
};

// Menu event handlers
let unsubscribeNewProject: (() => void) | undefined;
let unsubscribeOpenProject: (() => void) | undefined;

/**
 * Handle "New Project" menu action.
 * Resets the frontend store and reloads all initial values from backend/DB.
 */
async function handleNewProject() {
  // Make UI reset synchronous and best-effort: never block on backend.
  try {
    // Reset session-scoped project fields deterministically
    resetSessionProject("UnityProject");
    await nextTick(); // Flush reactive updates so Project Name field (and key-based remount) apply before tab switch

    // Clear active project (auto-save target) stored in localStorage
    clearActiveProject();

    // Reset Unity Project UI state (persisted)
    unityUi.reset();
    unityUi.status = "New project started (UI state reset).";
    unityUi.tone = "ok";

    // Switch to Unity Project tab immediately
    setActive('Unity Project');
  } catch {
    // Best-effort: keep going even if storage is unavailable
    setActive('Unity Project');
  }

  // Optional: reload other app config in background (do not block UI reset)
  try {
    store.$reset();
    void store.load(true);
  } catch {
    // ignore
  }
}

/**
 * Handle "Open Project" menu action.
 * Delegates to the shared useOpenProject composable.
 */
async function handleOpenProject(projectPath: string) {
  await loadProject(projectPath);
  setActive('Unity Project');
}

onMounted(() => {
  // Register menu event listeners if running in Electron
  if (window.electronAPI) {
    const api = window.electronAPI as ElectronAPI;
    unsubscribeNewProject = api.onMenuNewProject(handleNewProject);
    unsubscribeOpenProject = api.onMenuOpenProject(handleOpenProject);
  }
});

onUnmounted(() => {
  // Clean up event listeners
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
            <span class="text-caption text-grey">{{ backendStatus === 'online' ? 'Online' : 'Offline' }}</span>
          </div>
        </div>
      </div>

      <v-divider class="mx-4 mb-4" opacity="0.25"></v-divider>

      <v-list nav density="comfortable">
        <v-list-item v-for="tab in tabs.filter(t => t !== 'Management')" :key="tab" :active="tab === active"
          :prepend-icon="getTabIcon(tab)" :title="tab" :data-testid="`nav-${tab.replace(/\s+/g, '-')}`" rounded="xl"
          class="mb-1 nav-item" @click="setActive(tab)" color="primary"></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn variant="tonal" block prepend-icon="mdi-github" size="small" class="text-none" rounded="lg"
            href="https://github.com/Ozymandros/Unity-Generator" target="_blank">
            Repository
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
            <ScenesPanel v-else-if="active === 'Scenes'" />
            <CodePanel v-else-if="active === 'Code'" />
            <TextPanel v-else-if="active === 'Text'" />
            <ImagePanel v-else-if="active === 'Image'" />
            <SpritesPanel v-else-if="active === 'Sprites'" />
            <AudioPanel v-else-if="active === 'Audio'" />
            <UnityUIPanel v-else-if="active === 'Unity UI'" />
            <UnityProjectPanel v-else-if="active === 'Unity Project'" />
          </div>
        </v-fade-transition>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
/* Global App Styles */
.line-height-1 {
  line-height: 1;
}

/* Sidebar project name: borderless by default, border on hover/focus */
.project-name-field :deep(.v-field__overlay) {
  opacity: 0;
}

.project-name-field:hover :deep(.v-field__overlay),
.project-name-field.v-field--focused :deep(.v-field__overlay) {
  opacity: 1;
}

.project-name-field :deep(.v-field) {
  --v-field-border-opacity: 0;
}

.project-name-field:hover :deep(.v-field),
.project-name-field.v-field--focused :deep(.v-field) {
  --v-field-border-opacity: 0.6;
}

.app-sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.nav-item {
  transition: all 0.2s ease;
}

.nav-item.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.15) !important;
}

/* Increase contrast for outlined inputs */
:deep(.v-field--variant-outlined) {
  --v-field-border-opacity: 0.5 !important;
}

:deep(.v-field--focused.v-field--variant-outlined) {
  --v-field-border-opacity: 1 !important;
}

:deep(.v-label.v-field-label) {
  opacity: 0.9 !important;
  color: #ffffff !important;
  font-weight: 500 !important;
}

:deep(.v-field--focused .v-label.v-field-label) {
  opacity: 1 !important;
  color: var(--v-theme-primary) !important;
}

:deep(.v-field__input::placeholder) {
  opacity: 0.5 !important;
  color: #ffffff !important;
}

:deep(.v-checkbox .v-label) {
  opacity: 1 !important;
  color: #ffffff !important;
  font-weight: 500 !important;
}

/* Global Data Table Adjustments */
:deep(.v-data-table) {
  background: transparent !important;
}

:deep(.v-data-table-header__content) {
  font-weight: 800 !important;
  color: #ffffff !important;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.app-main {
  background: transparent;
}

/* Ensure our dark theme stays consistent */
.v-theme--unityDarkTheme .app-main {
  background: #0f172a !important;
}

/* Global Scrollbar Styles */
:root {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.2) transparent;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.4);
}

.content-wrapper {
  height: 100%;
  overflow-y: auto;
}
</style>
