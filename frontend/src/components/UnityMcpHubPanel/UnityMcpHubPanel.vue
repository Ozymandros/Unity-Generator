<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getUnityMcpStatus } from "@/api/client";
import { useIntelligenceStore } from "@/store/intelligenceStore";

const props = defineProps<{ onNavigate?: (tab: string) => void }>();
const { t } = useI18n();
const store = useIntelligenceStore();

const mcpStatus = ref<Record<string, unknown> | null>(null);
const toolCount = ref(0);

const cards = [
  { tab: "Wizard", icon: "mdi-wizard-hat", key: "wizard" },
  { tab: "Scenes", icon: "mdi-view-dashboard-outline", key: "scenes" },
  { tab: "Unity Lighting", icon: "mdi-lightbulb-on", key: "lighting" },
  { tab: "Unity Camera", icon: "mdi-camera", key: "camera" },
  { tab: "Unity Materials", icon: "mdi-palette", key: "materials" },
  { tab: "Unity Animations", icon: "mdi-animation-play", key: "animations" },
  { tab: "Unity UI", icon: "mdi-palette-outline", key: "ui" },
  { tab: "Unity Physics", icon: "mdi-atom", key: "physics" },
];

onMounted(async () => {
  await store.load(true);
  toolCount.value = store.unityToolNames.length;
  try {
    const response = await getUnityMcpStatus();
    if (response.success && response.data) mcpStatus.value = response.data;
  } catch {
    mcpStatus.value = null;
  }
});

function navigate(tab: string) {
  props.onNavigate?.(tab);
}
</script>

<template>
  <div class="panel pa-6">
    <h2>{{ t('unityMcpHub.title') }}</h2>
    <p class="text-medium-emphasis mb-4">{{ t('unityMcpHub.subtitle') }}</p>

    <v-alert v-if="mcpStatus" :type="mcpStatus.available ? 'success' : 'warning'" variant="tonal" class="mb-4">
      {{ mcpStatus.available ? t('unityMcpHub.statusOnline') : t('unityMcpHub.statusOffline') }}
      <span v-if="toolCount"> — {{ t('unityMcpHub.toolCount', { n: toolCount }) }}</span>
    </v-alert>

    <v-row>
      <v-col v-for="card in cards" :key="card.tab" cols="12" sm="6" md="4">
        <v-card variant="outlined" class="pa-4 h-100 cursor-pointer" @click="navigate(card.tab)">
          <div class="d-flex align-center mb-2">
            <v-icon :icon="card.icon" color="primary" class="mr-2" />
            <span class="text-subtitle-1 font-weight-medium">{{ t(`unityMcpHub.cards.${card.key}`) }}</span>
          </div>
          <p class="text-caption text-medium-emphasis">{{ t(`unityMcpHub.descriptions.${card.key}`) }}</p>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.panel { max-width: 1100px; margin: 0 auto; }
.cursor-pointer { cursor: pointer; }
</style>
