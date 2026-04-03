<script setup lang="ts">
import { ref, onMounted } from "vue";
import { listModels, addModel, removeModel } from "@/api/client";

const props = defineProps<{
  provider: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "models-changed"): void;
}>();

const models = ref<{ value: string; label: string }[]>([]);
const newModelValue = ref("");
const newModelLabel = ref("");
const loading = ref(false);
const error = ref("");

async function fetchModels() {
  loading.value = true;
  try {
    models.value = await listModels(props.provider);
  } catch {
    error.value = "Failed to load models";
  } finally {
    loading.value = false;
  }
}

async function handleAddModel() {
  if (!newModelValue.value || !newModelLabel.value) return;
  try {
    await addModel(props.provider, newModelValue.value, newModelLabel.value);
    newModelValue.value = "";
    newModelLabel.value = "";
    await fetchModels();
    emit("models-changed");
  } catch {
    error.value = "Failed to add model";
  }
}

async function handleRemoveModel(value: string) {
  try {
    await removeModel(props.provider, value);
    await fetchModels();
    emit("models-changed");
  } catch {
    error.value = "Failed to remove model";
  }
}

onMounted(fetchModels);
</script>

<template>
  <div class="modal-overlay" @click.self="emit('update:modelValue', false)">
    <div class="modal-content">
      <header>
        <h3>Manage Models for {{ provider }}</h3>
        <button class="close-btn" @click="emit('update:modelValue', false)">&times;</button>
      </header>

      <div class="model-list">
        <div v-if="loading">Loading models...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="models.length === 0">No custom models found.</div>
        <ul v-else>
          <li v-for="m in models" :key="m.value">
            <span>{{ m.label }} ({{ m.value }})</span>
            <button class="danger-btn" @click="handleRemoveModel(m.value)">Delete</button>
          </li>
        </ul>
      </div>

      <div class="add-model">
        <h4>Add New Model</h4>
        <div class="field-group">
          <input v-model="newModelLabel" placeholder="Model Label (e.g. GPT-4o)" />
          <input v-model="newModelValue" placeholder="Model ID (e.g. gpt-4o)" />
          <button class="primary" @click="handleAddModel" :disabled="!newModelLabel || !newModelValue">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./ModelManagerModal.css"></style>
