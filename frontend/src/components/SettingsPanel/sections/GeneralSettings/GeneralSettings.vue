<script setup lang="ts">
import { useGeneralSettings } from "./GeneralSettings";

const {
  backendUrl,
  preferredLlm,
  preferredImage,
  preferredAudio,
  preferredMusic,
  status,
  save,
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  AUDIO_PROVIDERS
} = useGeneralSettings();
</script>

<template>
  <div class="section-container">
    <div class="d-flex align-center mb-8">
      <v-icon color="primary" size="36" class="mr-4">mdi-cog-outline</v-icon>
      <h2 class="text-h4 font-weight-bold">General Preferences</h2>
    </div>

    <v-alert
      v-if="status"
      :type="status.includes('failed') || status.includes('error') ? 'error' : 'success'"
      variant="tonal"
      class="mb-6"
      density="comfortable"
    >
      {{ status }}
    </v-alert>

    <v-card variant="flat" border class="pa-6 rounded-xl mb-6 bg-surface">
      <div class="text-overline mb-4 text-primary">Network & API</div>
      <v-text-field
        v-model="backendUrl"
        label="Backend URL"
        placeholder="http://127.0.0.1:8000"
        variant="outlined"
        persistent-hint
        hint="The address of your Unity Generator backend service"
        rounded="lg"
      ></v-text-field>
    </v-card>

    <v-card variant="flat" border class="pa-6 rounded-xl bg-surface">
      <div class="text-overline mb-4 text-primary">Preferred Intelligence</div>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredLlm"
            label="Default Text/Logic (LLM)"
            :items="TEXT_PROVIDERS"
            item-title="label"
            item-value="value"
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredImage"
            label="Default Image Generation"
            :items="IMAGE_PROVIDERS"
            item-title="label"
            item-value="value"
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredAudio"
            label="Default Speech (TTS)"
            :items="AUDIO_PROVIDERS.filter((p: any) => p.type !== 'music')"
            item-title="label"
            item-value="value"
            rounded="lg"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredMusic"
            label="Default Music Generation"
            :items="AUDIO_PROVIDERS.filter((p: any) => p.type === 'music')"
            item-title="label"
            item-value="value"
            rounded="lg"
          ></v-select>
        </v-col>
      </v-row>
    </v-card>

    <div class="mt-8 d-flex justify-end">
      <v-btn
        color="primary"
        size="large"
        rounded="pill"
        prepend-icon="mdi-content-save-check"
        @click="save"
        class="px-8 shadow-highlight"
      >
        Save All Changes
      </v-btn>
    </div>
  </div>
</template>

<style scoped src="./GeneralSettings.css"></style>
