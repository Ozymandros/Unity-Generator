import { ref, computed, onUnmounted, reactive } from "vue";
import {
  generateUnityProject,
  getLatestOutput,
  finalizeProject,
  getFinalizeJobStatus,
  downloadFinalizedProject,
} from "@/api/client";
import type { FinalizeJobStatusResponse } from "@/api/client";
import { 
  ASPECT_RATIOS, 
  QUALITY_OPTIONS, 
  TEMPERATURE_PRESETS, 
  LENGTH_PRESETS,
  STABILITY_PRESETS 
} from "@/constants/providers";
import { FINALIZE_STATUS, UI_TONE } from "@/constants/finalize";
import { 
  UNITY_TEMPLATES, 
  UNITY_VERSIONS, 
  UNITY_PLATFORMS 
} from "@/constants/unity";
import { setActiveProject } from "@/store/projectStore";
import { useSessionProject } from "@/composables/useSessionProject";

export function useUnityProjectPanel() {
  const { projectName, projectPath, setProjectPath } = useSessionProject();

  // Unity Engine Settings
  const settings = reactive({
    installPackages: false,
    generateScene: false,
    setupUrp: false,
    packages: "com.unity.textmeshpro",
    sceneName: "MainScene",
    editorPath: "",
    timeout: 300,
    template: "",
    version: "",
    platform: ""
  });


  // Finalize job state
  const finalize = reactive({
    jobId: "",
    status: null as FinalizeJobStatusResponse | null,
    logs: [] as string[],
    polling: false
  });
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const status = ref<string | null>(null);
  const tone = ref<"ok" | "error">(UI_TONE.OK);
  const result = ref("");
  const lastProjectPath = ref("");

  const availableVoices = computed(() => {
    return [];
  });

  const isFinalizing = computed(() => {
    if (!finalize.status) return false;
    const s = finalize.status.status;
    return s === FINALIZE_STATUS.PENDING || s === FINALIZE_STATUS.RUNNING;
  });

  const finalizeProgress = computed(() => {
    return finalize.status?.progress ?? 0;
  });

  const finalizeStep = computed(() => {
    return finalize.status?.step ?? "";
  });

  const finalizeDownloadUrl = computed(() => {
    if (
      finalize.status?.status === FINALIZE_STATUS.COMPLETED &&
      finalize.status?.zip_path
    ) {
      return downloadFinalizedProject(finalize.jobId);
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
    tone.value = UI_TONE.OK;
    // Validation: required fields
    if (!projectName.value.trim()) {
      tone.value = UI_TONE.ERROR;
      status.value = "Project name is required.";
      return;
    }
    if (!settings.template) {
      tone.value = UI_TONE.ERROR;
      status.value = "Unity template selection is required.";
      return;
    }
    if (!settings.version) {
      tone.value = UI_TONE.ERROR;
      status.value = "Unity version selection is required.";
      return;
    }
    if (!settings.platform) {
      tone.value = UI_TONE.ERROR;
      status.value = "Target platform selection is required.";
      return;
    }
    try {
      const response = await generateUnityProject({
        project_name: projectName.value,
        unity_template: settings.template,
        unity_version: settings.version,
        unity_platform: settings.platform,
      });
      if (!response.success) {
        tone.value = UI_TONE.ERROR;
        status.value = response.error || "Failed to generate project.";
        return;
      }
      status.value = "Unity project generated.";
      result.value = JSON.stringify(response.data || {}, null, 2);
      const path = String(response.data?.project_path || "");
      lastProjectPath.value = path;
      if (path) {
        setProjectPath(path);
        setActiveProject(projectName.value, path);
      }
    } catch (error) {
      tone.value = UI_TONE.ERROR;
      status.value = String(error);
    }
  }

  async function runFinalize() {
    status.value = "Starting finalize workflow...";
    tone.value = UI_TONE.OK;
    finalize.logs = [];
    finalize.status = null;

    try {
      const packages = settings.installPackages
        ? settings.packages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const response = await finalizeProject({
        project_name: projectName.value,
        project_path: lastProjectPath.value || projectPath.value || undefined,
        unity_settings: {
          install_packages: settings.installPackages,
          generate_scene: settings.generateScene,
          setup_urp: settings.setupUrp,
          packages,
          scene_name: settings.sceneName,
          unity_editor_path: settings.editorPath || undefined,
          timeout: settings.timeout,
        },
      });

      if (!response.success) {
        tone.value = UI_TONE.ERROR;
        status.value = "Failed to create finalize job.";
        return;
      }

      finalize.jobId = response.job_id;
      status.value = `Finalize job started (${response.job_id})`;
      startPolling();
    } catch (error) {
      tone.value = UI_TONE.ERROR;
      status.value = String(error);
    }
  }

  function startPolling() {
    stopPolling();
    finalize.polling = true;
    pollTimer = setInterval(pollStatus, 2000);
  }

  function stopPolling() {
    finalize.polling = false;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function pollStatus() {
    if (!finalize.jobId) {
      stopPolling();
      return;
    }
    try {
      const statusResp = await getFinalizeJobStatus(finalize.jobId);
      finalize.status = statusResp;
      finalize.logs = statusResp.logs_tail || [];

      if (statusResp.status === FINALIZE_STATUS.COMPLETED) {
        stopPolling();
        tone.value = UI_TONE.OK;
        status.value = "Finalization completed successfully!";
        const path = statusResp.project_path || "";
        lastProjectPath.value = path;
        if (path) setProjectPath(path);
      } else if (statusResp.status === FINALIZE_STATUS.FAILED) {
        stopPolling();
        tone.value = UI_TONE.ERROR;
        const errMsg = statusResp.errors?.join("; ") || "Unknown error";
        status.value = `Finalization failed: ${errMsg}`;
      }
    } catch (error) {
      stopPolling();
      tone.value = UI_TONE.ERROR;
      status.value = `Polling error: ${String(error)}`;
    }
  }

  async function openOutputFolder() {
    try {
      const pathForFolder = lastProjectPath.value || projectPath.value;
      const response: { success: boolean; data?: Record<string, unknown> | null; error?: string | null } =
        pathForFolder
          ? { success: true, data: { path: pathForFolder } }
          : await getLatestOutput();

      if (!response.success) {
        tone.value = UI_TONE.ERROR;
        status.value = response.error || "No output folder found.";
        return;
      }

      const data = response.data && typeof response.data === "object" ? response.data : undefined;
      const path = String((data as { path?: string } | undefined)?.path || "");
      if (!path) {
        tone.value = UI_TONE.ERROR;
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
      tone.value = UI_TONE.ERROR;
      status.value = `Open failed: ${String(error)}`;
    }
  }

  onUnmounted(() => {
    stopPolling();
  });

  return {
    projectName,
    settings,
    finalize,
    UNITY_TEMPLATES,
    UNITY_VERSIONS,
    UNITY_PLATFORMS,
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
    ASPECT_RATIOS,
    QUALITY_OPTIONS,
    TEMPERATURE_PRESETS,
    LENGTH_PRESETS,
    STABILITY_PRESETS,
    FINALIZE_STATUS,
    UI_TONE
  };
}
