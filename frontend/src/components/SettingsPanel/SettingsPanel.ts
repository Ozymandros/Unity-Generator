import { onMounted, ref } from "vue";
import { getPref, saveApiKeys, setPref, getApiKeys } from "@/api/client";
import {
  TEXT_PROVIDERS,
  IMAGE_PROVIDERS,
  AUDIO_PROVIDERS,
} from "@/constants/providers";

export function useSettingsPanel() {
  const backendUrl = ref(
    localStorage.getItem("backendUrl") || "http://127.0.0.1:8000",
  );
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
  const huggingfaceKey = ref("");
  const ollamaKey = ref("");
  const preferredLlm = ref("deepseek");
  const preferredImage = ref("stability");
  const preferredAudio = ref("elevenlabs");
  const defaultCodeSystemPrompt = ref("");
  const defaultTextSystemPrompt = ref("");
  const defaultImageSystemPrompt = ref("");
  const defaultAudioSystemPrompt = ref("");
  const defaultSpriteSystemPrompt = ref("");

  const status = ref<string | null>(null);

  const showModelManager = ref(false);
  const activeProviderForModal = ref("");

  function manageModels(provider: string) {
    activeProviderForModal.value = provider;
    showModelManager.value = true;
  }

  onMounted(async () => {
    const keysResponse = await getApiKeys();
    if (
      keysResponse?.success &&
      keysResponse.success &&
      keysResponse.data?.keys
    ) {
      const keys = keysResponse.data.keys as Record<string, string>;
      googleKey.value = keys.google_api_key || "";
      anthropicKey.value = keys.anthropic_api_key || "";
      openaiKey.value = keys.openai_api_key || "";
      deepseekKey.value = keys.deepseek_api_key || "";
      openrouterKey.value = keys.openrouter_api_key || "";
      groqKey.value = keys.groq_api_key || "";
      stabilityKey.value = keys.stability_api_key || "";
      fluxKey.value = keys.flux_api_key || "";
      elevenlabsKey.value = keys.elevenlabs_api_key || "";

      playhtKey.value = keys.playht_api_key || "";
      huggingfaceKey.value = keys.huggingface_api_key || "";
      ollamaKey.value = keys.ollama_api_key || "";
    }

    const llmPref = await getPref("preferred_llm_provider");
    const imagePref = await getPref("preferred_image_provider");
    const audioPref = await getPref("preferred_audio_provider");
    const codePromptPref = await getPref("default_code_system_prompt");
    const textPromptPref = await getPref("default_text_system_prompt");
    const imagePromptPref = await getPref("default_image_system_prompt");
    const audioPromptPref = await getPref("default_audio_system_prompt");
    const spritePromptPref = await getPref("default_sprite_system_prompt");

    preferredLlm.value = String(llmPref.data?.value || preferredLlm.value);
    preferredImage.value = String(
      imagePref.data?.value || preferredImage.value,
    );
    preferredAudio.value = String(
      audioPref.data?.value || preferredAudio.value,
    );
    defaultCodeSystemPrompt.value = String(codePromptPref.data?.value || "");
    defaultTextSystemPrompt.value = String(textPromptPref.data?.value || "");
    defaultImageSystemPrompt.value = String(imagePromptPref.data?.value || "");
    defaultAudioSystemPrompt.value = String(audioPromptPref.data?.value || "");
    defaultSpriteSystemPrompt.value = String(
      spritePromptPref.data?.value || "",
    );
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
      huggingface_api_key: huggingfaceKey.value,
      ollama_api_key: ollamaKey.value,
    });
    await setPref("preferred_llm_provider", preferredLlm.value);
    await setPref("preferred_image_provider", preferredImage.value);
    await setPref("preferred_audio_provider", preferredAudio.value);
    await setPref("default_code_system_prompt", defaultCodeSystemPrompt.value);
    await setPref("default_text_system_prompt", defaultTextSystemPrompt.value);
    await setPref(
      "default_image_system_prompt",
      defaultImageSystemPrompt.value,
    );
    await setPref(
      "default_audio_system_prompt",
      defaultAudioSystemPrompt.value,
    );
    await setPref(
      "default_sprite_system_prompt",
      defaultSpriteSystemPrompt.value,
    );

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
    huggingfaceKey,
    ollamaKey,
    preferredLlm,
    preferredImage,
    preferredAudio,
    defaultCodeSystemPrompt,
    defaultTextSystemPrompt,
    defaultImageSystemPrompt,
    defaultAudioSystemPrompt,
    defaultSpriteSystemPrompt,
    status,
    save,
    showModelManager,
    activeProviderForModal,
    manageModels,
    TEXT_PROVIDERS,
    IMAGE_PROVIDERS,
    AUDIO_PROVIDERS,
  };
}
