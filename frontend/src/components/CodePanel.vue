<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateCode } from "../api/client";

const prompt = ref("");
const provider = ref("");
const model = ref("");
const temperature = ref(0.7);
const maxTokens = ref(2048);
const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");

async function run() {
  status.value = "Generating code...";
  tone.value = "ok";
  try {
    const response = await generateCode({
      prompt: prompt.value,
      provider: provider.value || undefined,
      options: {
        model: model.value || undefined,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
      },
    });
    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "Failed to generate code.";
      return;
    }
    status.value = "Code generated.";
    result.value = String(response.data?.content || "");
  } catch (error) {
    tone.value = "error";
    status.value = String(error);
  }
}
</script>

<template>
  <div class="panel">
    <h2>Unity C# Code</h2>
    <StatusBanner :status="status" :tone="tone" />
    <div class="field">
      <label>Prompt</label>
      <textarea v-model="prompt" rows="6"></textarea>
    </div>
    
    <div class="field-group">
      <div class="row">
        <div class="field">
          <label>Provider (optional)</label>
          <input v-model="provider" placeholder="openai | deepseek..." />
        </div>
        <div class="field">
          <label>Model (optional)</label>
          <input v-model="model" placeholder="gpt-4o-mini" />
        </div>
      </div>
      <div class="row">
        <div class="field">
           <label>Temperature</label>
           <input type="number" v-model.number="temperature" step="0.1" min="0" max="2" />
        </div>
        <div class="field">
           <label>Max Tokens</label>
           <input type="number" v-model.number="maxTokens" step="100" />
        </div>
      </div>
    </div>

    <button class="primary" @click="run">Generate</button>

    <div class="field">
      <label>Result</label>
      <textarea v-model="result" rows="10" readonly></textarea>
    </div>
  </div>
</template>

<style scoped>
.panel {
  max-width: 820px;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
.field-group {
  margin-bottom: 12px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
textarea,
input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
}
.primary {
  margin: 8px 0 14px;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}
</style>
