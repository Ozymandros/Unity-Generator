import { ref, onMounted, onUnmounted } from "vue";
import { useTheme as useVuetifyTheme } from "vuetify";

/** The three supported theme modes. */
export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "themeMode";
const DARK_THEME = "unityDarkTheme";
const LIGHT_THEME = "unityLightTheme";

/**
 * Composable for managing app-wide light / dark / system theme.
 *
 * Persists the user's choice in localStorage. In "system" mode the theme
 * automatically tracks the OS `prefers-color-scheme` media query.
 *
 * Should be called once at the app root (App.vue) so the media-query
 * listener lives for the full app lifetime. Calling it in child components
 * is safe — they share Vuetify's global reactive theme state.
 *
 * @returns themeMode  - reactive ref of the current mode
 * @returns setThemeMode - function to change the mode and persist it
 *
 * @example
 * ```ts
 * const { themeMode, setThemeMode } = useTheme();
 * setThemeMode("dark");
 * ```
 */
export function useTheme() {
  const vuetifyTheme = useVuetifyTheme();

  const storedMode = (localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? "dark";
  const themeMode = ref<ThemeMode>(storedMode);

  // Guard for test environments (jsdom) where matchMedia may not be implemented
  const systemMediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} } as unknown as MediaQueryList);

  /**
   * Resolve the Vuetify theme name from a given mode.
   *
   * @param mode - The theme mode to resolve.
   * @returns The Vuetify theme name string.
   */
  function resolveThemeName(mode: ThemeMode): string {
    if (mode === "system") {
      return systemMediaQuery.matches ? DARK_THEME : LIGHT_THEME;
    }
    return mode === "dark" ? DARK_THEME : LIGHT_THEME;
  }

  /**
   * Apply the resolved Vuetify theme for the given mode.
   *
   * @param mode - The theme mode to apply.
   */
  function applyTheme(mode: ThemeMode): void {
    vuetifyTheme.change(resolveThemeName(mode));
  }

  /**
   * Change the theme mode, persist it to localStorage, apply to Vuetify,
   * and sync the native OS chrome (title bar, menus) via Electron IPC if available.
   *
   * @param mode - The new theme mode to set.
   *
   * @example
   * ```ts
   * setThemeMode("system"); // follows OS preference
   * ```
   */
  function setThemeMode(mode: ThemeMode): void {
    if (mode !== "light" && mode !== "dark" && mode !== "system") {
      console.warn(`[useTheme] Invalid mode "${mode}" — ignoring.`);
      return;
    }
    themeMode.value = mode;
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
    // Sync native OS chrome when running inside Electron
    window.electronAPI?.nativeTheme?.setTheme(mode);
  }

  /** Re-apply theme when the OS preference changes (only active in "system" mode). */
  function handleSystemChange(): void {
    if (themeMode.value === "system") {
      applyTheme("system");
    }
  }

  onMounted(() => {
    applyTheme(themeMode.value);
    // Sync native OS chrome on startup with the persisted preference
    window.electronAPI?.nativeTheme?.setTheme(themeMode.value);
    systemMediaQuery.addEventListener("change", handleSystemChange);
  });

  onUnmounted(() => {
    systemMediaQuery.removeEventListener("change", handleSystemChange);
  });

  return { themeMode, setThemeMode };
}
