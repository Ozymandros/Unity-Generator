import { onMounted, ref } from "vue";
import { getPref, saveApiKeys, setPref } from "../../api/client";
import { TEXT_PROVIDERS, IMAGE_PROVIDERS, AUDIO_PROVIDERS } from "../../constants/providers";

export function useSettingsPanel() {
  const backendUrl = ref(localStorage.getItem("backendUrl") || "http://127.0.0.1:8000");
  const googleKey = ref("");
  const anthropicKey = ref("");
  const openaiKey = ref("");
  const deepseekKey = ref("");
  const openrouterKey = ref("");
  const groqKey = ref("");
  const stabilityKey = ref("");
  const fluxKey = ref("");
  const elevenlabsKey = ref("");
  const playhtKey = ref("");
  const preferredLlm = ref("deepseek");
  const preferredImage = ref("stability");
  const preferredAudio = ref("elevenlabs");

  const status = ref<string | null>(null);

  onMounted(async () => {
    const llmPref = await getPref("preferred_llm_provider");
    const imagePref = await getPref("preferred_image_provider");
    const audioPref = await getPref("preferred_audio_provider");

    preferredLlm.value = String(llmPref.data?.value || preferredLlm.value);
    preferredImage.value = String(imagePref.data?.value || preferredImage.value);
    preferredAudio.value = String(audioPref.data?.value || preferredAudio.value);
  });

  async function save() {
    localStorage.setItem("backendUrl", backendUrl.value);
    const response = await saveApiKeys({
      google_api_key: googleKey.value,
      anthropic_api_key: anthropicKey.value,
      openai_api_key: openaiKey.value,
      deepseek_api_key: deepseekKey.value,
      openrouter_api_key: openrouterKey.value,
      groq_api_key: groqKey.value,
      stability_api_key: stabilityKey.value,
      flux_api_key: fluxKey.value,
      elevenlabs_api_key: elevenlabsKey.value,
      playht_api_key: playhtKey.value,
    });
    await setPref("preferred_llm_provider", preferredLlm.value);
    await setPref("preferred_image_provider", preferredImage.value);
    await setPref("preferred_audio_provider", preferredAudio.value);

    if (!response.success) {
      status.value = response.error || "Failed to save keys.";
      return;
    }
    status.value = "Saved locally.";
  }

  return {
    backendUrl,
    googleKey,
    anthropicKey,
    openaiKey,
    deepseekKey,
    openrouterKey,
    groqKey,
    stabilityKey,
    fluxKey,
    elevenlabsKey,
    playhtKey,
    preferredLlm,
    preferredImage,
    preferredAudio,
    status,
    save,
    TEXT_PROVIDERS,
    IMAGE_PROVIDERS,
    AUDIO_PROVIDERS
  };
}
