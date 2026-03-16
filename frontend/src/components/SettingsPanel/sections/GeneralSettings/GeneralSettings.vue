<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useGeneralSettings } from "./GeneralSettings";
import { useLocale } from "@/composables/useLocale";
import { useTheme } from "@/composables/useTheme";
import type { ThemeMode } from "@/composables/useTheme";

const { t } = useI18n();
const { currentLocale, setLocale, localeOptions } = useLocale();
const { themeMode, setThemeMode } = useTheme();

const {
  backendUrl,
  defaultBackendUrl,
  outputBasePath,
  unityEditorPath,
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

const themeOptions: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "light", label: t("theme.light"), icon: "mdi-weather-sunny" },
  { value: "dark",  label: t("theme.dark"),  icon: "mdi-weather-night" },
  { value: "system",label: t("theme.system"),icon: "mdi-monitor" },
];
</script>

<template>
  <div class="section-container">
    <div class="d-flex align-center mb-8">
      <v-icon color="primary" size="36" class="mr-4">mdi-cog-outline</v-icon>
      <h2 class="text-h4 font-weight-bold">{{ t('general.title') }}</h2>
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

    <!-- Network & API -->
    <v-card variant="flat" border class="pa-6 rounded-xl mb-6 bg-surface">
      <div class="text-overline mb-4 text-primary">{{ t('general.sections.networkApi') }}</div>
      <v-text-field
        v-model="backendUrl"
        :label="t('general.fields.backendUrl')"
        :placeholder="defaultBackendUrl"
        variant="outlined"
        persistent-hint
        :hint="t('general.fields.backendUrlHint')"
        rounded="lg"
      />
      <v-text-field
        v-model="outputBasePath"
        :label="t('general.fields.outputBasePath')"
        placeholder="./output"
        variant="outlined"
        persistent-hint
        :hint="t('general.fields.outputBasePathHint')"
        rounded="lg"
        class="mt-4"
      />
      <v-text-field
        v-model="unityEditorPath"
        :label="t('general.fields.unityEditorPath')"
        placeholder="Auto-detected from Unity Hub"
        variant="outlined"
        persistent-hint
        :hint="t('general.fields.unityEditorPathHint')"
        rounded="lg"
        class="mt-4"
        prepend-inner-icon="mdi-unity"
        clearable
      />
    </v-card>

    <!-- Preferred Intelligence -->
    <v-card variant="flat" border class="pa-6 rounded-xl mb-6 bg-surface">
      <div class="text-overline mb-4 text-primary">{{ t('general.sections.preferredIntelligence') }}</div>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredLlm"
            :label="t('general.fields.preferredLlm')"
            :items="providers.filter(p => p.modalities.includes('llm'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          />
          <v-select
            v-model="preferredLlmModel"
            :label="t('general.fields.preferredLlmModel')"
            :items="llmModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredLlm || llmModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredImage"
            :label="t('general.fields.preferredImage')"
            :items="providers.filter(p => p.modalities.includes('image'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          />
          <v-select
            v-model="preferredImageModel"
            :label="t('general.fields.preferredImageModel')"
            :items="imageModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredImage || imageModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredAudio"
            :label="t('general.fields.preferredAudio')"
            :items="providers.filter(p => p.modalities.includes('audio'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          />
          <v-select
            v-model="preferredAudioModel"
            :label="t('general.fields.preferredAudioModel')"
            :items="audioModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredAudio || audioModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="preferredMusic"
            :label="t('general.fields.preferredMusic')"
            :items="providers.filter(p => p.modalities.includes('music'))"
            item-title="name"
            item-value="name"
            rounded="lg"
            variant="outlined"
            density="comfortable"
          />
          <v-select
            v-model="preferredMusicModel"
            :label="t('general.fields.preferredMusicModel')"
            :items="musicModels"
            item-title="label"
            item-value="value"
            :disabled="!preferredMusic || musicModels.length === 0"
            rounded="lg"
            variant="outlined"
            density="compact"
            class="mt-n2"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Appearance: Theme + Language -->
    <v-card variant="flat" border class="pa-6 rounded-xl mb-6 bg-surface">
      <div class="text-overline mb-4 text-primary">{{ t('general.sections.appearance') }}</div>
      <v-row>
        <v-col cols="12" sm="6">
          <v-select
            :model-value="themeMode"
            :label="t('general.fields.theme')"
            :items="themeOptions"
            item-title="label"
            item-value="value"
            rounded="lg"
            variant="outlined"
            density="comfortable"
            @update:model-value="setThemeMode"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-icon class="mr-2">{{ item.raw.icon }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            :model-value="currentLocale"
            :label="t('general.fields.language')"
            :items="localeOptions"
            item-title="label"
            item-value="value"
            rounded="lg"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-translate"
            @update:model-value="setLocale"
          />
        </v-col>
      </v-row>
    </v-card>

    <div class="mt-8 d-flex justify-end">
      <v-btn
        color="primary"
        size="large"
        rounded="pill"
        prepend-icon="mdi-content-save-check"
        class="px-8 shadow-highlight"
        @click="save"
      >
        {{ t('general.actions.saveAll') }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped src="./GeneralSettings.css"></style>
