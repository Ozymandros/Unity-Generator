<script setup lang="ts">
import { onMounted, ref } from "vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import CodePanel from "./components/CodePanel.vue";
import TextPanel from "./components/TextPanel.vue";
import ImagePanel from "./components/ImagePanel.vue";
import AudioPanel from "./components/AudioPanel.vue";
import UnityProjectPanel from "./components/UnityProjectPanel.vue";
import { healthCheck } from "./api/client";
import SpritesPanel from "./components/SpritesPanel.vue";

const tabs = [
  "Settings",
  "Code",
  "Text",
  "Image",
  "Sprites",
  "Audio",
  "Unity Project",
] as const;
const active = ref<(typeof tabs)[number]>("Settings");
const backendStatus = ref<"online" | "offline">("offline");

const setActive = (tab: (typeof tabs)[number]) => {
  active.value = tab;
  return active.value;
};

onMounted(async () => {
  try {
    const response = await healthCheck();
    backendStatus.value = response.status === "ok" ? "online" : "offline";
  } catch {
    backendStatus.value = "offline";
  }
});
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
      <SettingsPanel v-if="active === 'Settings'" />
      <CodePanel v-else-if="active === 'Code'" />
      <TextPanel v-else-if="active === 'Text'" />
      <ImagePanel v-else-if="active === 'Image'" />
      <SpritesPanel v-else-if="active === 'Sprites'" />
      <AudioPanel v-else-if="active === 'Audio'" />
      <UnityProjectPanel v-else-if="active === 'Unity Project'" />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
aside {
  background: #0f172a;
  color: white;
  padding: 24px 16px;
}
.status {
  margin-top: 6px;
  font-size: 0.85rem;
}
.status.online {
  color: #86efac;
}
.status.offline {
  color: #fca5a5;
}
nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}
button {
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  background: #1e293b;
  color: white;
  cursor: pointer;
  text-align: left;
}
button.active {
  background: #2563eb;
}
main {
  padding: 24px;
  background: #f8fafc;
}
</style>
