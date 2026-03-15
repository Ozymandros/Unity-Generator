import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import {
  generateUnityProject,
  finalizeProject,
  getFinalizeJobStatus,
  downloadFinalizedProject,
  getUnityVersions,
  addUnityVersion,
  getLatestOutput,
  type UnityVersionOption,
} from "@/api/client";
import type { FinalizeJobStatusResponse } from "@/api/client";
import { 
  ASPECT_RATIOS, 
  QUALITY_OPTIONS, 
  TEMPERATURE_PRESETS, 
  LENGTH_PRESETS,
  STABILITY_PRESETS 
} from "@/constants/providers";
import { DEFAULT_PROJECT_NAME } from "@/api/constants";
import { FINALIZE_STATUS, UI_TONE } from "@/constants/finalize";
import { UNITY_TEMPLATES, UNITY_PLATFORMS } from "@/constants/unity";
import { electronShell } from "@/services/electronShell";
import { setActiveProject } from "@/store/projectStore";
import { useUnityProjectUiStore } from "@/store/unityProjectUiStore";
import { useSessionProject } from "@/composables/useSessionProject";
import { useOpenProject } from "@/composables/useOpenProject";

const DEFAULT_UNITY_VERSIONS: UnityVersionOption[] = [
  { value: "6000.3.2f1", label: "6000.3.2f1" },
];

export function useUnityProjectPanel() {
  const { projectName, projectPath, sessionProjectResetKey, setProjectPath } = useSessionProject();
  const { loadProject } = useOpenProject();
  const uiStore = useUnityProjectUiStore();

  // Unity Engine Settings
  // Use store object directly (do not wrap with reactive), so v-model remains stable across remounts
  const settings = uiStore.settings;


  // Finalize job state
  const finalize = reactive({
    jobId: "",
    status: null as FinalizeJobStatusResponse | null,
    logs: [] as string[],
    polling: false
  });
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const status = computed({
    get: () => uiStore.status,
    set: (v: string | null) => uiStore.$patch({ status: v }),
  });
  const tone = computed({
    get: () => uiStore.tone,
    set: (v: "ok" | "error") => uiStore.$patch({ tone: v }),
  });
  const result = computed({
    get: () => uiStore.result,
    set: (v: string) => uiStore.$patch({ result: v }),
  });
  const lastProjectPath = computed({
    get: () => uiStore.lastProjectPath,
    set: (v: string) => uiStore.$patch({ lastProjectPath: v }),
  });

  // Unity versions from API (user can add more); fallback to default if empty
  const unityVersions = ref<UnityVersionOption[]>(DEFAULT_UNITY_VERSIONS);
  const addVersionDialog = ref(false);
  const newVersionId = ref("");
  const newVersionLabel = ref("");
  const addVersionError = ref("");

  async function loadUnityVersions() {
    try {
      const res = await getUnityVersions();
      const list = (res.data as { versions?: UnityVersionOption[] } | null)?.versions;
      if (res.success && Array.isArray(list)) {
        unityVersions.value = list.length > 0 ? list : DEFAULT_UNITY_VERSIONS;
      } else {
        unityVersions.value = DEFAULT_UNITY_VERSIONS;
      }
    } catch {
      unityVersions.value = DEFAULT_UNITY_VERSIONS;
    }
  }

  function openAddVersionDialog() {
    newVersionId.value = "";
    newVersionLabel.value = "";
    addVersionError.value = "";
    addVersionDialog.value = true;
  }

  function closeAddVersionDialog() {
    addVersionDialog.value = false;
  }

  async function submitAddVersion() {
    const id = newVersionId.value.trim();
    const label = newVersionLabel.value.trim() || id;
    if (!id) {
      addVersionError.value = "Version ID is required (e.g. 6000.3.2f1).";
      return;
    }
    addVersionError.value = "";
    try {
      const res = await addUnityVersion({ value: id, label: label || id });
      if (!res.success) {
        addVersionError.value = res.error || "Failed to add version.";
        return;
      }
      const list = (res.data as { versions?: UnityVersionOption[] } | null)?.versions;
      if (Array.isArray(list)) {
        unityVersions.value = list;
        settings.version = id;
      }
      closeAddVersionDialog();
    } catch (e) {
      addVersionError.value = String(e);
    }
  }

  onMounted(() => {
    loadUnityVersions();
  });

  // Persistence is handled by the store (enableAutoPersist), so it doesn't depend on this panel being mounted.

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
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
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
        project_name: projectName.value?.trim() || DEFAULT_PROJECT_NAME,
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

  /**
   * Open a Unity project folder picker (Electron) and load the selected project.
   *
   * Delegates to the main process via `unityProject.openPicker` which shows a
   * native folder dialog with the correct parent window reference (avoids the
   * detached-dialog bug on Windows). The main process also validates that the
   * selected folder is a Unity project before returning the path.
   *
   * @example
   * ```typescript
   * await openOutputFolder();
   * // Populates version/template fields and updates status
   * ```
   */
  async function openOutputFolder(): Promise<void> {
    const api = window.electronAPI;

    if (api?.unityProject?.openPicker) {
      try {
        const pickerResult = await api.unityProject.openPicker();

        if (pickerResult.canceled) return;

        if (pickerResult.error || !pickerResult.projectPath) {
          tone.value = UI_TONE.ERROR;
          status.value = pickerResult.error || "No project path returned.";
          return;
        }

        const selectedPath = pickerResult.projectPath;

        // Load project: sets name, path, scans for version/packages/template
        await loadProject(selectedPath);
        lastProjectPath.value = selectedPath;

        // Only set success status if loadProject didn't surface an error
        if (uiStore.tone !== UI_TONE.ERROR) {
          const folderName = selectedPath.replace(/\\/g, "/").split("/").pop() || selectedPath;
          status.value = `Opened project: ${folderName}`;
          tone.value = UI_TONE.OK;
        }
      } catch (error) {
        tone.value = UI_TONE.ERROR;
        status.value = `Failed to open project: ${String(error)}`;
      }
      return;
    }

    // Non-Electron fallback: open the known project path, or fetch latest from backend
    let knownPath = lastProjectPath.value || projectPath.value;
    if (!knownPath) {
      try {
        const latest = await getLatestOutput();
        knownPath = latest.success ? String(latest.data?.path || "") : "";
      } catch {
        knownPath = "";
      }
    }

    if (!knownPath) {
      tone.value = UI_TONE.ERROR;
      status.value = "No project path set. Generate a project first.";
      return;
    }

    try {
      const shellResult = await electronShell.openPath(knownPath);
      if (shellResult.success) {
        status.value = "Opened output folder.";
        tone.value = UI_TONE.OK;
      } else {
        tone.value = UI_TONE.ERROR;
        status.value = `Failed to open folder: ${shellResult.error || "Unknown error"}`;
      }
    } catch (error) {
      tone.value = UI_TONE.ERROR;
      status.value = `Failed to open folder: ${error}`;
    }
  }

  onUnmounted(() => {
    stopPolling();
  });

  return {
    projectName,
    sessionProjectResetKey,
    settings,
    finalize,
    UNITY_TEMPLATES,
    unityVersions,
    UNITY_PLATFORMS,
    loadUnityVersions,
    addVersionDialog,
    newVersionId,
    newVersionLabel,
    addVersionError,
    openAddVersionDialog,
    closeAddVersionDialog,
    submitAddVersion,
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
