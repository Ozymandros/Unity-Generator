/**
 * useLocale composable
 *
 * Manages the app-wide interface language. Reads the initial locale from the
 * backend DB (via the intelligence store's preferences), persists changes both
 * to localStorage (for instant reactivity) and to the backend DB via setPref,
 * and syncs with the Electron main process via IPC.
 *
 * Should be called once at the app root (App.vue). Child components that
 * only need `t()` should use `useI18n()` from vue-i18n directly.
 *
 * @example
 * ```ts
 * // App.vue
 * const { locale, setLocale } = useLocale();
 * ```
 */

import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { setPref } from "@/api/client";
import { useIntelligenceStore } from "@/store/intelligenceStore";
import {
  SUPPORTED_LOCALES,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/i18n";

/**
 * Change the active locale, persist it, and optionally sync with Electron.
 *
 * @param newLocale - A supported locale code ("en" | "es" | "ca").
 *
 * @example
 * ```ts
 * const { setLocale } = useLocale();
 * setLocale("es");
 * ```
 */
export function useLocale() {
  const { locale, t } = useI18n({ useScope: "global" });
  const store = useIntelligenceStore();

  // On first call, sync the vue-i18n locale from the DB-sourced store preference.
  // The store is loaded by App.vue before this composable runs in child components.
  const dbLocale = store.getPreference("preferred_locale") as SupportedLocale | "";
  if (dbLocale && (SUPPORTED_LOCALES as string[]).includes(dbLocale)) {
    locale.value = dbLocale;
    localStorage.setItem(LOCALE_STORAGE_KEY, dbLocale);
  }

  // Keep vue-i18n in sync if the store preference changes (e.g. after store.load())
  watch(
    () => store.getPreference("preferred_locale"),
    (newVal) => {
      if (newVal && (SUPPORTED_LOCALES as string[]).includes(newVal) && newVal !== locale.value) {
        locale.value = newVal as SupportedLocale;
        localStorage.setItem(LOCALE_STORAGE_KEY, newVal);
      }
    },
  );

  /** Reactive read of the current locale code. */
  const currentLocale = computed(() => locale.value as SupportedLocale);

  /**
   * Set the active locale, persist to localStorage + backend DB, and sync with Electron IPC.
   *
   * @param newLocale - Target locale. Must be one of the supported locales.
   */
  function setLocale(newLocale: SupportedLocale): void {
    if (!(SUPPORTED_LOCALES as string[]).includes(newLocale)) {
      console.warn(`[useLocale] Unsupported locale "${newLocale}" — ignoring.`);
      return;
    }
    locale.value = newLocale;
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    // Persist to backend DB — fire-and-forget; errors are non-fatal
    setPref("preferred_locale", newLocale).catch((err: unknown) => {
      console.warn("[useLocale] Failed to persist locale to backend:", err);
    });
    // Keep store in sync so other components reading the preference see the new value
    store.setPreference("preferred_locale", newLocale);
    // Sync Electron main process so native menus reload in the new language
    window.electronAPI?.i18n?.load(newLocale).catch((err: unknown) => {
      console.warn("[useLocale] Electron i18n sync failed:", err);
    });
  }

  /**
   * List of all supported locales with their display names, translated via i18n.
   * Useful for building a language selector.
   *
   * @example
   * ```ts
   * const { localeOptions } = useLocale();
   * // [{ value: "en", label: "English" }, { value: "es", label: "Español" }, ...]
   * ```
   */
  const localeOptions = computed(() =>
    SUPPORTED_LOCALES.map((code) => ({
      value: code,
      label: t(`languages.${code}`) as string,
    }))
  );

  return { currentLocale, setLocale, localeOptions, supportedLocales: SUPPORTED_LOCALES };
}

export { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale };
