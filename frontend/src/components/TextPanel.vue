<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateText } from "../api/client";

const prompt = ref("");
const provider = ref("");
const model = ref("");
const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");

async function run() {
  status.value = "Generating text...";
  tone.value = "ok";
  try {
    const response = await generateText({
      prompt: prompt.value,
      provider: provider.value || undefined,
      options: { model: model.value || undefined },
    });
    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "Failed to generate text.";
      return;
    }
    status.value = "Text generated.";
    result.value = String(response.data?.content || "");
  } catch (error) {
    tone.value = "error";
    status.value = String(error);
  }
}
</script>

<template>
  <div class="panel">
    <h2>Text Generation</h2>
    <StatusBanner :status="status" :tone="tone" />
    <div class="field">
      <label>Prompt</label>
      <textarea v-model="prompt" rows="6"></textarea>
    </div>
    <div class="row">
      <div class="field">
        <label>Provider (optional)</label>
        <input v-model="provider" placeholder="openai | deepseek | openrouter | groq" />
      </div>
      <div class="field">
        <label>Model (optional)</label>
        <input v-model="model" placeholder="gpt-4o-mini" />
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
}
.primary {
  margin: 8px 0 14px;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #2563eb