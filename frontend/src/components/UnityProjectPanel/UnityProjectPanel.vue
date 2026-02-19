<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { SmartField } from "@/components/generic/SmartField";
import { useUnityProjectPanel } from "./UnityProjectPanel";

const {
  projectName,
  settings,
  finalize,
  UNITY_TEMPLATES,
  UNITY_VERSIONS,
  UNITY_PLATFORMS,
  status,
  tone,
  result,
  isFinalizing,
  finalizeProgress,
  finalizeStep,
  finalizeDownloadUrl,
  run,
  runFinalize,
  openOutputFolder,
  FINALIZE_STATUS
} = useUnityProjectPanel();
</script>

<template>
  <div class="panel">
    <h2>Unity Project Output</h2>
    <StatusBanner :status="status" :tone="tone" />

    <div class="field">
      <SmartField 
        label="Project Name" 
        v-model="projectName" 
        required 
      />
    </div>
    <div class="field">
      <SmartField 
        label="Unity Template" 
        type="select" 
        v-model="settings.template" 
        :options="UNITY_TEMPLATES" 
        placeholder="Select template..."
        required 
      />
    </div>
    <div class="options-row">
      <div class="field-sm">
        <SmartField 
          label="Unity Version" 
          type="select" 
          v-model="settings.version" 
          :options="UNITY_VERSIONS" 
          placeholder="Select version..."
          required 
        />
      </div>
      <div class="field-sm">
        <SmartField 
          label="Target Platform" 
          type="select" 
          v-model="settings.platform" 
          :options="UNITY_PLATFORMS" 
          placeholder="Select platform..."
          required 
        />
      </div>
    </div>


    <button class="primary" @click="run">Generate Base Project Structure</button>
    <button class="secondary" @click="openOutputFolder">Open Output Folder</button>

    <div class="field">
      <SmartField label="Result (JSON)" type="textarea" v-model="result" :rows="10" disabled />
    </div>

    <!-- Unity Engine Settings -->
    <h3>Unity Engine Settings</h3>
    <div class="section-group">
       <div class="toggle-row">
         <SmartField type="checkbox" label="Generate Default Scene" v-model="settings.generateScene" />
         <SmartField type="checkbox" label="Auto-Install UPM Packages" v-model="settings.installPackages" />
         <SmartField type="checkbox" label="Setup URP" v-model="settings.setupUrp" />
       </div>

       <div v-if="settings.installPackages" class="field">
         <SmartField 
           label="UPM Packages (comma-separated)" 
           v-model="settings.packages" 
           placeholder="com.unity.textmeshpro, com.unity.render-pipelines.universal" 
         />
       </div>

       <div v-if="settings.generateScene" class="field">
         <SmartField 
           label="Scene Name" 
           v-model="settings.sceneName" 
           placeholder="MainScene" 
         />
       </div>

       <div class="options-row">
         <div class="field-sm">
           <SmartField 
             label="Unity Editor Path (optional)" 
             v-model="settings.editorPath" 
             placeholder="Auto-detect or UNITY_EDITOR_PATH env var" 
           />
         </div>
         <div class="field-sm">
           <SmartField 
             label="Timeout (seconds)" 
             type="number" 
             v-model="settings.timeout" 
             :min="30" 
             :max="1800" 
           />
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
    <div v-if="finalize.status" class="section-group finalize-status">
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
            'bar-done': finalize.status.status === FINALIZE_STATUS.COMPLETED,
            'bar-error': finalize.status.status === FINALIZE_STATUS.FAILED,
          }"
        ></div>
      </div>

      <div class="log-viewer" ref="logViewer">
        <div
          v-for="(line, idx) in finalize.logs"
          :key="idx"
          class="log-line"
          :class="{ 'log-error': line.includes('[error]') || line.toLowerCase().includes(FINALIZE_STATUS.FAILED) }"
        >
          {{ line }}
        </div>
        <div v-if="finalize.logs.length === 0" class="log-empty">
          Waiting for logs...
        </div>
      </div>

      <div v-if="finalize.status && finalize.status.errors && finalize.status.errors.length > 0" class="error-list">
        <strong>Errors:</strong>
        <ul>
          <li v-for="(err, idx) in finalize.status.errors" :key="idx">{{ err }}</li>
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

<style scoped src="./UnityProjectPanel.css"></style>
