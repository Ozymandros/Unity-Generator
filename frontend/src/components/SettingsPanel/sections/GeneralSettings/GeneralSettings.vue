<script setup lang="ts">
import { useGeneralSettings } from "./GeneralSettings";

const {
  backendUrl,
  defaultBackendUrl,
  outputBasePath,
  providers,
  preferredLlm,
  preferredLlmModel,
  llmModels,
  preferredImage,
  preferredImageModel,
  imageModels,
  preferredAudio,
  preferredAudioModel,
  audioModels,
  preferredMusic,
  preferredMusicModel,
  musicModels,
  status,
  statusType,
  save,
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
      :type="statusType === 'error' ? 'error' : statusType === 'info' ? 'info' : 'success'"
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
        :placeholder="defaultBackendUrl"
        variant="outlined"
        persistent-hint
        hint="The address of your Unity Generator backend service"
        rounded="lg"
      ></v-text-field>
      <v-text-field
        v-model="outputBasePath"
        label="Base path (output)"
        placeholder="./output"
        variant="outlined"
        persistent-hint
        hint="Relative path for generated Unity projects (e.g. ./output). Stored in database."
        rounded="lg"
        class="mt-4"
      ></v-text-field>
    </v-card>

    <v-card variant="flat" border class="pa-6 rounded-xl bg-surface">
      <div class="text-overline mb-4 text-primary">Preferred Intelligence</div>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredLlm"
            label="Default Text/Logic Provider"
            :items="providers.filter(p => p.modalities.includes('llm'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          ></v-select>
          <v-select
            v-model="preferredLlmModel"
            :label="preferredLlm ? `Model (for ${preferredLlm})` : 'Model (select a provider first)'"
            :items="llmModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredLlm || llmModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredImage"
            label="Default Image Generation Provider"
            :items="providers.filter(p => p.modalities.includes('image'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          ></v-select>
          <v-select
            v-model="preferredImageModel"
            :label="preferredImage ? `Model (for ${preferredImage})` : 'Model (select a provider first)'"
            :items="imageModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredImage || imageModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredAudio"
            label="Default Speech (TTS) Provider"
            :items="providers.filter(p => p.modalities.includes('audio'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          ></v-select>
          <v-select
            v-model="preferredAudioModel"
            :label="preferredAudio ? `Model (for ${preferredAudio})` : 'Model (select a provider first)'"
            :items="audioModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredAudio || audioModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredMusic"
            label="Default Music Generation Provider"
            :items="providers.filter(p => p.modalities.includes('music'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          ></v-select>
          <v-select
            v-model="preferredMusicModel"
            :label="preferredMusic ? `Model (for ${preferredMusic})` : 'Model (select a provider first)'"
            :items="musicModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredMusic || musicModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
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
