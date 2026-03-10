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
    },
  },
});
