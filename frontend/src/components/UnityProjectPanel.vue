<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref, computed } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateUnityProject, getLatestOutput } from "../api/client";
import { 
  TEXT_PROVIDERS, 
  IMAGE_PROVIDERS, 
  AUDIO_PROVIDERS, 
  ASPECT_RATIOS, 
  QUALITY_OPTIONS, 
  TEMPERATURE_PRESETS, 
  LENGTH_PRESETS,
  STABILITY_PRESETS 
} from "../constants/providers";

const projectName = ref("UnityProject");
const codePrompt = ref("");
const textPrompt = ref("");
const imagePrompt = ref("");
const audioPrompt = ref("");

// Providers
const codeProvider = ref("");
const textProvider = ref("");
const imageProvider = ref("");
const audioProvider = ref("");

// Structured Options
const codeTemperature = ref(0.7);
const codeMaxTokens = ref(2048);
const textTemperature = ref(0.7);
const textMaxTokens = ref(2048);
const imageAspectRatio = ref("1:1");
const imageQuality = ref("standard");
const audioVoiceId = ref("");
const audioStability = ref(0.5);

const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");
const lastProjectPath = ref("");

const availableVoices = computed(() => {
  const p = AUDIO_PROVIDERS.find((x) => x.value === audioProvider.value);
  return p ? p.models || [] : [];
});

async function openWithTauri(path: string) {
  const tauri = (window as unknown as { __TAURI__?: { shell?: { open: (path: string) => Promise<void> } } })
    .__TAURI__;
  if (!tauri?.shell?.open) {
    return false;
  }
  await tauri.shell.open(path);
  return true;
}

async function run() {
  status.value = "Generating Unity project...";
  tone.value = "ok";
  try {
    const response = await generateUnityProject({
      project_name: projectName.value,
      code_prompt: codePrompt.value || undefined,
      text_prompt: textPrompt.value || undefined,
      image_prompt: imagePrompt.value || undefined,
      audio_prompt: audioPrompt.value || undefined,
      provider_overrides: {
        code: codeProvider.value || undefined,
        text: textProvider.value || undefined,
        image: imageProvider.value || undefined,
        audio: audioProvider.value || undefined,
      },
      options: {
        code: { temperature: codeTemperature.value, max_tokens: codeMaxTokens.value },
        text: { temperature: textTemperature.value, max_tokens: textMaxTokens.value },
        image: { aspect_ratio: imageAspectRatio.value, quality: imageQuality.value },
        audio: { voice_id: audioVoiceId.value || undefined, stability: audioStability.value },
      },
    });
    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "Failed to generate project.";
      return;
    }
    status.value = "Unity project generated.";
    result.value = JSON.stringify(response.data || {}, null, 2);
    lastProjectPath.value = String(response.data?.project_path || "");
  } catch (error) {
    tone.value = "error";
    status.value = String(error);
  }
}

async function openOutputFolder() {
  try {
    const response: { success: boolean; data?: Record<string, unknown> | null; error?: string | null } =
      lastProjectPath.value
        ? { success: true, data: { path: lastProjectPath.value } }
        : await getLatestOutput();

    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "No output folder found.";
      return;
    }

    const data = response.data && typeof response.data === "object" ? response.data : undefined;
    const path = String((data as { path?: string } | undefined)?.path || "");
    if (!path) {
      tone.value = "error";
      status.value = "No output folder found.";
      return;
    }

    try {
      const opened = await openWithTauri(path);
      if (opened) {
        status.value = "Opened output folder.";
      } else {
        status.value = `Path: ${path} (Tauri not available in web build)`;
      }
    } catch (tauriError) {
      status.value = `Path: ${path} (Failed to open in Tauri: ${String(tauriError)})`;
    }
  } catch (error) {
    tone.value = "error";
    status.value = `Open failed: ${String(error)}`;
  }
}
</script>

