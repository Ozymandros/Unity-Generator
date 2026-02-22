<script setup lang="ts">
import { useModelManagement } from "./ModelManagement";

const {
  providers,
  selectedProviderName,
  models,
  isLoading,
  status,
  newModel,
  modelModalities,
  handleAdd,
  handleRemove
} = useModelManagement();

const headers = [
  { title: 'Friendly Name', key: 'label' },
  { title: 'Engine Value', key: 'value' },
  { title: 'Modality', key: 'modality' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];
</script>

<template>
  <div class="section-container">
    <div class="d-flex align-center justify-space-between mb-8 mt-2">
      <div class="d-flex align-center">
        <v-icon color="secondary" size="36" class="mr-4">mdi-robot-outline</v-icon>
        <h2 class="text-h4 font-weight-bold">Model Registration</h2>
      </div>
      
      <v-select
        v-model="selectedProviderName"
        :items="providers"
        item-title="name"
        item-value="name"
        label="Context Provider"
        variant="outlined"
        density="comfortable"
        hide-details
        style="max-width: 320px"
        rounded="lg"
        class="mt-1"
      ></v-select>
    </div>

    <v-card variant="flat" border class="rounded-xl overflow-hidden mb-6">
      <v-data-table
        :headers="headers"
        :items="models"
        :loading="isLoading"
        class="bg-transparent"
        density="comfortable"
      >
        <template v-slot:item.modality="{ item }">
          <v-chip
            size="x-small"
            :color="item.modality === 'llm' ? 'primary' : 'secondary'"
            variant="flat"
            class="text-uppercase font-weight-bold"
          >
            {{ item.modality }}
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-trash-can-outline"
            variant="text"
            size="small"
            color="error"
            @click="handleRemove(item.value)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-card variant="flat" color="surface-variant" class="pa-6 rounded-xl">
      <div class="text-overline mb-4">Register New Endpoint</div>
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="newModel.label"
            label="Label"
            placeholder="e.g. GPT-4o Mini"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="newModel.value"
            label="Value / ID"
            placeholder="gpt-4o-mini"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="newModel.modality"
            label="Type"
            :items="modelModalities"
            variant="outlined"
            density="comfortable"
          ></v-select>
        </v-col>
      </v-row>
      <div class="d-flex justify-end mt-4">
        <v-btn
          color="secondary"
          rounded="pill"
          prepend-icon="mdi-plus"
          @click="handleAdd"
          class="px-6"
        >
          Add to Provider
        </v-btn>
      </div>
    </v-card>

    <v-snackbar :model-value="!!status" @update:model-value="val => !val && (status = null)" location="bottom right" rounded="pill">
      {{ status }}
      <template v-slot:actions>
        <v-btn color="primary" variant="text" @click="status = null">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.text-overline {
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
  color: rgba(var(--v-theme-secondary), 0.8) !important;
}
</style>
