<script setup lang="ts">
import { useProviderManagement } from "./ProviderManagement";

const {
  providers,
  selectedProvider,
  isLoading,
  status,
  saveSelected,
  deleteSelected,
  initiateAdd,
  selectProvider,
  modelModalities
} = useProviderManagement();
</script>

<template>
  <div class="section-container providers-layout">
    <v-row class="h-100" no-gutters>
      <!-- Left: Provider List -->
      <v-col cols="12" md="4" lg="3" class="border-right pr-4">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="text-overline">Engines</div>
          <v-btn
            icon="mdi-plus"
            variant="tonal"
            size="x-small"
            color="primary"
            @click="initiateAdd"
            title="Register New Provider"
          ></v-btn>
        </div>

        <v-list nav v-if="providers.length > 0">
          <v-list-item
            v-for="p in providers"
            :key="p.name"
            :active="selectedProvider?.name === p.name"
            @click="selectProvider(p)"
            rounded="lg"
            class="mb-1"
            color="primary"
          >
            <v-list-item-title class="font-weight-medium">{{ p.name }}</v-list-item-title>
            <template v-slot:append>
              <v-icon size="14" v-if="p.openai_compatible" title="OpenAI Compatible">mdi-swap-horizontal</v-icon>
            </template>
          </v-list-item>
        </v-list>

        <v-skeleton-loader v-else-if="isLoading" type="list-item@5" class="bg-transparent"></v-skeleton-loader>

        <div v-else class="text-center py-8 text-grey text-caption italic">
          No providers registered.
        </div>
      </v-col>

      <!-- Right: Provider Details -->
      <v-col cols="12" md="8" lg="9" class="pl-6">
        <div v-if="selectedProvider">
          <div class="d-flex align-center justify-space-between mb-8">
            <h3 class="text-h4 font-weight-bold pt-2">
              {{ selectedProvider.name || 'Register Workspace' }}
            </h3>
            <v-btn
              v-if="selectedProvider.name"
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete-outline"
              size="small"
              rounded="pill"
              @click="deleteSelected"
            >
              Deregister
            </v-btn>
          </div>

          <v-form @submit.prevent="saveSelected">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="selectedProvider.name"
                  label="Unique ID"
                  variant="outlined"
                  density="compact"
                  :disabled="!!providers.find(p => p.name === selectedProvider?.name && selectedProvider?.name !== '')"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="selectedProvider.api_key_name"
                  label="Key Store Handle"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g. openai_api_key"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="selectedProvider.api_key_value"
                  label="Secret API Key"
                  type="password"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-key"
                  persistent-hint
                  hint="Managed directly inside this provider configuration"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="selectedProvider.base_url"
                  label="Intelligence API Endpoint"
                  variant="outlined"
                  density="compact"
                  placeholder="https://api.openai.com/v1"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>
            <div class="text-overline mb-4 text-primary">Protocol & Features</div>

            <v-row dense class="mb-6">
              <v-col cols="12" sm="6" lg="4">
                <v-checkbox v-model="selectedProvider.openai_compatible" label="OpenAI Compatibility" hide-details></v-checkbox>
                <v-checkbox v-model="selectedProvider.requires_api_key" label="Authentication Required" hide-details></v-checkbox>
              </v-col>
              <v-col cols="12" sm="6" lg="4">
                <v-checkbox v-model="selectedProvider.supports_vision" label="Vision (Multi-modal)" hide-details></v-checkbox>
                <v-checkbox v-model="selectedProvider.supports_streaming" label="Real-time Streaming" hide-details></v-checkbox>
              </v-col>
              <v-col cols="12" sm="6" lg="4">
                <v-checkbox v-model="selectedProvider.supports_function_calling" label="Function Calling" hide-details></v-checkbox>
                <v-checkbox v-model="selectedProvider.supports_tool_use" label="Generic Tool Use" hide-details></v-checkbox>
              </v-col>
            </v-row>

            <v-select
              v-model="selectedProvider.modalities"
              label="Enabled Modalities"
              :items="modelModalities"
              multiple
              chips
              closable-chips
              variant="outlined"
            ></v-select>

            <div class="mt-8 d-flex justify-end">
              <v-btn
                color="primary"
                rounded="pill"
                @click="saveSelected"
                :loading="isLoading"
                prepend-icon="mdi-check"
                class="px-8 shadow-highlight"
              >
                Commit Changes
              </v-btn>
            </div>
          </v-form>
        </div>

        <div v-else class="d-flex flex-column align-center justify-center py-16 text-grey text-center">
          <v-icon size="80" class="mb-4 opacity-20">mdi-molecule</v-icon>
          <div class="text-h6 font-weight-light">Select a provider engine to configure</div>
          <v-btn
            variant="outlined"
            color="primary"
            rounded="pill"
            class="mt-6"
            @click="initiateAdd"
          >
            Register New Engine
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Feedback Snackbar -->
    <v-snackbar :model-value="!!status" @update:model-value="val => !val && (status = null)" color="surface-variant" rounded="pill" location="bottom right">
      {{ status }}
      <template v-slot:actions>
        <v-btn color="primary" variant="text" @click="status = null">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped src="./ProviderManagement.css"></style>
