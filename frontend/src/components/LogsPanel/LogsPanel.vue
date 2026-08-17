<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getLogTail } from "@/api/client";

const { t } = useI18n();
const lines = ref<string[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function refresh(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const response = await getLogTail(300);
    if (response.success && response.data?.lines) {
      lines.value = response.data.lines as string[];
    } else {
      error.value = response.error || t('logs.loadFailed');
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="panel pa-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2>{{ t('logs.title') }}</h2>
        <p class="text-medium-emphasis">{{ t('logs.subtitle') }}</p>
      </div>
      <v-btn prepend-icon="mdi-refresh" variant="tonal" :loading="loading" @click="refresh">{{ t('logs.refresh') }}</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-card variant="outlined" class="log-view pa-4">
      <pre v-if="lines.length" class="log-text">{{ lines.join('\n') }}</pre>
      <p v-else class="text-medium-emphasis">{{ t('common.waitingForLogs') }}</p>
    </v-card>
  </div>
</template>

<style scoped>
.panel { max-width: 1100px; margin: 0 auto; }
.log-view { max-height: 70vh; overflow: auto; background: #0d1117; }
.log-text { color: #c9d1d9; font-family: 'JetBrains Mono', monospace; font-size: 12px; white-space: pre-wrap; margin: 0; }
</style>
