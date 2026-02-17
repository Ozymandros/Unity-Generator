<script setup lang="ts">
import { ref, computed } from "vue";
import { createScene, type GenerationResponse } from "@/api/client";

const prompt = ref("");
const systemPrompt = ref("");
const loading = ref(false);
const result = ref<GenerationResponse | null>(null);
const error = ref<string | null>(null);

interface AgentResult {
  content: string;
  files: string[];
  metadata?: {
    steps?: string[];
  };
}

const agentResult = computed(() => {
  if (!result.value || !result.value.data) return null;
  return result.value.data as unknown as AgentResult;
});

const canGenerate = computed(() => prompt.value.trim().length > 0 && !loading.value);

async function handleGenerate() {
  if (!canGenerate.value) return;

  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    const response = await createScene({
      prompt: prompt.value,
      system_prompt: systemPrompt.value || undefined,
    });

    if (response.success) {
      result.value = response;
    } else {
      error.value = response.error || "Unknown error occurred";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="panel">
    <div class="header">
      <h2>Unity Scene Creator</h2>
      <p class="subtitle">Describe your scene and let the AI build it in Unity.</p>
    </div>

    <div class="input-group">
      <label for="prompt">Scene Description</label>
      <textarea
        id="prompt"
        v-model="prompt"
        placeholder="e.g., Create a scene with a red cube at (0,0,0) and a blue sphere at (2,0,0)."
        rows="4"
        :disabled="loading"
      ></textarea>
    </div>

    <div class="input-group">
      <label for="system-prompt">System Prompt (Optional)</label>
      <input
        id="system-prompt"
        type="text"
        v-model="systemPrompt"
        placeholder="Override default AI behavior..."
        :disabled="loading"
      />
    </div>

    <button class="generate-btn" @click="handleGenerate" :disabled="!canGenerate">
      <span v-if="loading" class="spinner"></span>
      <span v-else>Generate Scene</span>
    </button>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="agentResult" class="results">
      <h3>Result</h3>
      <div v-if="agentResult.content" class="result-content">
        <p>{{ agentResult.content }}</p>
      </div>

      <div v-if="agentResult.files && agentResult.files.length > 0" class="files-list">
        <h4>Created Files</h4>
        <ul>
          <li v-for="file in agentResult.files" :key="file">{{ file }}</li>
        </ul>
      </div>

      <div v-if="agentResult.metadata && agentResult.metadata.steps && agentResult.metadata.steps.length > 0" class="steps-list">
         <details>
            <summary>View Steps ({{ agentResult.metadata.steps.length }})</summary>
            <ul>
                <li v-for="(step, index) in agentResult.metadata.steps" :key="index">
                    <strong>Step {{ index + 1 }}:</strong> {{ step }}
                </li>
            </ul>
         </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  margin-bottom: 24px;
}

h2 {
  margin: 0 0 8px;
  color: #1e293b;
}

.subtitle {
  margin: 0;
  color: #64748b;
}

.input-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #334155;
}

textarea,
input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.2s;
}

textarea:focus,
input[type="text"]:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.generate-btn {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.generate-btn:hover:not(:disabled) {
  background: #2563eb;
}

.generate-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 20px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #ef4444;
  border-radius: 6px;
}

.results {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.result-content {
  background: #f8fafc;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.files-list ul,
.steps-list ul {
  list-style: disc;
  padding-left: 20px;
  color: #475569;
}

summary {
    cursor: pointer;
    font-weight: 500;
    color: #3b82f6;
}
</style>
