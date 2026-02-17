<script setup lang="ts">
import ScenesPanel from "@/components/ScenesPanel.vue";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CodePanel } from "@/components/CodePanel";
import { TextPanel } from "@/components/TextPanel";
import { ImagePanel } from "@/components/ImagePanel";
import { AudioPanel } from "@/components/AudioPanel";
import { SpritesPanel } from "@/components/SpritesPanel";
import { UnityProjectPanel } from "@/components/UnityProjectPanel";
import { useApp } from "@/App";

const { tabs, active, backendStatus, setActive } = useApp();
</script>

<template>
  <div class="layout">
    <aside>
      <h1>Unity Generator</h1>
      <p class="status" :class="backendStatus">
        Backend: {{ backendStatus }}
      </p>
      <nav>
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="{ active: tab === active }"
          @click="setActive(tab)"
        >
          {{ tab }}
        </button>
      </nav>
    </aside>
    <main>
      <ScenesPanel v-if="active === 'Scenes'" />
      <SettingsPanel v-else-if="active === 'Settings'" />
      <CodePanel v-else-if="active === 'Code'" />
      <TextPanel v-else-if="active === 'Text'" />
      <ImagePanel v-else-if="active === 'Image'" />
      <SpritesPanel v-else-if="active === 'Sprites'" />
      <AudioPanel v-else-if="active === 'Audio'" />
      <UnityProjectPanel v-else-if="active === 'Unity Project'" />
    </main>
  </div>
</template>

<style scoped src="./App.css"></style>

