import { defineConfig, mergeConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config
export default defineConfig({
  root: resolve(__dirname, 'frontend'),
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/src'),
      main: resolve(__dirname, 'main'),
    },
  },
  build: {
    outDir: resolve(__dirname, '.vite/renderer/main_window'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'frontend/index.html'),
    },
  },
});
