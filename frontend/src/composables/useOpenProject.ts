import { setActiveProject } from "@/store/projectStore";
import { useSessionProject } from "@/composables/useSessionProject";
import { useUnityProjectUiStore } from "@/store/unityProjectUiStore";

/**
 * Infer Unity template from installed packages.
 * Returns the best-match template value or empty string if unknown.
 *
 * @param packages - List of UPM package names from manifest.json.
 * @returns Template value string (e.g. "urp", "hdrp", "vr") or "".
 *
 * @example
 * ```typescript
 * inferTemplate(["com.unity.render-pipelines.universal"]) // "urp"
 * inferTemplate(["com.unity.xr.openxr"])                  // "vr"
 * inferTemplate([])                                        // ""
 * ```
 */
function inferTemplate(packages: string[]): string {
  if (packages.some((p) => p.includes("render-pipelines.high-definition"))) return "hdrp";
  if (packages.some((p) => p.includes("render-pipelines.universal"))) return "urp";
  if (packages.some((p) => p.includes(".xr.") || p.includes("xr.openxr") || p.includes("xr.management"))) return "vr";
  if (packages.some((p) => p.includes("com.unity.2d.") || p === "com.unity.feature.2d")) return "2d";
  return "";
}

/**
 * Shared composable for loading a Unity project folder into app state.
 *
 * Extracts project name from the path, scans the folder for Unity metadata
 * (version, packages) via Electron IPC, and populates the UI store.
 * Both the File > Open Project menu handler and the "Open Folder" button use this.
 *
 * @returns `loadProject` — call with an absolute folder path to activate it.
 *
 * @example
 * ```typescript
 * const { loadProject } = useOpenProject();
 * await loadProject("C:/Projects/MyGame");
 * ```
 */
export function useOpenProject() {
  const { setProjectName, setProjectPath } = useSessionProject();
  const uiStore = useUnityProjectUiStore();

  /**
   * Load a Unity project folder into shared app state.
   *
   * Sets the session project name and path, updates the UI store with
   * version/packages read from the project folder (best-effort, Electron only),
   * and registers the project as the active project.
   *
   * @param projectPath - Absolute path to the Unity project root.
   *
   * @example
   * ```typescript
   * await loadProject("C:/Projects/MyGame");
   * ```
   */
  async function loadProject(projectPath: string): Promise<void> {
    if (!projectPath) return;

    const pathParts = projectPath.replace(/\\/g, "/").split("/");
    const folderName = pathParts[pathParts.length - 1] || "UnityProject";

    setProjectPath(projectPath);
    setProjectName(folderName);
    setActiveProject(folderName, projectPath);

    // Best-effort: scan project folder for Unity metadata (Electron only)
    if (!window.electronAPI?.unityProject?.scan) {
      // Not running in Electron or preload not loaded — skip scan silently
      return;
    }
    try {
      const scan = await window.electronAPI.unityProject.scan(projectPath);
      if (!scan?.success || !scan?.data) {
        // Scan failed (e.g. not a valid Unity project folder) — store the error
        // in the UI store so the status banner can show it
        uiStore.status = scan?.error ?? "Could not read project metadata.";
        uiStore.tone = "error";
        return;
      }
      const { unityVersion, packages, unityTemplate, unityPlatform } = scan.data;
      if (unityVersion?.trim()) {
        uiStore.settings.version = unityVersion.trim();
      }
      // Template: prefer explicit metadata, fall back to package inference
      if (unityTemplate?.trim()) {
        uiStore.settings.template = unityTemplate.trim();
      } else if (packages.length > 0) {
        const inferredTemplate = inferTemplate(packages);
        if (inferredTemplate) {
          uiStore.settings.template = inferredTemplate;
        }
      }
      // Platform: use explicit metadata if available
      if (unityPlatform?.trim()) {
        uiStore.settings.platform = unityPlatform.trim();
      }
      if (packages.length > 0) {
        uiStore.settings.installPackages = true;
        uiStore.settings.packages = packages.join(", ");
      }
    } catch (err) {
      // Scan is best-effort; surface the error so it's visible in the UI
      uiStore.status = `Scan error: ${err instanceof Error ? err.message : String(err)}`;
      uiStore.tone = "error";
    }
  }

  return { loadProject };
}
