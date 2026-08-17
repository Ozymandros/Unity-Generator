<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { useVideoPanel } from "./VideoPanel";

const { t } = useI18n();
const {
  prompt, provider, duration, resolution, aspectRatio,
  status, tone, result, loading, canGenerate, run, providerOptions,
} = useVideoPanel();
</script>

<template>
  <div class="panel pa-6">
    <h2>{{ t('video.title') }}</h2>
    <p class="text-medium-emphasis mb-4">{{ t('video.subtitle') }}</p>
    <StatusBanner :status="status" :tone="tone" />

    <SmartField :label="t('common.prompt')" type="textarea" v-model="prompt" :rows="4" class="mb-4" />
    <SmartField :label="t('common.provider')" type="select" v-model="provider" :options="providerOptions" class="mb-4" />

    <div class="d-flex gap-3 mb-4">
      <SmartField :label="t('video.duration')" type="number" v-model.number="duration" class="flex-grow-1" />
      <SmartField :label="t('video.resolution')" type="select" v-model="resolution"
        :options="[{ value: '720p', label: '720p' }, { value: '1080p', label: '1080p' }]" class="flex-grow-1" />
      <SmartField :label="t('video.aspectRatio')" type="select" v-model="aspectRatio"
        :options="[{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }]" class="flex-grow-1" />
    </div>

    <v-btn color="primary" block rounded="pill" prepend-icon="mdi-movie-open" :loading="loading" :disabled="!canGenerate" @click="run">
      {{ t('video.actions.generate') }}
    </v-btn>

    <v-alert v-if="result?.content" type="info" variant="tonal" class="mt-4">{{ result.content }}</v-alert>
  </div>
</template>

<style scoped>
.panel { max-width: 960px; margin: 0 auto; }
</style>
