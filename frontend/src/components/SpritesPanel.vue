<script setup lang="ts">
import StatusBanner from "./StatusBanner.vue";
import { useSpritesPanel } from "./SpritesPanel";

const {
  prompt,
  provider,
  apiKey,
  resolution,
  paletteSize,
  autoCrop,
  status,
  tone,
  resultImage,
  resultMeta,
  RESOLUTIONS,
  PALETTE_SIZES,
  run,
  canvasStyle,
  IMAGE_PROVIDERS
} = useSpritesPanel();
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

<style scoped src="./SpritesPanel.css"></style>
