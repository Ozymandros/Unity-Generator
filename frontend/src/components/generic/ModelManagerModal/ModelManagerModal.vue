<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  listModels, 
  addModel, 
  removeModel 
} from '@/api/client';

const props = defineProps<{
  provider: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'models-changed'): void;
}>();

const models = ref<{ value: string; label: string }[]>([]);
const newModelValue = ref('');
const newModelLabel = ref('');
const loading = ref(false);
const error = ref('');

async function fetchModels() {
  loading.value = true;
  try {
    models.value = await listModels(props.provider);
  } catch {
    error.value = 'Failed to load models';
  } finally {
    loading.value = false;
  }
}

async function handleAddModel() {
  if (!newModelValue.value || !newModelLabel.value) return;
  try {
    await addModel(props.provider, newModelValue.value, newModelLabel.value);
    newModelValue.value = '';
    newModelLabel.value = '';
    await fetchModels();
    emit('models-changed');
  } catch {
    error.value = 'Failed to add model';
  }
}

async function handleRemoveModel(value: string) {
  try {
    await removeModel(props.provider, value);
    await fetchModels();
    emit('models-changed');
  } catch {
    error.value = 'Failed to remove model';
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

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #1e1e1e;
  color: white;
  padding: 2rem;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
}

.model-list {
  margin-bottom: 2rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333;
}

.add-model h4 {
  margin-bottom: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input {
  background: #2d2d2d;
  border: 1px solid #444;
  color: white;
  padding: 0.6rem;
  border-radius: 4px;
}

.danger-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.7rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff4444;
  margin-bottom: 1rem;
}
</style>
