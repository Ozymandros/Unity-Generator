import { ref, watch } from "vue";

const NAME_KEY = "unity_session_project_name";
const PATH_KEY = "unity_session_project_path";

function getSession(key: string): string {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function setSession(key: string, value: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeSession(key: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Session-scoped project name and path (sessionStorage).
 * Backend always derives project_path as base_path (output from settings) + project_name; never project_name alone.
 * Shared by App.vue sidebar and UnityProjectPanel; ScenesPanel sends project_name for createScene.
 */
export function useSessionProject() {
  const projectName = ref(getSession(NAME_KEY));
  const projectPath = ref(getSession(PATH_KEY));

  watch(projectName, (val) => setSession(NAME_KEY, val ?? ""), { immediate: false });
  watch(projectPath, (val) => setSession(PATH_KEY, val ?? ""), { immediate: false });

  function setProjectName(name: string): void {
    projectName.value = name ?? "";
  }

  function setProjectPath(path: string): void {
    projectPath.value = path;
  }

  /**
   * Reset the session-scoped project fields to defaults.
   *
   * @param defaultName - Project name to set after reset.
   *
   * @example
   * ```ts
   * const { resetSessionProject } = useSessionProject();
   * resetSessionProject("UnityProject");
   * ```
   */
  function resetSessionProject(defaultName: string = "UnityProject"): void {
    removeSession(NAME_KEY);
    removeSession(PATH_KEY);
    projectPath.value = "";
    projectName.value = defaultName;
  }

  return {
    projectName,
    projectPath,
    setProjectName,
    setProjectPath,
    resetSessionProject,
  };
}
