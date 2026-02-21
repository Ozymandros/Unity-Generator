<script setup lang="ts">
import { useModelManager, type ModelManagerProps } from "./ModelManagerModal";

const props = defineProps<ModelManagerProps>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "models-changed"): void;
}>();

const {
  models,
  newValue,
  newLabel,
  loading,
  error,
  providerLabel,
  handleAdd,
  handleRemove,
  close,
} = useModelManager(props, emit);
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="close">
      <div class="modal-card">
        <header class="modal-header">
          <h3>Models for {{ providerLabel }}</h3>
          <button class="close-btn" @click="close" title="Close">✕</button>
        </header>

        <div v-if="error" class="modal-error">{{ error }}</div>

        <div class="modal-body">
          <p v-if="loading" class="loading-text">Loading…</p>

          <ul v-else-if="models.length" class="model-list">
            <li v-for="m in models" :key="m.value" class="model-item">
              <span class="model-label">{{ m.label }}</span>
              <span class="model-value">{{ m.value }}</span>
              <button
                class="remove-btn"
                @click="handleRemove(m.value)"
                title="Remove model"
              >
                ✕
              </button>
            </li>
          </ul>

          <p v-else class="empty-text">No models registered yet.</p>
        </div>

        <footer class="modal-footer">
          <input
            v-model="newValue"
            placeholder="Model ID (e.g. gpt-4o)"
            class="add-input"
            @keydown.enter="handleAdd"
          />
          <input
            v-model="newLabel"
            placeholder="Display label"
            class="add-input"
            @keydown.enter="handleAdd"
          />
          <button
            class="add-btn"
            @click="handleAdd"
            :disabled="!newValue.trim() || !newLabel.trim()"
            title="Add model"
          >
            ＋ Add
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped src="./ModelManagerModal.css"></style>
