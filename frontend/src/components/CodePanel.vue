<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateCode } from "../api/client";
import { TEXT_PROVIDERS, TEMPERATURE_PRESETS, LENGTH_PRESETS } from "../constants/providers";

const prompt = ref("");
const provider = ref("");
const model = ref("");
const temperature = ref(0.2); // Default for code
const maxTokens = ref(2048);
const apiKey = ref("");

const availableModels = computed(() => {
  const p = TEXT_PROVIDERS.find((x) => x.value === provider.value);
  return p ? p.models || [] : [];
});

watch(provider, () => {
    model.value = "";
    // Fetch key if possible? For now, user enters key in Settings or here?
    // Other panels added API key input. I should add it here too.
});
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
      api_key: apiKey.value || undefined,
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
      <div class="options-row">
        <div class="field">
          <label>Provider</label>
          <select v-model="provider">
            <option value="" disabled>Select Provider</option>
            <option v-for="p in TEXT_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Model</label>
          <select v-model="model" :disabled="!provider">
            <option value="" disabled>Select Model</option>
            <option v-for="m in availableModels" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
      </div>
      <div class="options-row">
        <div class="field">
           <label>Temperature</label>
           <select v-model.number="temperature">
             <option v-for="t in TEMPERATURE_PRESETS" :key="t.value" :value="t.value">{{ t.label }} ({{ t.value }})</option>
           </select>
        </div>
        <div class="field">
           <label>Max Tokens</label>
           <select v-model.number="maxTokens">
             <option v-for="l in LENGTH_PRESETS" :key="l.value" :value="l.value">{{ l.label }} ({{ l.value }})</option>
           </select>
        </div>
      </div>
      <div class="field" style="margin-top: 8px;">
          <label>API Key (Optional Override)</label>
          <input v-model="apiKey" type="password" placeholder="Leave empty to use global key" />
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
.options-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}
.options-row .field {
  flex: 1;
}
textarea,
input,
select {
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
