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


    <div class="d-flex gap-4 mb-6">
      <v-btn
        color="primary"
        size="large"
        rounded="pill"
        prepend-icon="mdi-folder-plus-outline"
        @click="run"
      >
        Generate Base Project
      </v-btn>
      <v-btn
        variant="outlined"
        size="large"
        rounded="pill"
        prepend-icon="mdi-folder-open-outline"
        @click="openOutputFolder"
      >
        Open Folder
      </v-btn>
    </div>

    <SmartField label="Result (JSON)" type="textarea" v-model="result" :rows="8" disabled />

    <!-- Unity Engine Settings -->
    <h3 class="text-h5 font-weight-bold mb-4 mt-8">Unity Engine Settings</h3>
    <v-card variant="outlined" class="pa-6 rounded-xl bg-surface mb-6">
       <div class="toggle-row mb-6">
         <SmartField type="checkbox" label="Generate Default Scene" v-model="settings.generateScene" />
         <SmartField type="checkbox" label="Auto-Install UPM Packages" v-model="settings.installPackages" />
         <SmartField type="checkbox" label="Setup URP" v-model="settings.setupUrp" />
       </div>

       <v-expand-transition>
         <div v-if="settings.installPackages">
           <SmartField 
             label="UPM Packages (comma-separated)" 
             v-model="settings.packages" 
             placeholder="com.unity.textmeshpro, com.unity.render-pipelines.universal" 
             class="mb-4"
           />
         </div>
       </v-expand-transition>

       <v-expand-transition>
         <div v-if="settings.generateScene">
           <SmartField 
             label="Scene Name" 
             v-model="settings.sceneName" 
             placeholder="MainScene" 
             class="mb-4"
           />
         </div>
       </v-expand-transition>

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
    </v-card>

    <v-btn
      color="success"
      size="large"
      rounded="pill"
      block
      prepend-icon="mdi-unity"
      @click="runFinalize"
      :loading="isFinalizing"
      :disabled="isFinalizing"
      class="mb-8"
    >
      Finalize with Unity Engine
    </v-btn>

    <!-- Finalize Progress & Log Viewer -->
    <v-fade-transition>
      <v-card v-if="finalize.status" variant="outlined" border class="pa-6 rounded-xl bg-surface mb-8">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-subtitle-2 font-weight-bold">{{ finalizeStep }}</span>
          <span class="text-caption font-weight-black">{{ finalizeProgress }}%</span>
        </div>
        
        <v-progress-linear
          :model-value="finalizeProgress"
          height="10"
          rounded
          :color="isFinalizing ? 'primary' : (finalize.status.status === FINALIZE_STATUS.COMPLETED ? 'success' : 'error')"
          class="mb-6"
        ></v-progress-linear>

        <div class="log-viewer bg-on-background pa-4 rounded-lg mb-4" ref="logViewer">
          <div
            v-for="(line, idx) in finalize.logs"
            :key="idx"
            class="log-line"
            :class="{ 'log-error': line.includes('[error]') || line.toLowerCase().includes(FINALIZE_STATUS.FAILED) }"
          >
            {{ line }}
          </div>
          <div v-if="finalize.logs.length === 0" class="log-empty opacity-60 italic">
            Waiting for logs...
          </div>
        </div>

        <v-alert
          v-if="finalize.status && finalize.status.errors && finalize.status.errors.length > 0"
          type="error"
          variant="tonal"
          title="Errors Detected"
          class="mb-4"
        >
          <ul>
            <li v-for="(err, idx) in finalize.status.errors" :key="idx">{{ err }}</li>
          </ul>
        </v-alert>

        <div v-if="finalizeDownloadUrl" class="text-center">
          <v-btn
            :href="finalizeDownloadUrl"
            download
            color="primary"
            variant="flat"
            size="large"
            rounded="pill"
            prepend-icon="mdi-download"
          >
            Download Finalized Project (.zip)
          </v-btn>
        </div>
      </v-card>
    </v-fade-transition>
  </div>
</template>

<style scoped src="./UnityProjectPanel.css"></style>
