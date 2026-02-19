import { ref, computed, onMounted } from "vue";
import { generateAudio, getPref } from "@/api/client";
import { AUDIO_PROVIDERS } from "@/constants/providers";
import { projectStore } from "@/store/projectStore";

export function useAudioPanel() {
  const prompt = ref("");
  const provider = ref("");
  const apiKey = ref("");
  const voiceId = ref("");
  const stability = ref(0.5);
  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");
  const systemPrompt = ref("");
  const defaultSystemPrompt = ref("Default: High quality sound effect...");
  const autoSaveToProject = ref(true);

  const activeProjectName = computed(() => projectStore.activeProjectName);

  onMounted(async () => {
    const pref = await getPref("default_audio_system_prompt");
    if (pref.success && pref.data?.value) {
      const val = String(pref.data.value);
      defaultSystemPrompt.value = val ? `Default: ${val.substring(0, 50)}...` : defaultSystemPrompt.value;
    }
  });

  const availableVoices = computed(() => {
    const p = AUDIO_PROVIDERS.find((x) => x.value === provider.value);
    return p ? p.models || [] : [];
  });

  async function run() {
    status.value = "Generating audio...";
    tone.value = "ok";
    try {
      const response = await generateAudio({
        prompt: prompt.value,
        system_prompt: systemPrompt.value || undefined,
        provider: provider.value || undefined,
        options: { 
          voice_id: voiceId.value || undefined,
          stability: stability.value,
          api_key: apiKey.value || undefined,
        },
        project_path: (autoSaveToProject.value && projectStore.activeProjectPath) || undefined
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate audio.";
        return;
      }
      status.value = "Audio request complete.";
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
    voiceId,
    stability,
    status,
    tone,
    result,
    systemPrompt,
    defaultSystemPrompt,
    autoSaveToProject,
    activeProjectName,
    availableVoices,
    run,
    AUDIO_PROVIDERS
  };
}