<template>
  <div class="panel">
    <h2>Unity Project Output</h2>
    <StatusBanner :status="status" :tone="tone" />

    <div class="field">
      <label>Project Name</label>
      <input v-model="projectName" />
    </div>

    <div class="section-group">
      <div class="field">
        <label>Code Prompt</label>
        <textarea v-model="codePrompt" rows="3"></textarea>
      </div>
      <div class="options-row">
        <div class="field-sm">
           <label>Temp</label>
           <select v-model.number="codeTemperature">
             <option v-for="t in TEMPERATURE_PRESETS" :key="t.value" :value="t.value">{{ t.label }}</option>
           </select>
        </div>
        <div class="field-sm">
           <label>Max Tokens</label>
           <select v-model.number="codeMaxTokens">
             <option v-for="l in LENGTH_PRESETS" :key="l.value" :value="l.value">{{ l.label }}</option>
           </select>
        </div>
      </div>
    </div>

    <div class="section-group">
      <div class="field">
        <label>Text Prompt</label>
        <textarea v-model="textPrompt" rows="3"></textarea>
      </div>
      <div class="options-row">
        <div class="field-sm">
           <label>Temp</label>
           <select v-model.number="textTemperature">
             <option v-for="t in TEMPERATURE_PRESETS" :key="t.value" :value="t.value">{{ t.label }}</option>
           </select>
        </div>
        <div class="field-sm">
           <label>Max Tokens</label>
           <select v-model.number="textMaxTokens">
             <option v-for="l in LENGTH_PRESETS" :key="l.value" :value="l.value">{{ l.label }}</option>
           </select>
        </div>
      </div>
    </div>

    <div class="section-group">
      <div class="field">
        <label>Image Prompt</label>
        <textarea v-model="imagePrompt" rows="3"></textarea>
      </div>
       <div class="options-row">
        <div class="field-sm">
           <label>Aspect Ratio</label>
           <select v-model="imageAspectRatio">
             <option v-for="ar in ASPECT_RATIOS" :key="ar.value" :value="ar.value">{{ ar.label }}</option>
           </select>
        </div>
        <div class="field-sm">
           <label>Quality</label>
           <select v-model="imageQuality">
             <option v-for="q in QUALITY_OPTIONS" :key="q.value" :value="q.value">{{ q.label }}</option>
           </select>
        </div>
      </div>
    </div>

    <div class="section-group">
      <div class="field">
        <label>Audio Prompt</label>
        <textarea v-model="audioPrompt" rows="3"></textarea>
      </div>
       <div class="options-row">
        <div class="field-sm">
           <label>Voice ID</label>
           <select v-model="audioVoiceId">
             <option value="">Default / Random</option>
             <option v-for="v in availableVoices" :key="v.value" :value="v.value">{{ v.label }}</option>
           </select>
        </div>
        <div class="field-sm">
           <label>Stability</label>
           <select v-model.number="audioStability">
             <option v-for="s in STABILITY_PRESETS" :key="s.value" :value="s.value">{{ s.label }}</option>
           </select>
        </div>
      </div>
    </div>

    <h3>Provider Overrides (optional)</h3>
    <div class="row">
      <div class="field">
        <label>Code Provider</label>
        <select v-model="codeProvider">
           <option value="">Default (Global Pref)</option>
           <option v-for="p in TEXT_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
      <div class="field">
        <label>Text Provider</label>
        <select v-model="textProvider">
           <option value="">Default (Global Pref)</option>
           <option v-for="p in TEXT_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
      <div class="field">
        <label>Image Provider</label>
        <select v-model="imageProvider">
           <option value="">Default (Global Pref)</option>
           <option v-for="p in IMAGE_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
      <div class="field">
        <label>Audio Provider</label>
        <select v-model="audioProvider">
           <option value="">Default (Global Pref)</option>
           <option v-for="p in AUDIO_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </div>
    </div>

    <button class="primary" @click="run">Generate Project</button>
    <button class="secondary" @click="openOutputFolder">Open Output Folder</button>

    <div class="field">
      <label>Result (JSON)</label>
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
.section-group {
  border: 1px solid #eee;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #fafafa;
}
.options-row {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.field-sm {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.field-sm label {
  font-size: 0.85em;
  color: #666;
  margin-bottom: 4px;
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
.secondary {
  margin: 0 0 14px;
  padding: 10px 14px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}
</style>
