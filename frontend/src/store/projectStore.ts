import { reactive, watch } from "vue";

/**
 * Active project (auto-save target) — global reactive singleton, persisted to localStorage.
 * See https://vuejs.org/guide/scaling-up/state-management.html (simple state with reactivity API).
 */
export interface ProjectState {
  activeProjectName: string;
  activeProjectPath: string;
}

const STORAGE_KEY = "unity_generator_active_project";

function loadState(): ProjectState {
  if (typeof localStorage !== "undefined" && localStorage.getItem) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
  }
  return {
    activeProjectName: "",
    activeProjectPath: "",
  };
}

export const projectStore = reactive<ProjectState>(loadState());

watch(projectStore, (newState) => {
  if (typeof localStorage !== "undefined" && localStorage.setItem) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }
}, { deep: true });

export function setActiveProject(name: string, path: string) {
  projectStore.activeProjectName = name;
  projectStore.activeProjectPath = path;
}

export function clearActiveProject() {
  projectStore.activeProjectName = "";
  projectStore.activeProjectPath = "";
}
