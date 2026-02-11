<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref, computed } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateText } from "../api/client";
import { TEXT_PROVIDERS, TEMPERATURE_PRESETS, LENGTH_PRESETS } from "../constants/providers";

const prompt = ref("");
const provider = ref("");
const apiKey = ref("");
const model = ref("");
const temperature = ref(0.7);
const maxTokens = ref(2048);
const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");

const providerModels = computed(() => {
  const p = TEXT_PROVIDERS.find((x) => x.value === provider.value);
  return p ? p.models || [] : [];
});

async function run() {
  status.value = "Generating text...";
  tone.value = "ok";
  try {
    const response = await generateText({
      prompt: prompt.value,
      provider: provider.value || undefined,
      options: { 
        model: model.value || undefined,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        api_key: apiKey.value || undefined,
      },
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
    
    <div class="field-group">
      <div class="row">
        <div class="field">
          <label>Provider</label>
          <select v-model="provider">
             <option value="" disabled>Select Provider</option>
             <option v-for="p in TEXT_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Model</label>
          <select v-model="model">
             <option value="" disabled>Select Model</option>
             <option v-for="m in providerModels" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
      </div>
      <div class="row" style="margin-bottom: 12px;">
         <div class="field">
            <label>API Key (Optional)</label>
            <input v-model="apiKey" type="password" placeholder="Override key..." />
         </div>
      </div>
      <div class="row">
        <div class="field">
           <label>Temperature</label>
           <select v-model.number="temperature">
             <option v-for="t in TEMPERATURE_PRESETS" :key="t.value" :value="t.value">{{ t.label }} ({{ t.value }})</option>
           </select>
        </div>
        <div class="field">
           <label>Length</label>
           <select v-model.number="maxTokens">
             <option v-for="l in LENGTH_PRESETS" :key="l.value" :value="l.value">{{ l.label }} ({{ l.value }})</option>
           </select>
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
