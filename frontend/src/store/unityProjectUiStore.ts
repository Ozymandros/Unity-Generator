import { defineStore } from "pinia";

export type UnityProjectUiSettings = {
  // Unity Engine Settings
  installPackages: boolean;
  generateScene: boolean;
  setupUrp: boolean;
  packages: string;
  sceneName: string;
  editorPath: string;
  timeout: number;
  template: string;
  version: string;
  platform: string;
};

export type UnityProjectUiState = {
  /**
   * Last known status line shown to the user (banner).
   */
  status: string | null;

  /**
   * Whether the status should be presented as OK or ERROR.
   */
  tone: "ok" | "error";

  /**
   * Raw JSON result shown in the UI.
   */
  result: string;

  /**
   * Last project path produced by "Generate Base Project" or finalize.
   * Used as the default for "Open Folder" and finalize requests.
   */
  lastProjectPath: string;

  /**
   * Unity project generation/finalize settings.
   */
  settings: UnityProjectUiSettings;
};

const STORAGE_KEY = "unity_generator_unity_project_ui_v1";
let autoPersistEnabled = false;

function getDefaultState(): UnityProjectUiState {
  return {
    status: null,
    tone: "ok",
    result: "",
    lastProjectPath: "",
    settings: {
      installPackages: false,
      generateScene: false,
      setupUrp: false,
      packages: "com.unity.textmeshpro",
      sceneName: "MainScene",
      editorPath: "",
      timeout: 300,
      template: "",
      version: "",
      platform: "",
    },
  };
}

/**
 * Load the persisted Unity Project UI state from localStorage.
 *
 * @returns Persisted state if available and valid; otherwise default state.
 *
 * @example
 * ```ts
 * const store = useUnityProjectUiStore();
 * store.hydrateFromStorage();
 * ```
 */
function loadFromStorage(): UnityProjectUiState {
  if (typeof localStorage === "undefined" || !localStorage.getItem) {
    return getDefaultState();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultState();

  try {
    const parsed = JSON.parse(raw) as Partial<UnityProjectUiState> | null;
    if (!parsed || typeof parsed !== "object") return getDefaultState();

    const defaults = getDefaultState();
    const parsedSettings = parsed.settings;

    return {
      ...defaults,
      ...parsed,
      settings: {
        ...defaults.settings,
        ...(parsedSettings && typeof parsedSettings === "object" ? parsedSettings : {}),
      },
    };
  } catch {
    return getDefaultState();
  }
}

/**
 * Quick runtime sanity check that the storage layer is writable.
 * If this returns false in Electron, the app cannot persist UI state.
 */
function canWriteStorage(): boolean {
  if (typeof localStorage === "undefined" || !localStorage.setItem) return false;
  try {
    const k = `${STORAGE_KEY}__probe`;
    localStorage.setItem(k, "1");
    localStorage.removeItem?.(k);
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the Unity Project UI state to localStorage.
 *
 * @param state - Current UI state to persist.
 * @returns True if state was written, false otherwise.
 * @throws {Error} If state is not an object.
 *
 * @example
 * ```ts
 * const store = useUnityProjectUiStore();
 * store.persistToStorage();
 * ```
 */
function saveToStorage(state: UnityProjectUiState): boolean {
  if (!state || typeof state !== "object") {
    throw new Error("state must be a valid UnityProjectUiState object");
  }
  if (typeof localStorage === "undefined" || !localStorage.setItem) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export const useUnityProjectUiStore = defineStore("unityProjectUi", {
  state: (): UnityProjectUiState => loadFromStorage(),
  actions: {
    /**
     * Reset the Unity Project panel UI state to defaults and persist it.
     *
     * @example
     * ```ts
     * const store = useUnityProjectUiStore();
     * store.reset();
     * ```
     */
    reset(): void {
      const next = getDefaultState();
      // IMPORTANT: do not replace `settings` object to keep Vue bindings stable
      this.status = next.status;
      this.tone = next.tone;
      this.result = next.result;
      this.lastProjectPath = next.lastProjectPath;
      Object.assign(this.settings, next.settings);

      saveToStorage(this.$state);
    },

    /**
     * Persist the current in-memory state to localStorage.
     *
     * @example
     * ```ts
     * const store = useUnityProjectUiStore();
     * store.persistToStorage();
     * ```
     */
    persistToStorage(): void {
      saveToStorage(this.$state);
    },

    /**
     * Enable automatic persistence for this store instance.
     *
     * This is meant to be called once (e.g. from App.vue) so persistence does not
     * depend on whether a specific panel component is currently mounted.
     *
     * @example
     * ```ts
     * const store = useUnityProjectUiStore();
     * store.enableAutoPersist();
     * ```
     */
    enableAutoPersist(): void {
      if (autoPersistEnabled) return;
      autoPersistEnabled = true;
      if (!canWriteStorage()) {
        // Avoid spamming errors; persistence won't work in this environment.
        return;
      }
      this.$subscribe(() => {
        try {
          saveToStorage(this.$state);
        } catch {
          // Best-effort persistence
        }
      });
    },

    /**
     * Re-hydrate the store from localStorage (overwrites current state).
     *
     * @example
     * ```ts
     * const store = useUnityProjectUiStore();
     * store.hydrateFromStorage();
     * ```
     */
    hydrateFromStorage(): void {
      const next = loadFromStorage();
      // IMPORTANT: do not replace `settings` object to keep Vue bindings stable
      this.status = next.status;
      this.tone = next.tone;
      this.result = next.result;
      this.lastProjectPath = next.lastProjectPath;
      Object.assign(this.settings, next.settings);
    },
  },
});

