<script lang="ts">
export default {};
</script>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from "vue";
import StatusBanner from "./StatusBanner.vue";
import { generateSprites } from "../api/client";
import { IMAGE_PROVIDERS } from "../constants/providers";

const prompt = ref("");
const provider = ref("");
const apiKey = ref("");
const resolution = ref(64);
const paletteSize = ref(32);
const autoCrop = ref(false);

const status = ref<string | null>(null);
const tone = ref<"ok" | "error">("ok");
const resultImage = ref("");
const resultMeta = ref<Record<string, unknown> | null>(null);

const RESOLUTIONS = [16, 32, 64, 128, 256];
const PALETTE_SIZES = [8, 16, 32, 64, 256];

async function run() {
  if (!prompt.value) {
    tone.value = "error";
    status.value = "Please enter a prompt.";
    return;
  }

  status.value = "Generating sprite...";
  tone.value = "ok";
  resultImage.value = "";
  
  try {
    const response = await generateSprites({
      prompt: prompt.value,
      provider: provider.value || undefined,
      api_key: apiKey.value || undefined,
      resolution: resolution.value,
      options: {
        palette_size: paletteSize.value,
        auto_crop: autoCrop.value
      },
    });

    if (!response.success) {
      tone.value = "error";
      status.value = response.error || "Failed to generate sprite.";
      return;
    }

    status.value = "Sprite generated.";
    if (response.data && typeof response.data.image === 'string') {
        resultImage.value = `data:image/png;base64,${response.data.image}`;
        resultMeta.value = response.data;
    }
  } catch (error) {
    tone.value = "error";
    status.value = String(error);
  }
}

// Canvas Preview Logic (Basic for now)
const canvasStyle = computed((): CSSProperties => {
    // Zoom in for pixel art preview
    return {
        imageRendering: 'pixelated' as "auto", // Cast to one of the accepted union types to satisfy TS while keeping runtime value
        width: `${resolution.value * 4}px`, // 4x Zoom
        height: 'auto',
        border: '1px solid #ccc',
        background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="8" height="8" fill="%23f0f0f0"/><rect x="8" y="8" width="8" height="8" fill="%23f0f0f0"/></svg>')`
    };
});
</script>

<template>
  <div class="panel">
    <div class="header">
        <h2>2D Sprites</h2>
        <div class="badge">Pixel Art Optimized</div>
    </div>
    
    <StatusBanner :status="status" :tone="tone" />

    <div class="content-grid">
        <!-- Controls Sidebar -->
        <div class="sidebar">
            <div class="field">
                <label>Prompt</label>
                <textarea v-model="prompt" rows="3" placeholder="e.g. A pixel art sword, fire enchantment"></textarea>
            </div>

            <div class="field-group">
                <div class="field">
                    <label>Provider</label>
                    <select v-model="provider">
                        <option value="" disabled>Select Provider</option>
                        <option v-for="p in IMAGE_PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
                    </select>
                </div>
                
                <div class="field">
                    <label>Resolution</label>
                    <div class="toggle-group">
                         <button 
                            v-for="res in RESOLUTIONS" 
                            :key="res"
                            :class="{ active: resolution === res }"
                            @click="resolution = res"
                         >
                            {{ res }}x
                         </button>
                    </div>
                </div>

                <div class="field">
                     <label>Palette Size</label>
                     <select v-model.number="paletteSize">
                        <option v-for="s in PALETTE_SIZES" :key="s" :value="s">{{ s }} colors</option>
                     </select>
                </div>

                <div class="field checkbox">
                    <input type="checkbox" id="crop" v-model="autoCrop">
                    <label for="crop">Auto-Crop Transparent Edges</label>
                </div>
                
                <div class="field" style="margin-top: 8px;">
                    <label>API Key (Optional)</label>
                    <input v-model="apiKey" type="password" placeholder="Key override" />
                </div>
            </div>

            <button class="primary" @click="run">Generate Sprite</button>
        </div>

        <!-- Main Preview Area -->
        <div class="preview-area">
            <div v-if="resultImage" class="canvas-container">
                <img :src="resultImage" :style="canvasStyle" />
                <div class="meta" v-if="resultMeta">
                    <p>{{ resultMeta.resolution }}x{{ resultMeta.resolution }}px</p>
                    <p>{{ resultMeta.provider }}</p>
                </div>
            </div>
            <div v-else class="placeholder">
                <p>Preview Area</p>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  max-width: 100%;
}
.header {
    display: flex;
    align-items: center;
    gap: 12px;
}
.badge {
    background: #e0f2fe;
    color: #0369a1;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}
.content-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 24px;
    margin-top: 16px;
}
.sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.preview-area {
    background: #1e293b;
    border-radius: 8px;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #94a3b8;
}
.canvas-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}
.meta {
    text-align: center;
    font-size: 0.8rem;
    color: #cbd5e1;
}
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 5px;
}
.field-group {
    background: #fff;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.toggle-group {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}
.toggle-group button {
    padding: 4px 8px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
}
.toggle-group button.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
}
.checkbox {
    flex-direction: row;
    align-items: center;
    gap: 8px;
}
label {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 4px;
    color: #475569;
}
textarea,
input[type="password"],
select {
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}
.primary {
  padding: 12px 14px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}
.primary:hover {
    background: #1d4ed8;
}
</style>
