<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import StatusBanner from "./StatusBanner.vue";
import {
  generateUnityProject,
  getLatestOutput,
  finalizeProject,
  getFinalizeJobStatus,
  downloadFinalizedProject,
} from "../api/client";
import type { FinalizeJobStatusResponse } from "../api/client";
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

// Unity Engine Settings
const unityInstallPackages = ref(false);
const unityGenerateScene = ref(false);
const unitySetupUrp = ref(false);
const unityPackages = ref("com.unity.textmeshpro");
const unitySceneName = ref("MainScene");
const unityEditorPath = ref("");
const unityTimeout = ref(300);

// Finalize job state
const finalizeJobId = ref("");
const finalizeStatus = ref<FinalizeJobStatusResponse | null>(null);
const finalizeLogs = ref<string[]>([]);
const finalizePolling = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const result = ref("");
const lastProjectPath = ref("");

const availableVoices = computed(() => {
  const p = AUDIO_PROVIDERS.find((x) => x.value === audioProvider.value);
  return p ? p.models || [] : [];
});

const isFinalizing = computed(() => {
  if (!finalizeStatus.value) return false;
  return ["pending", "running"].includes(finalizeStatus.value.status);
});

const finalizeProgress = computed(() => {
  return finalizeStatus.value?.progress ?? 0;
});

const finalizeStep = computed(() => {
  return finalizeStatus.value?.step ?? "";
});

