import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Vite configuration for Unity Generator frontend.
 * 
 * Supports both development (Vite dev server) and production (Electron bundling) modes.
 * In Electron mode, the build output is configured for local file serving.
 * 
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      main: resolve(__dirname, "../main"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    /**
     * Enable HMR for Electron development.
     * In Electron, we need to allow connections from the Electron process.
     */
    host: "0.0.0.0",
    hmr: {
      protocol: "ws",
      port: 5173,
    },
  },
  /**
   * CRITICAL for Electron: Use relative paths for assets.
   * Without this, assets will have absolute paths like /assets/...
   * which don't work with file:// protocol in Electron.
   */
  base: "./",
  build: {
    /**
     * Configure output directory for Electron bundling.
     * In Electron, we serve the built files from a local directory.
     */
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "tests/**/*.spec.ts"],
    setupFiles: ["./src/test/setup.ts"],
    alias: {
      "@": resolve(__dirname, "./src"),
      main: resolve(__dirname, "../main"),
      "vue-router": resolve(__dirname, "./src/__mocks__/vue-router.ts"),
    },
    server: {
      deps: {
        inline: ["vuetify"],
      },
    },
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,vue}"],
      exclude: ["src/**/*.d.ts", "src/main.ts"],
    },
  },
});
