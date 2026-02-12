<script setup lang="ts">
import StatusBanner from "./StatusBanner.vue";
import PromptInputSection from "./generic/PromptInputSection.vue";
import SmartField from "./generic/SmartField.vue";
import { useUnityProjectPanel } from "./UnityProjectPanel";

const {
  projectName,
  codePrompt,
  codeProvider,
  codeOptions,
  textPrompt,
  textProvider,
  textOptions,
  imagePrompt,
  imageProvider,
  imageOptions,
  audioPrompt,
  audioProvider,
  audioOptions,
  unityInstallPackages,
  unityGenerateScene,
  unitySetupUrp,
  unityPackages,
  unitySceneName,
  unityEditorPath,
  unityTimeout,
  unityTemplate,
  unityVersion,
  unityPlatform,
  UNITY_TEMPLATES,
  UNITY_VERSIONS,
  UNITY_PLATFORMS,
  finalizeJobId,
  finalizeStatus,
  finalizeLogs,
  finalizePolling,
  status,
  tone,
  result,
  lastProjectPath,
  availableVoices,
  isFinalizing,
  finalizeProgress,
  finalizeStep,
  finalizeDownloadUrl,
  run,
  runFinalize,
  openOutputFolder,
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  AUDIO_PROVIDERS,
  ASPECT_RATIOS,
  QUALITY_OPTIONS,
  TEMPERATURE_PRESETS,
  LENGTH_PRESETS,
  STABILITY_PRESETS
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
        v-model="unityTemplate" 
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
          v-model="unityVersion" 
          :options="UNITY_VERSIONS" 
          placeholder="Select version..."
          required 
        />
      </div>
      <div class="field-sm">
        <SmartField 
          label="Target Platform" 
          type="select" 
          v-model="unityPlatform" 
          :options="UNITY_PLATFORMS" 
          placeholder="Select platform..."
          required 
        />
      </div>
    </div>


    <PromptInputSection
      label="Code Prompt"
      type="code"
      v-model="codePrompt"
      :provider="codeProvider"
      :providers="TEXT_PROVIDERS"
      :options="codeOptions"
      @update:provider="val => codeProvider = val"
      @update:options="val => codeOptions = val"
    >
      <template #options="{ options, updateOptions }">
        <div class="options-row">
          <div class="field-sm">
            <SmartField 
              label="Temp" 
              type="select" 
              :model-value="options.temperature" 
              @update:model-value="val => updateOptions({ temperature: Number(val) })"
              :options="TEMPERATURE_PRESETS" 
            />
          </div>
          <div class="field-sm">
            <SmartField 
              label="Max Tokens" 
              type="select" 
              :model-value="options.max_tokens" 
              @update:model-value="val => updateOptions({ max_tokens: Number(val) })"
              :options="LENGTH_PRESETS" 
            />
          </div>
        </div>
      </template>
    </PromptInputSection>

    <PromptInputSection
      label="Text Prompt"
      type="text"
      v-model="textPrompt"
      :provider="textProvider"
      :providers="TEXT_PROVIDERS"
      :options="textOptions"
      @update:provider="val => textProvider = val"
      @update:options="val => textOptions = val"
    >
      <template #options="{ options, updateOptions }">
        <div class="options-row">
          <div class="field-sm">
            <SmartField 
              label="Temp" 
              type="select" 
              :model-value="options.temperature" 
              @update:model-value="val => updateOptions({ temperature: Number(val) })"
              :options="TEMPERATURE_PRESETS" 
            />
          </div>
          <div class="field-sm">
            <SmartField 
              label="Max Tokens" 
              type="select" 
              :model-value="options.max_tokens" 
              @update:model-value="val => updateOptions({ max_tokens: Number(val) })"
              :options="LENGTH_PRESETS" 
            />
          </div>
        </div>
      </template>
    </PromptInputSection>

    <PromptInputSection
      label="Image Prompt"
      type="image"
      v-model="imagePrompt"
      :provider="imageProvider"
      :providers="IMAGE_PROVIDERS"
      :options="imageOptions"
      @update:provider="val => imageProvider = val"
      @update:options="val => imageOptions = val"
    >
      <template #options="{ options, updateOptions }">
        <div class="options-row">
          <div class="field-sm">
            <SmartField 
              label="Aspect Ratio" 
              type="select" 
              :model-value="options.aspect_ratio" 
              @update:model-value="val => updateOptions({ aspect_ratio: String(val) })"
              :options="ASPECT_RATIOS" 
            />
          </div>
          <div class="field-sm">
            <SmartField 
              label="Quality" 
              type="select" 
              :model-value="options.quality" 
              @update:model-value="val => updateOptions({ quality: String(val) })"
              :options="QUALITY_OPTIONS" 
            />
          </div>
        </div>
      </template>
    </PromptInputSection>

    <PromptInputSection
      label="Audio Prompt"
      type="audio"
      v-model="audioPrompt"
      :provider="audioProvider"
      :providers="AUDIO_PROVIDERS"
      :options="audioOptions"
      @update:provider="val => audioProvider = val"
      @update:options="val => audioOptions = val"
    >
      <template #options="{ options, updateOptions }">
        <div class="options-row">
          <div class="field-sm">
            <SmartField 
              label="Voice ID" 
              type="select" 
              :model-value="options.voice_id" 
              @update:model-value="val => updateOptions({ voice_id: String(val) })"
              :options="[{ label: 'Default / Random', value: '' }, ...availableVoices]" 
            />
          </div>
          <div class="field-sm">
            <SmartField 
              label="Stability" 
              type="select" 
              :model-value="options.stability" 
              @update:model-value="val => updateOptions({ stability: Number(val) })"
              :options="STABILITY_PRESETS" 
            />
          </div>
        </div>
      </template>
    </PromptInputSection>


    <button class="primary" @click="run">Generate Project</button>
    <button class="secondary" @click="openOutputFolder">Open Output Folder</button>

    <div class="field">
      <SmartField label="Result (JSON)" type="textarea" v-model="result" :rows="10" disabled />
    </div>

    <!-- Unity Engine Settings -->
    <h3>Unity Engine Settings</h3>
    <div class="section-group">
       <div class="toggle-row">
         <SmartField type="checkbox" label="Generate Default Scene" v-model="unityGenerateScene" />
         <SmartField type="checkbox" label="Auto-Install UPM Packages" v-model="unityInstallPackages" />
         <SmartField type="checkbox" label="Setup URP" v-model="unitySetupUrp" />
       </div>
 
       <div v-if="unityInstallPackages" class="field">
         <SmartField 
           label="UPM Packages (comma-separated)" 
           v-model="unityPackages" 
           placeholder="com.unity.textmeshpro, com.unity.render-pipelines.universal" 
         />
       </div>
 
       <div v-if="unityGenerateScene" class="field">
         <SmartField 
           label="Scene Name" 
           v-model="unitySceneName" 
           placeholder="MainScene" 
         />
       </div>
 
       <div class="options-row">
         <div class="field-sm">
           <SmartField 
             label="Unity Editor Path (optional)" 
             v-model="unityEditorPath" 
             placeholder="Auto-detect or UNITY_EDITOR_PATH env var" 
           />
         </div>
         <div class="field-sm">
           <SmartField 
             label="Timeout (seconds)" 
             type="number" 
             v-model="unityTimeout" 
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

<style scoped src="./UnityProjectPanel.css"></style>
