import { onMounted, ref, computed } from "vue";
import { getPref, setPref } from "@/api/client";
import {
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  AUDIO_PROVIDERS,
} from "@/constants/providers";

export function useSettingsPanel() {
  const backendUrl = ref(
    localStorage.getItem("backendUrl") || "http://127.0.0.1:8000",
  );
  
  const preferredLlm = ref("deepseek");
  const preferredImage = ref("stability");
  const preferredAudio = ref("openai");
  const preferredMusic = ref("replicate");
  
  const status = ref<string | null>(null);

  const openSections = ref<Record<string, boolean>>({
    providers: true,
  });

  const toggleSection = (section: string) => {
    openSections.value[section] = !openSections.value[section];
  };

  const selectedAudioType = computed(() => {
    const provider = AUDIO_PROVIDERS.find((p) => p.value === preferredAudio.value);
    return provider?.type || "tts";
  });

  const selectedMusicType = computed(() => {
    const provider = AUDIO_PROVIDERS.find((p) => p.value === preferredMusic.value);
    return provider?.type || "music";
  });

  onMounted(async () => {
    const llmPref = await getPref("preferred_llm_provider");
    const imagePref = await getPref("preferred_image_provider");
    const audioPref = await getPref("preferred_audio_provider");
    const musicPref = await getPref("preferred_music_provider");
    
    preferredLlm.value = String(llmPref.data?.value || preferredLlm.value);
    preferredImage.value = String(imagePref.data?.value || preferredImage.value);
    preferredAudio.value = String(audioPref.data?.value || preferredAudio.value);
    preferredMusic.value = String(musicPref.data?.value || preferredMusic.value);
  });

  async function save() {
    localStorage.setItem("backendUrl", backendUrl.value);
    
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
        status.value = "Preferences saved locally.";
      }
    } catch {
      status.value = "Network error";
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
    selectedAudioType,
    selectedMusicType,
    openSections,
    toggleSection,
    TEXT_PROVIDERS,
    IMAGE_PROVIDERS,
    AUDIO_PROVIDERS,
  };
}
