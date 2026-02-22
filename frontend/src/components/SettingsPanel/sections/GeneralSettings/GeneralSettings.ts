import { onMounted, ref } from "vue";
import { getPref, setPref } from "@/api/client";
import {
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  AUDIO_PROVIDERS,
} from "@/constants/providers";

export function useGeneralSettings() {
  const backendUrl = ref(
    localStorage.getItem("backendUrl") || "http://127.0.0.1:8000",
  );
  
  const preferredLlm = ref("deepseek");
  const preferredImage = ref("stability");
  const preferredAudio = ref("openai");
  const preferredMusic = ref("replicate");
  
  const status = ref<string | null>(null);

  onMounted(async () => {
    try {
      const results = await Promise.all([
        getPref("preferred_llm_provider"),
        getPref("preferred_image_provider"),
        getPref("preferred_audio_provider"),
        getPref("preferred_music_provider"),
      ]);
      
      const [llmPref, imagePref, audioPref, musicPref] = results;
      
      if (llmPref.success) preferredLlm.value = String(llmPref.data?.value || preferredLlm.value);
      if (imagePref.success) preferredImage.value = String(imagePref.data?.value || preferredImage.value);
      if (audioPref.success) preferredAudio.value = String(audioPref.data?.value || preferredAudio.value);
      if (musicPref.success) preferredMusic.value = String(musicPref.data?.value || preferredMusic.value);
    } catch (e) {
      console.error("Failed to load preferences", e);
    }
  });

  async function save() {
    localStorage.setItem("backendUrl", backendUrl.value);
    status.value = "Saving...";
    
    try {
      const results = await Promise.all([
        setPref("preferred_llm_provider", preferredLlm.value),
        setPref("preferred_image_provider", preferredImage.value),
        setPref("preferred_audio_provider", preferredAudio.value),
        setPref("preferred_music_provider", preferredMusic.value),
      ]);

      const errorResult = results.find(r => !r.success);
      if (errorResult) {
        status.value = errorResult.error || "Save failed";
      } else {
        status.value = "Preferences saved successfully.";
        setTimeout(() => status.value = null, 3000);
      }
    } catch {
      status.value = "Network error: Failed to reach backend.";
    }
  }

  return {
    backendUrl,
    preferredLlm,
    preferredImage,
    preferredAudio,
    preferredMusic,
    status,
    save,
    TEXT_PROVIDERS,
    IMAGE_PROVIDERS,
    AUDIO_PROVIDERS,
  };
}
