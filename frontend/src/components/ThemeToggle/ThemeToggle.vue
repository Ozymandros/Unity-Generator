<script setup lang="ts">
import { useTheme, type ThemeMode } from "@/composables/useTheme";

const { themeMode, setThemeMode } = useTheme();

const options: { mode: ThemeMode; icon: string; title: string }[] = [
  { mode: "light",  icon: "mdi-weather-sunny", title: "Light theme"  },
  { mode: "dark",   icon: "mdi-weather-night",  title: "Dark theme"   },
  { mode: "system", icon: "mdi-monitor",        title: "System theme" },
];
</script>

<template>
  <v-btn-toggle
    :model-value="themeMode"
    @update:model-value="setThemeMode"
    mandatory
    density="compact"
    variant="outlined"
    color="primary"
    rounded="lg"
    aria-label="Theme selector"
  >
    <v-btn
      v-for="opt in options"
      :key="opt.mode"
      :value="opt.mode"
      :icon="opt.icon"
      :title="opt.title"
      size="small"
    />
  </v-btn-toggle>
</template>
