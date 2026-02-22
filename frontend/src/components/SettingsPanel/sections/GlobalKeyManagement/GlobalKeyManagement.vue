<script setup lang="ts">
import { useGlobalKeyManagement } from "./GlobalKeyManagement";

const {
  isLoading,
  status,
  showAddDialog,
  newKey,
  handleSave,
  handleDelete,
  formattedKeys
} = useGlobalKeyManagement();

const headers = [
  { title: 'Service Handle', key: 'name' },
  { title: 'Active Secret', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];
</script>

<template>
  <div class="section-container">
    <div class="d-flex align-center justify-space-between mb-8">
      <div class="d-flex align-center">
        <v-icon color="warning" size="36" class="mr-4">mdi-key-chain</v-icon>
        <h2 class="text-h4 font-weight-bold">Intelligence Keys</h2>
      </div>
      
      <v-btn
        color="warning"
        variant="elevated"
        rounded="pill"
        prepend-icon="mdi-key-plus"
        @click="showAddDialog = true"
        size="large"
        class="px-6"
      >
        Store New Secret
      </v-btn>
    </div>

    <v-card variant="flat" border class="rounded-xl overflow-hidden mb-6">
      <v-data-table
        :headers="headers"
        :items="formattedKeys"
        :loading="isLoading"
        class="bg-transparent"
        density="comfortable"
      >
        <template v-slot:item.status="{ item }">
          <code class="px-2 py-1 rounded bg-surface-variant font-weight-medium" style="font-size: 0.75rem">
            {{ item.status }}
          </code>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-delete-sweep-outline"
            variant="text"
            size="small"
            color="error"
            @click="handleDelete(item.name)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-alert type="info" variant="tonal" border="start" class="rounded-lg">
      Keys managed here are stored securely on the backend and shared across providers using the same "Handle".
    </v-alert>

    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card class="rounded-xl pa-4" color="surface">
        <v-card-title class="text-h5 font-weight-bold">New Global Secret</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newKey.name"
            label="Service ID"
            placeholder="e.g. anthropic"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model="newKey.value"
            label="Key Value"
            type="password"
            variant="outlined"
            prepend-inner-icon="mdi-lock-outline"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="px-6 pb-6 pt-2">
          <v-spacer></v-spacer>
          <v-btn variant="text" rounded="pill" @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" rounded="pill" class="px-6" @click="handleSave">Store Key</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar :model-value="!!status" @update:model-value="val => !val && (status = null)" location="bottom right" rounded="pill">
      {{ status }}
      <template v-slot:actions>
        <v-btn color="warning" variant="text" @click="status = null">Dismiss</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
