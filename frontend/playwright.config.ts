import { defineConfig } from "@playwright/test";

const port = process.env.PORT || process.env.VITE_PORT || "5173";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1280, height: 720 },
  },
  ...(process.env.CI ? {} : {
    webServer: {
      command: `pnpm exec vite --host 127.0.0.1 --port ${port}`,
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: true,
      timeout: 180000,
    },
  }),
  // Exclude frontend unit tests from Playwright (testDir is ./tests/e2e, ignore src unit specs)
  testIgnore: ["**/src/**/*.test.ts", "**/src/**/*.spec.ts", "**/src/**/*.test.js", "**/src/**/*.spec.js"],
});
