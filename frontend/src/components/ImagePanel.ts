import { ref } from "vue";
import { generateImage } from "../api/client";
import { IMAGE_PROVIDERS, ASPECT_RATIOS, QUALITY_OPTIONS } from "../constants/providers";

export function useImagePanel() {
  const prompt = ref("");
  const provider = ref("");
  const apiKey = ref("");
  const aspectRatio = ref("1:1");
  const quality = ref("standard");
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");

  async function run() {
    status.value = "Generating image...";
    tone.value = "ok";
    try {
      const response = await generateImage({
        prompt: prompt.value,
        provider: provider.value || undefined,
        options: { 
          aspect_ratio: aspectRatio.value,
          quality: quality.value,
          api_key: apiKey.value || undefined,
        },
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate image.";
        return;
      }
      status.value = "Image request complete.";
      result.value = JSON.stringify(response.data || {}, null, 2);
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  return {
    prompt,
    provider,
    apiKey,
    aspectRatio,
    quality,
    status,
    tone,
    result,
    run,
    IMAGE_PROVIDERS,
    ASPECT_RATIOS,
    QUALITY_OPTIONS
  };
}
