import { ref, computed, onUnmounted } from "vue";
import {
  generateUnityProject,
  getLatestOutput,
  finalizeProject,
  getFinalizeJobStatus,
  downloadFinalizedProject,
} from "../api/client";
import type { FinalizeJobStatusResponse } from "../api/client";
import { 
  TEXT_PROVIDERS, 
  IMAGE_PROVIDERS, 
  AUDIO_PROVIDERS, 
  ASPECT_RATIOS, 
  QUALITY_OPTIONS, 
  TEMPERATURE_PRESETS, 
  LENGTH_PRESETS,
  STABILITY_PRESETS 
} from "../constants/providers";

export function useUnityProjectPanel() {
  const projectName = ref("UnityProject");
  // Code
  const codePrompt = ref("");
  const codeProvider = ref("");
  const codeOptions = ref({ temperature: 0.7, max_tokens: 2048 });
  // Text
  const textPrompt = ref("");
  const textProvider = ref("");
  const textOptions = ref({ temperature: 0.7, max_tokens: 2048 });
  // Image
  const imagePrompt = ref("");
  const imageProvider = ref("");
  const imageOptions = ref({ aspect_ratio: "1:1", quality: "standard" });
  // Audio
  const audioPrompt = ref("");
  const audioProvider = ref("");
  const audioOptions = ref({ voice_id: "", stability: 0.5 });

  // Unity Engine Settings
  const unityInstallPackages = ref(false);
  const unityGenerateScene = ref(false);
  const unitySetupUrp = ref(false);
  const unityPackages = ref("com.unity.textmeshpro");
  const unitySceneName = ref("MainScene");
  const unityEditorPath = ref("");
  const unityTimeout = ref(300);
  const unityTemplate = ref("");
  const unityVersion = ref("");
  const unityPlatform = ref("");
  const UNITY_TEMPLATES = [
    { value: "2d", label: "2D" },
    { value: "3d", label: "3D" },
    { value: "urp", label: "Universal Render Pipeline (URP)" },
    { value: "hdrp", label: "High Definition Render Pipeline (HDRP)" },
    { value: "mobile", label: "Mobile" },
    { value: "vr", label: "VR" },
  ];
  const UNITY_VERSIONS = [
    { value: "2022.3", label: "2022.3 LTS" },
    { value: "2021.3", label: "2021.3 LTS" },
    { value: "2023.1", label: "2023.1" },
  ];
  const UNITY_PLATFORMS = [
    { value: "windows", label: "Windows" },
    { value: "mac", label: "macOS" },
    { value: "linux", label: "Linux" },
    { value: "android", label: "Android" },
    { value: "ios", label: "iOS" },
  ];

  // Finalize job state
  const finalizeJobId = ref("");
  const finalizeStatus = ref<FinalizeJobStatusResponse | null>(null);
  const finalizeLogs = ref<string[]>([]);
  const finalizePolling = ref(false);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">("ok");
  const result = ref("");
  const lastProjectPath = ref("");

  const availableVoices = computed(() => {
    const p = AUDIO_PROVIDERS.find((x) => x.value === audioProvider.value);
    return p ? p.models || [] : [];
  });

  const isFinalizing = computed(() => {
    if (!finalizeStatus.value) return false;
    return ["pending", "running"].includes(finalizeStatus.value.status);
  });

  const finalizeProgress = computed(() => {
    return finalizeStatus.value?.progress ?? 0;
  });

  const finalizeStep = computed(() => {
    return finalizeStatus.value?.step ?? "";
  });

  const finalizeDownloadUrl = computed(() => {
    if (
      finalizeStatus.value?.status === "completed" &&
      finalizeStatus.value?.zip_path
    ) {
      return downloadFinalizedProject(finalizeJobId.value);
    }
    return "";
  });

  async function openWithTauri(path: string) {
    const tauri = (window as unknown as { __TAURI__?: { shell?: { open: (path: string) => Promise<void> } } })
      .__TAURI__;
    if (!tauri?.shell?.open) {
      return false;
    }
    await tauri.shell.open(path);
    return true;
  }

  async function run() {
    status.value = "Generating Unity project...";
    tone.value = "ok";
    // Validation: required fields
    if (!projectName.value.trim()) {
      tone.value = "error";
      status.value = "Project name is required.";
      return;
    }
    if (!unityTemplate.value) {
      tone.value = "error";
      status.value = "Unity template selection is required.";
      return;
    }
    if (!unityVersion.value) {
      tone.value = "error";
      status.value = "Unity version selection is required.";
      return;
    }
    if (!unityPlatform.value) {
      tone.value = "error";
      status.value = "Target platform selection is required.";
      return;
    }
    try {
      const response = await generateUnityProject({
        project_name: projectName.value,
        code_prompt: codePrompt.value || undefined,
        text_prompt: textPrompt.value || undefined,
        image_prompt: imagePrompt.value || undefined,
        audio_prompt: audioPrompt.value || undefined,
        provider_overrides: {
          code: codeProvider.value || undefined,
          text: textProvider.value || undefined,
          image: imageProvider.value || undefined,
          audio: audioProvider.value || undefined,
        },
        options: {
          code: { ...codeOptions.value },
          text: { ...textOptions.value },
          image: { ...imageOptions.value },
          audio: { ...audioOptions.value },
        },
        unity_template: unityTemplate.value,
        unity_version: unityVersion.value,
        unity_platform: unityPlatform.value,
      });
      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "Failed to generate project.";
        return;
      }
      status.value = "Unity project generated.";
      result.value = JSON.stringify(response.data || {}, null, 2);
      lastProjectPath.value = String(response.data?.project_path || "");
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  async function runFinalize() {
    status.value = "Starting finalize workflow...";
    tone.value = "ok";
    finalizeLogs.value = [];
    finalizeStatus.value = null;

    try {
      const packages = unityInstallPackages.value
        ? unityPackages.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const response = await finalizeProject({
        project_name: projectName.value,
        project_path: lastProjectPath.value || undefined,
        code_prompt: codePrompt.value || undefined,
        text_prompt: textPrompt.value || undefined,
        image_prompt: imagePrompt.value || undefined,
        audio_prompt: audioPrompt.value || undefined,
        provider_overrides: {
          code: codeProvider.value || undefined,
          text: textProvider.value || undefined,
          image: imageProvider.value || undefined,
          audio: audioProvider.value || undefined,
        },
        options: {
          code: { ...codeOptions.value },
          text: { ...textOptions.value },
          image: { ...imageOptions.value },
          audio: { ...audioOptions.value },
        },
        unity_settings: {
          install_packages: unityInstallPackages.value,
          generate_scene: unityGenerateScene.value,
          setup_urp: unitySetupUrp.value,
          packages,
          scene_name: unitySceneName.value,
          unity_editor_path: unityEditorPath.value || undefined,
          timeout: unityTimeout.value,
        },
      });

      if (!response.success) {
        tone.value = "error";
        status.value = "Failed to create finalize job.";
        return;
      }

      finalizeJobId.value = response.job_id;
      status.value = `Finalize job started (${response.job_id})`;
      startPolling();
    } catch (error) {
      tone.value = "error";
      status.value = String(error);
    }
  }

  function startPolling() {
    stopPolling();
    finalizePolling.value = true;
    pollTimer = setInterval(pollStatus, 2000);
  }

  function stopPolling() {
    finalizePolling.value = false;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function pollStatus() {
    if (!finalizeJobId.value) {
      stopPolling();
      return;
    }
    try {
      const statusResp = await getFinalizeJobStatus(finalizeJobId.value);
      finalizeStatus.value = statusResp;
      finalizeLogs.value = statusResp.logs_tail || [];

      if (statusResp.status === "completed") {
        stopPolling();
        tone.value = "ok";
        status.value = "Finalization completed successfully!";
        lastProjectPath.value = statusResp.project_path || "";
      } else if (statusResp.status === "failed") {
        stopPolling();
        tone.value = "error";
        const errMsg = statusResp.errors?.join("; ") || "Unknown error";
        status.value = `Finalization failed: ${errMsg}`;
      }
    } catch (error) {
      stopPolling();
      tone.value = "error";
      status.value = `Polling error: ${String(error)}`;
    }
  }

  async function openOutputFolder() {
    try {
      const response: { success: boolean; data?: Record<string, unknown> | null; error?: string | null } =
        lastProjectPath.value
          ? { success: true, data: { path: lastProjectPath.value } }
          : await getLatestOutput();

      if (!response.success) {
        tone.value = "error";
        status.value = response.error || "No output folder found.";
        return;
      }

      const data = response.data && typeof response.data === "object" ? response.data : undefined;
      const path = String((data as { path?: string } | undefined)?.path || "");
      if (!path) {
        tone.value = "error";
        status.value = "No output folder found.";
        return;
      }

      try {
        const opened = await openWithTauri(path);
        if (opened) {
          status.value = "Opened output folder.";
        } else {
          status.value = `Path: ${path} (Tauri not available in web build)`;
        }
      } catch (tauriError) {
        status.value = `Path: ${path} (Failed to open in Tauri: ${String(tauriError)})`;
      }
    } catch (error) {
      tone.value = "error";
      status.value = `Open failed: ${String(error)}`;
    }
  }

  onUnmounted(() => {
    stopPolling();
  });

  return {
    projectName,
    codePrompt,
    codeProvider,
    codeOptions,
    textPrompt,
    textProvider,
    textOptions,
    imagePrompt,
    imageProvider,
    imageOptions,
    audioPrompt,
    audioProvider,
    audioOptions,
    unityInstallPackages,
    unityGenerateScene,
    unitySetupUrp,
    unityPackages,
    unitySceneName,
    unityEditorPath,
    unityTimeout,
    unityTemplate,
    unityVersion,
    unityPlatform,
    UNITY_TEMPLATES,
    UNITY_VERSIONS,
    UNITY_PLATFORMS,
    finalizeJobId,
    finalizeStatus,
    finalizeLogs,
    finalizePolling,
    status,
    tone,
    result,
    lastProjectPath,
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
    STABILITY_PRESETS
  };
}
