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

// Shared state so all components (App.vue, UnityProjectPanel, etc.) see the same project name/path.
// Otherwise "File > New Project" would only update App.vue's refs and the panel would not re-render.
const projectName = ref(getSession(NAME_KEY));
const projectPath = ref(getSession(PATH_KEY));
/** Incremented on reset so UI (e.g. Project Name field) can :key on it and remount when value is set programmatically. */
const sessionProjectResetKey = ref(0);

watch(projectName, (val) => setSession(NAME_KEY, val ?? ""), { immediate: false });
watch(projectPath, (val) => setSession(PATH_KEY, val ?? ""), { immediate: false });

/**
 * Session-scoped project name and path (sessionStorage).
 * Backend always derives project_path as base_path (output from settings) + project_name; never project_name alone.
 * Shared by App.vue sidebar and UnityProjectPanel; ScenesPanel sends project_name for createScene.
 *
 * State management: follows Vue's "global state from a Composable" pattern — refs at module scope
 * so all callers share the same reactive state. See https://vuejs.org/guide/scaling-up/state-management.html
 */
export function useSessionProject() {
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
    sessionProjectResetKey.value += 1;
  }

  return {
    projectName,
    projectPath,
    sessionProjectResetKey,
    setProjectName,
    setProjectPath,
    resetSessionProject,
  };
}
