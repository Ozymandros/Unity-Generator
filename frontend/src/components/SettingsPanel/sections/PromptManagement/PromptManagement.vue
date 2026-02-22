<script setup lang="ts">
import { usePromptManagement } from "./PromptManagement";

const {
  prompts,
  promptModalities,
  isLoading,
  status,
  handleSave
} = usePromptManagement();
</script>

<template>
  <div class="section-container">
    <div class="d-flex align-center mb-8">
      <v-icon color="success" size="36" class="mr-4">mdi-script-text</v-icon>
      <h2 class="text-h4 font-weight-bold">System Prompts</h2>
    </div>

    <v-skeleton-loader v-if="isLoading" type="card@2" class="bg-transparent"></v-skeleton-loader>
    
    <div v-else>
      <v-row>
        <v-col v-for="mod in promptModalities" :key="mod" cols="12" md="6">
          <v-card variant="flat" border class="rounded-xl overflow-hidden d-flex flex-column prompt-card">
            <v-toolbar density="compact" color="surface" flat border="bottom">
              <v-chip class="ml-4 font-weight-black" color="success" size="x-small" variant="flat">{{ mod.toUpperCase() }}</v-chip>
              <v-spacer></v-spacer>
              <v-btn icon="mdi-content-save-check" size="small" variant="text" color="success" @click="handleSave(mod)" title="Save changes"></v-btn>
            </v-toolbar>
            <v-textarea
              v-model="prompts[mod]"
              rows="10"
              variant="plain"
              class="px-4 prompt-editor"
              no-resize
              placeholder="Define the core instructions and constraints for this modality..."
              bg-color="transparent"
              hide-details
            ></v-textarea>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-snackbar :model-value="!!status" @update:model-value="val => !val && (status = null)" location="bottom right" rounded="pill">
      {{ status }}
      <template v-slot:actions>
        <v-btn color="success" variant="text" @click="status = null">OK</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.section-container {
  max-width: 1200px;
}

.prompt-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: rgba(255, 255, 255, 0.02) !important;
}

.prompt-card:hover {
  border-color: rgba(var(--v-theme-success), 0.5) !important;
}

.prompt-editor :deep(textarea) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
  font-size: 0.85rem !important;
  line-height: 1.6 !important;
  padding-top: 16px !important;
  padding-bottom: 16px !important;
}
</style>
