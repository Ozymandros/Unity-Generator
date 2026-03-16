import "vuetify/styles";
import { createVuetify, type ThemeDefinition } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";

const unityDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#020617",
    surface: "#0f172a",
    "on-surface": "#ffffff",
    "surface-variant": "#1e293b",
    "on-surface-variant": "#ffffff",
    "on-background": "#ffffff",
    primary: "#38bdf8",
    "primary-darken-1": "#0ea5e9",
    secondary: "#818cf8",
    "secondary-darken-1": "#6366f1",
    error: "#f43f5e",
    info: "#0ea5e9",
    success: "#10b981",
    warning: "#f59e0b",
  },
};

const unityLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: "#f1f5f9",
    surface: "#ffffff",
    "on-surface": "#0f172a",
    "surface-variant": "#e2e8f0",
    "on-surface-variant": "#1e293b",
    "on-background": "#0f172a",
    primary: "#0284c7",
    "primary-darken-1": "#0369a1",
    secondary: "#6366f1",
    "secondary-darken-1": "#4f46e5",
    error: "#e11d48",
    info: "#0284c7",
    success: "#059669",
    warning: "#d97706",
  },
};

export default createVuetify({
  components,
  directives,
  defaults: {
    VTextField: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
    VSelect: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
    VTextarea: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
    VCheckbox: {
      color: "primary",
      density: "comfortable",
    },
    VBtn: {
      fontWeight: 600,
    },
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: "unityDarkTheme",
    themes: {
      unityDarkTheme,
      unityLightTheme,
    },
  },
});
