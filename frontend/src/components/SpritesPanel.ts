import { computed, ref, type CSSProperties } from "vue";
import { generateSprites } from "../api/client";
import { IMAGE_PROVIDERS } from "../constants/providers";

export function useSpritesPanel() {
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

  return {
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
  };
}