const finalizeDownloadUrl = computed(() => {
  if (
    finalizeStatus.value?.status === "completed" &&
    finalizeStatus.value?.zip_path
  ) {
    return downloadFinalizedProject(finalizeJobId.value);
  }
  return "";
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

async function runFinalize() {
  status.value = "Starting finalize workflow...";
  tone.value = "ok";
  finalizeLogs.value = [];
  finalizeStatus.value = null;

  try {
    const packages = unityInstallPackages.value
      ? unityPackages.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const response = await finalizeProject({
      project_name: projectName.value,
      project_path: lastProjectPath.value || undefined,
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
      unity_settings: {
        install_packages: unityInstallPackages.value,
        generate_scene: unityGenerateScene.value,
        setup_urp: unitySetupUrp.value,
        packages,
        scene_name: unitySceneName.value,
        unity_editor_path: unityEditorPath.value || undefined,
        timeout: unityTimeout.value,
      },
    });

    if (!response.success) {
      tone.value = "error";
      status.value = "Failed to create finalize job.";
      return;
    }

    finalizeJobId.value = response.job_id;
    status.value = `Finalize job started (${response.job_id})`;
    startPolling();
  } catch (error) {
    tone.value = "error";
    status.value = String(error);
  }
}

function startPolling() {
  stopPolling();
  finalizePolling.value = true;
  pollTimer = setInterval(pollStatus, 2000);
}

function stopPolling() {
  finalizePolling.value = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function pollStatus() {
  if (!finalizeJobId.value) {
    stopPolling();
    return;
  }
  try {
    const statusResp = await getFinalizeJobStatus(finalizeJobId.value);
    finalizeStatus.value = statusResp;
    finalizeLogs.value = statusResp.logs_tail || [];

    if (statusResp.status === "completed") {
      stopPolling();
      tone.value = "ok";
      status.value = "Finalization completed successfully!";
      lastProjectPath.value = statusResp.project_path || "";
    } else if (statusResp.status === "failed") {
      stopPolling();
      tone.value = "error";
      const errMsg = statusResp.errors?.join("; ") || "Unknown error";
      status.value = `Finalization failed: ${errMsg}`;
    }
  } catch (error) {
    stopPolling();
    tone.value = "error";
    status.value = `Polling error: ${String(error)}`;
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

onUnmounted(() => {
  stopPolling();
});
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

    <!-- Unity Engine Settings -->
    <h3>Unity Engine Settings</h3>
    <div class="section-group">
      <div class="toggle-row">
        <label class="toggle-label">
          <input type="checkbox" v-model="unityGenerateScene" />
          Generate Default Scene
        </label>
        <label class="toggle-label">
          <input type="checkbox" v-model="unityInstallPackages" />
          Auto-Install UPM Packages
        </label>
        <label class="toggle-label">
          <input type="checkbox" v-model="unitySetupUrp" />
          Setup URP
        </label>
      </div>

      <div v-if="unityInstallPackages" class="field">
        <label>UPM Packages (comma-separated)</label>
        <input v-model="unityPackages" placeholder="com.unity.textmeshpro, com.unity.render-pipelines.universal" />
      </div>

      <div v-if="unityGenerateScene" class="field">
        <label>Scene Name</label>
        <input v-model="unitySceneName" placeholder="MainScene" />
      </div>

      <div class="options-row">
        <div class="field-sm">
          <label>Unity Editor Path (optional)</label>
          <input v-model="unityEditorPath" placeholder="Auto-detect or UNITY_EDITOR_PATH env var" />
        </div>
        <div class="field-sm">
          <label>Timeout (seconds)</label>
          <input type="number" v-model.number="unityTimeout" min="30" max="1800" />
        </div>
      </div>
    </div>

    <button
      class="primary finalize-btn"
      @click="runFinalize"
      :disabled="isFinalizing"
    >
      {{ isFinalizing ? "Finalizing..." : "Finalize with Unity Engine" }}
    </button>

    <!-- Finalize Progress & Log Viewer -->
    <div v-if="finalizeStatus" class="section-group finalize-status">
      <div class="progress-header">
        <span class="step-label">{{ finalizeStep }}</span>
        <span class="progress-pct">{{ finalizeProgress }}%</span>
      </div>
      <div class="progress-bar-track">
        <div
          class="progress-bar-fill"
          :style="{ width: finalizeProgress + '%' }"
          :class="{
            'bar-running': isFinalizing,
            'bar-done': finalizeStatus.status === 'completed',
            'bar-error': finalizeStatus.status === 'failed',
          }"
        ></div>
      </div>

      <div class="log-viewer" ref="logViewer">
        <div
          v-for="(line, idx) in finalizeLogs"
          :key="idx"
          class="log-line"
          :class="{ 'log-error': line.includes('[error]') || line.includes('failed') }"
        >
          {{ line }}
        </div>
        <div v-if="finalizeLogs.length === 0" class="log-empty">
          Waiting for logs...
        </div>
      </div>

      <div v-if="finalizeStatus.errors && finalizeStatus.errors.length > 0" class="error-list">
        <strong>Errors:</strong>
        <ul>
          <li v-for="(err, idx) in finalizeStatus.errors" :key="idx">{{ err }}</li>
        </ul>
      </div>

      <div v-if="finalizeDownloadUrl" class="download-row">
        <a :href="finalizeDownloadUrl" class="download-link" download>
          Download Finalized Project (.zip)
        </a>
      </div>
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
input[type="checkbox"] {
  width: auto;
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
.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Unity Engine Settings */
.toggle-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
}
.finalize-btn {
  background: #059669;
}
.finalize-btn:hover:not(:disabled) {
  background: #047857;
}

/* Finalize status */
.finalize-status {
  border-color: #c7d2fe;
  background: #f8fafc;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.step-label {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}
.progress-pct {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}
.progress-bar-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}
.bar-running {
  background: #2563eb;
}
.bar-done {
  background: #059669;
}
.bar-error {
  background: #dc2626;
}

/* Log viewer */
.log-viewer {
  max-height: 200px;
  overflow-y: auto;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 10px;
  font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  margin-bottom: 10px;
}
.log-line {
  white-space: pre-wrap;
  word-break: break-word;
}
.log-error {
  color: #fca5a5;
}
.log-empty {
  color: #64748b;
  font-style: italic;
}

/* Error list */
.error-list {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}
.error-list strong {
  color: #991b1b;
}
.error-list ul {
  margin: 4px 0 0;
  padding-left: 18px;
}
.error-list li {
  color: #dc2626;
  font-size: 0.85rem;
}

/* Download */
.download-row {
  text-align: center;
  padding: 8px 0;
}
.download-link {
  display: inline-block;
  padding: 10px 20px;
  background: #059669;
  color: white;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
}
.download-link:hover {
  background: #047857;
}
</style>
