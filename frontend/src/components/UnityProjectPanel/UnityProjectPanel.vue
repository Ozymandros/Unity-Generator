<script setup lang="ts">
import { StatusBanner } from "@/components/StatusBanner";
import { PromptInputSection } from "@/components/generic/PromptInputSection";
import { SmartField } from "@/components/generic/SmartField";
import { useUnityProjectPanel } from "./UnityProjectPanel";

const {
  projectName,
  code,
  text,
  image,
  audio,
  settings,
  finalize,
  UNITY_TEMPLATES,
  UNITY_VERSIONS,
  UNITY_PLATFORMS,
  status,
  tone,
  result,
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
  STABILITY_PRESETS,
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


    <PromptInputSection
      label="Code Prompt"
      type="code"
      v-model="code.prompt"
      :provider="code.provider"
      :providers="TEXT_PROVIDERS"
      :options="code.options"
      @update:provider="val => code.provider = val"
      @update:options="val => code.options = val as any"
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
      v-model="text.prompt"
      :provider="text.provider"
      :providers="TEXT_PROVIDERS"
      :options="text.options"
      @update:provider="val => text.provider = val"
      @update:options="val => text.options = val as any"
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
      v-model="image.prompt"
      :provider="image.provider"
      :providers="IMAGE_PROVIDERS"
      :options="image.options"
      @update:provider="val => image.provider = val"
      @update:options="val => image.options = val as any"
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
      v-model="audio.prompt"
      :provider="audio.provider"
      :providers="AUDIO_PROVIDERS"
      :options="audio.options"
      @update:provider="val => audio.provider = val"
      @update:options="val => audio.options = val as any"
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
