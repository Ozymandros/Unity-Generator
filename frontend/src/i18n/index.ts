/**
 * vue-i18n plugin setup.
 *
 * Registers all supported locales and initialises the i18n instance with the
 * locale persisted in localStorage (falls back to "en").
 *
 * Usage:
 *   import i18n from "@/i18n";
 *   app.use(i18n);
 *
 * In components:
 *   import { useI18n } from "vue-i18n";
 *   const { t } = useI18n();
 *   t("common.save") // → "Save"
 */

import { createI18n } from "vue-i18n";
import en from "./locales/en";
import es from "./locales/es";
import ca from "./locales/ca";
import eu from "./locales/eu";
import oc from "./locales/oc";
import uk from "./locales/uk";
import pt from "./locales/pt";
import gl from "./locales/gl";
import fr from "./locales/fr";
import it from "./locales/it";
import pl from "./locales/pl";
import zh from "./locales/zh";
import ar from "./locales/ar";
import de from "./locales/de";
import hi from "./locales/hi";
import bn from "./locales/bn";
import ur from "./locales/ur";
import id from "./locales/id";
import ja from "./locales/ja";
import vi from "./locales/vi";
import ko from "./locales/ko";

export type SupportedLocale =
  | "en" | "es" | "ca" | "eu" | "oc" | "uk"
  | "pt" | "gl" | "fr" | "it" | "pl" | "zh" | "ar" | "de"
  | "hi" | "bn" | "ur" | "id" | "ja" | "vi" | "ko";

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  "en", "es", "ca", "eu", "oc", "uk",
  "pt", "gl", "fr", "it", "pl", "zh", "ar", "de",
  "hi", "bn", "ur", "id", "ja", "vi", "ko",
];
export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_STORAGE_KEY = "appLocale";

/**
 * Read the persisted locale from localStorage, validating it is supported.
 *
 * @returns A valid SupportedLocale string.
 *
 * @example
 * ```ts
 * const locale = getPersistedLocale(); // "es"
 * ```
 */
export function getPersistedLocale(): SupportedLocale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && (SUPPORTED_LOCALES as string[]).includes(stored)) {
    return stored as SupportedLocale;
  }
  // Try to match the browser language
  const browserLang = navigator.language?.split("-")[0];
  if (browserLang && (SUPPORTED_LOCALES as string[]).includes(browserLang)) {
    return browserLang as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

const i18n = createI18n({
  legacy: false,           // Composition API mode
  locale: getPersistedLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, es, ca, eu, oc, uk, pt, gl, fr, it, pl, zh, ar, de, hi, bn, ur, id, ja, vi, ko },
  // Silence missing-key warnings in production
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
});

export default i18n;
