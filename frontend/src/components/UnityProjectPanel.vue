<script setup lang="ts">
import { ref } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateUnityProject, getLatestOutput } from "../api/client";

const projectName = ref("UnityProject");
const codePrompt = ref("");
const textPrompt = ref("");
const imagePrompt = ref("");
const audioPrompt = ref("");
const codeProvider = ref("");
const textProvider = ref("");
const imageProvider = ref("");
const audioProvider = ref("");
const codeOptions = ref("{}");
const textOptions = ref("{}");
const imageOptions = ref("{}");
const audioOptions = ref("{}");
const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");
const lastProjectPath = ref("");

function parseOptions(raw: string) {
  if (!raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const err = new Error(`Options JSON invalid: ${String(error)}`) as Error & { cause?: unknown };
    err.cause = error;
    throw err;
  }
}

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
        code: parseOptions(codeOptions.value),
        text: parseOptions(textOptions.value),
        image: parseOptions(imageOptions.value),
        audio: parseOptions(audioOptions.value),
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

    <div class="field">
      <label>Code Prompt</label>
      <textarea v-model="codePrompt" rows="4"></textarea>
    </div>
    <div class="field">
      <label>Text Prompt</label>
      <textarea v-model="textPrompt" rows="4"></textarea>
    </div>
    <div class="field">
      <label>Image Prompt</label>
      <textarea v-model="imagePrompt" rows="4"></textarea>
    </div>
    <div class="field">
      <label>Audio Prompt</label>
      <textarea v-model="audioPrompt" rows="4"></textarea>
    </div>

    <h3>Provider Overrides (optional)</h3>
    <div class="row">
      <div class="field">
        <label>Code Provider</label>
        <input v-model="codeProvider" placeholder="openai | deepseek | openrouter | groq" />
      </div>
      <div class="field">
        <label>Text Provider</label>
        <input v-model="textProvider" placeholder="openai | deepseek | openrouter | groq" />
      </div>
      <div class="field">
        <label>Image Provider</label>
        <input v-model="imageProvider" placeholder="stability | flux" />
      </div>
      <div class="field">
        <label>Audio Provider</label>
        <input v-model="audioProvider" placeholder="elevenlabs | playht" />
      </div>
    </div>

    <h3>Options (JSON)</h3>
    <div class="field">
      <label>Code Options</label>
      <textarea v-model="codeOptions" rows="4"></textarea>
    </div>
    <div class="field">
      <label>Text Options</label>
      <textarea v-model="textOptions" rows="4"></textarea>
    </div>
    <div class="field">
      <label>Image Options</label>
      <textarea v-model="imageOptions" rows="4"></textarea>
    </div>
    <div class="field">
      <label>Audio Options</label>
      <textarea v-model="audioOptions" rows="4"></textarea>
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
